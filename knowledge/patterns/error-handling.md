# Error Handling Patterns

## AppError Class

`AppError` is the unified error class across all layers.

```typescript
// lib/errors.ts
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }
}
```

### Usage Per Layer

| Layer | Code Prefix | Example |
|---|---|---|
| **Client** | `UI_*` | `UI_VALIDATION_ERROR`, `UI_NETWORK_ERROR` |
| **Server** | Server operation | `AUTH_ERROR`, `VALIDATION_ERROR`, `NOT_FOUND`, `FORBIDDEN`, `CONFLICT` |
| **Database** | `DB_*` | `DB_CONNECTION_ERROR`, `DB_UNIQUE_VIOLATION`, `DB_FOREIGN_KEY_VIOLATION` |

### Common Error Codes

| Code | Status | Description |
|---|---|---|
| `AUTH_ERROR` | 401 | Not authenticated / session expired |
| `FORBIDDEN` | 403 | Authenticated but not authorized |
| `NOT_FOUND` | 404 | Resource does not exist |
| `VALIDATION_ERROR` | 400 | Input failed Zod validation |
| `CONFLICT` | 409 | Resource already exists / duplicate |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

## Error Response Format

Every API error returns this shape:

```typescript
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Start date is required",
    "details": {
      "field": "start_date",
      "rule": "required",
      "received": undefined
    }
  },
  "requestId": "LR-2026-0042"
}
```

### Response Codes by Layer

```
4xx — Client error (bad request, auth, validation)
5xx — Server error (DB down, unexpected exception)
```

## Request ID Format

```
{prefix}-{year}-{sequence}
```

| Prefix | Usage |
|---|---|
| `LR` | Leave Request |
| `USR` | User management |
| `NOT` | Notification |
| `ADM` | Admin operations |
| `API` | General API |
| `UI` | Client-side errors |

Generate with:

```typescript
function generateRequestId(prefix: string = 'API'): string {
  const year = new Date().getFullYear();
  const seq = String(Math.floor(Math.random() * 9999)).padStart(4, '0');
  return `${prefix}-${year}-${seq}`;
}
```

Or use `crypto.randomUUID()` for distributed uniqueness.

## logError Usage

```typescript
import { logError } from '@/lib/errors';

// Server (route handlers)
try {
  // ...
} catch (error) {
  logError(requestId, 'POST /api/leave-requests', error, Date.now() - start);
  return handleApiError(error, requestId);
}

// Server (route handlers using AppError)
import { AppError, handleApiError, logError } from '@/lib/errors';
```

The `logError` function writes structured JSON to the server log:

```typescript
export function logError(
  requestId: string,
  operation: string,
  error: unknown,
  durationMs: number
): void {
  console.error(JSON.stringify({
    level: 'error',
    requestId,
    operation,
    durationMs,
    error: error instanceof AppError
      ? { code: error.code, message: error.message, details: error.details }
      : { code: 'UNKNOWN', message: String(error) },
    timestamp: new Date().toISOString(),
  }));
}
```

## handleApiError

```typescript
export function handleApiError(error: unknown, requestId: string): NextResponse {
  if (error instanceof AppError) {
    return NextResponse.json(
      { error: { code: error.code, message: error.message, details: error.details }, requestId },
      { status: error.statusCode }
    );
  }

  if (error instanceof z.ZodError) {
    return NextResponse.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: error.errors.map(e => ({ path: e.path.join('.'), message: e.message })),
        },
        requestId,
      },
      { status: 400 }
    );
  }

  // Default: unknown error
  return NextResponse.json(
    { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }, requestId },
    { status: 500 }
  );
}
```

## Client Error Display Patterns

| Pattern | Component | Behavior |
|---|---|---|
| **Inline** | Field-level error | `<p className="text-xs text-red-500">{error}</p>` below input |
| **Toast** | Action feedback | `sonner` toast for success / failure after form submission |
| **Modal** | Critical errors | Full-screen error modal for network down, session expired |

### Inline (Field-level)

```typescript
{errors.startDate && (
  <p className="text-xs text-red-500 mt-1">{errors.startDate.message}</p>
)}
```

### Toast (Action Feedback)

```typescript
import { toast } from 'sonner';

try {
  await submitLeaveRequest(data);
  toast.success('Leave request submitted');
} catch (error) {
  toast.error(error instanceof AppError ? error.message : 'Something went wrong');
}
```

### Modal (Critical Errors)

```typescript
import { ErrorDialog } from '@/components/ui/error-dialog';

{criticalError && (
  <ErrorDialog
    title="Session Expired"
    message="Please sign in again to continue."
    action={{ label: 'Sign In', href: '/auth/login' }}
  />
)}
```
