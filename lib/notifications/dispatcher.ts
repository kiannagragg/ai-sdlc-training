import { after } from 'next/server';
import { retryWithBackoff, isTransientHttpError, isNetworkError } from '@/lib/retry';

const RESEND_API_URL = 'https://api.resend.com/emails';

/** Notification types for structured logging */
export type NotificationType =
  | 'leave_submitted'
  | 'leave_cancelled'
  | 'leave_approved'
  | 'leave_rejected'
  | 'balance_override';

interface EmailParams {
  to: string;
  subject: string;
  html: string;
  from?: string;
  /** Notification type for structured logging */
  notificationType: NotificationType;
}

/** Custom error class to classify permanent vs transient failures */
class ResendPermanentError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = 'ResendPermanentError';
  }
}

/**
 * TASK-018: Hardened notification dispatcher with retry logic.
 *
 * - Returns immediately without blocking the caller (fire-and-forget via after())
 * - Retries transient failures up to 3 times with exponential backoff (1s, 4s, 16s)
 * - Permanent failures logged with no retry
 * - All failures logged and swallowed (never throws)
 *
 * Callers: this function is synchronous and returns void. Execution is scheduled
 * safely inside Next.js 16's after() handler, which keeps the serverless runtime
 * alive until the promise resolves. Do NOT await this function.
 */
export function sendEmailNotification(params: EmailParams): void {
  const requestId = crypto.randomUUID();
  const action = 'send_email';

  after(async () => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error(JSON.stringify({
        timestamp: new Date().toISOString(),
        requestId,
        action,
        notificationType: params.notificationType,
        recipient: params.to,
        outcome: 'config_error',
        error: 'RESEND_API_KEY not configured',
      }));
      return;
    }

    const from = params.from ?? process.env.RESEND_FROM_EMAIL ?? 'Meridian LMS <noreply@meridianlms.com>';

    await retryWithBackoff(
      async () => {
        const attemptStart = Date.now();

        const payload = JSON.stringify({
          from,
          to: params.to,
          subject: params.subject,
          html: params.html,
        });

        const response = await fetch(RESEND_API_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: payload,
        });

        if (!response.ok) {
          const errorText = await response.text();
          const payloadSizeBytes = Buffer.byteLength(payload, 'utf8');

          // Log rejection with payload diagnostics for all non-2xx responses
          console.error(JSON.stringify({
            timestamp: new Date().toISOString(),
            requestId,
            action,
            notificationType: params.notificationType,
            recipient: params.to,
            statusCode: response.status,
            payloadSizeBytes,
            durationMs: Date.now() - attemptStart,
            error: errorText,
          }));

          // Classify 4xx (except 429) as permanent — do not retry
          if (response.status >= 400 && response.status < 500 && response.status !== 429) {
            throw new ResendPermanentError(
              `Resend API rejected payload: ${response.status}: ${errorText}`,
              response.status,
            );
          }

          // 5xx and 429 are transient — will be retried by onRetry
          throw new Error(`Resend API error ${response.status}: ${errorText}`);
        }

        // Success log
        console.info(JSON.stringify({
          timestamp: new Date().toISOString(),
          requestId,
          action,
          notificationType: params.notificationType,
          recipient: params.to,
          subject: params.subject,
          durationMs: Date.now() - attemptStart,
          outcome: 'sent',
        }));
      },
      {
        maxAttempts: 3,
        baseDelayMs: 1000,
        maxDelayMs: 16000,
        maxTotalDurationMs: 25000,
        isRetryable: (error: unknown) => {
          // Permanent errors — no retry
          if (error instanceof ResendPermanentError) return false;
          // Network errors — always retry
          if (isNetworkError(error)) return true;
          // HTTP errors from Resend — classify by status
          if (error instanceof Error && error.message.includes('Resend API error')) {
            const statusMatch = error.message.match(/Resend API error (\d+)/);
            if (statusMatch) {
              return isTransientHttpError(parseInt(statusMatch[1], 10));
            }
          }
          return false;
        },
        onRetry: (attempt, error, delayMs) => {
          console.error(JSON.stringify({
            timestamp: new Date().toISOString(),
            requestId,
            action,
            notificationType: params.notificationType,
            recipient: params.to,
            attempt,
            outcome: 'retry',
            delayMs,
            error: error instanceof Error ? error.message : String(error),
          }));
        },
        onExhausted: (error, attempts, reason) => {
          console.error(JSON.stringify({
            timestamp: new Date().toISOString(),
            requestId,
            action,
            notificationType: params.notificationType,
            recipient: params.to,
            attempts,
            outcome: reason === 'duration_exceeded' ? 'duration_exceeded' : 'exhausted',
            error: error instanceof Error ? error.message : String(error),
          }));
        },
      },
    );
  });
}
