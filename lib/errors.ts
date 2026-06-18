import { ZodError } from 'zod';

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'AUTH_ERROR'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'BALANCE_EXCEEDED'
  | 'INTERNAL_ERROR'
  | 'RATE_LIMITED';

const ERROR_STATUS: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 400,
  AUTH_ERROR: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  BALANCE_EXCEEDED: 422,
  INTERNAL_ERROR: 500,
  RATE_LIMITED: 429,
};

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public details?: { field: string; message: string; code: string }[],
  ) {
    super(message);
    this.name = 'AppError';
  }

  get httpStatus(): number {
    return ERROR_STATUS[this.code];
  }

  toResponse(requestId: string): Response {
    return Response.json(
      {
        error: {
          code: this.code,
          message: this.message,
          details: this.details ?? [],
          requestId,
        },
      },
      { status: this.httpStatus },
    );
  }
}

export function handleApiError(error: unknown, requestId: string): Response {
  if (error instanceof AppError) {
    return error.toResponse(requestId);
  }

  if (error instanceof ZodError) {
    const issues = 'issues' in error ? (error as unknown as { issues: Array<{ path: (string | number)[]; message: string; code: string }> }).issues : [];
    const details = issues.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
      code: e.code,
    }));

    const appError = new AppError('VALIDATION_ERROR', 'Validation failed', details);
    return appError.toResponse(requestId);
  }

  const message =
    error instanceof Error ? error.message : 'An unexpected error occurred';
  const appError = new AppError('INTERNAL_ERROR', message);
  return appError.toResponse(requestId);
}

export function logError(
  requestId: string,
  action: string,
  error: unknown,
  duration?: number,
): void {
  const timestamp = new Date().toISOString();
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;

  const logEntry: Record<string, unknown> = {
    timestamp,
    requestId,
    action,
    message,
  };

  if (stack) {
    logEntry.stack = stack;
  }

  if (duration !== undefined) {
    logEntry.durationMs = duration;
  }

  if (error instanceof AppError) {
    logEntry.code = error.code;
    logEntry.details = error.details;
  }

  console.error(JSON.stringify(logEntry));
}
