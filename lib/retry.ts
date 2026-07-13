/**
 * TASK-018: Retry utility with exponential backoff and jitter.
 *
 * Provides configurable retry logic for transient failures with
 * structured logging for observability. Includes a total duration
 * guard to prevent exceeding serverless function timeouts.
 */

export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxAttempts?: number;
  /** Base delay in milliseconds (default: 1000) */
  baseDelayMs?: number;
  /** Maximum delay cap in milliseconds (default: 16000) */
  maxDelayMs?: number;
  /** Total duration cap in milliseconds — aborts retries if exceeded (default: 25000) */
  maxTotalDurationMs?: number;
  /** Predicate to classify if an error is retryable (default: all errors retryable) */
  isRetryable?: (error: unknown) => boolean;
  /** Callback invoked on each retry attempt for logging */
  onRetry?: (attempt: number, error: unknown, delayMs: number) => void;
  /** Callback invoked when all retries are exhausted or duration cap is hit */
  onExhausted?: (error: unknown, attempts: number, reason: 'max_attempts' | 'duration_exceeded') => void;
}

export interface RetryResult<T> {
  /** The successful result if all retries succeed */
  data?: T;
  /** The final error if all retries are exhausted */
  error?: unknown;
  /** Whether the operation succeeded */
  success: boolean;
  /** Total number of attempts made (including initial) */
  attempts: number;
}

/**
 * Execute an async operation with exponential backoff retry.
 *
 * Backoff progression: 1s → 4s → 16s (power of 4 scaling)
 * with jitter to prevent retry storms.
 *
 * @param fn - The async operation to retry
 * @param options - Retry configuration
 * @returns RetryResult with success/error state and attempt count
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<RetryResult<T>> {
  const {
    maxAttempts = 3,
    baseDelayMs = 1000,
    maxDelayMs = 16000,
    maxTotalDurationMs = 25000,
    isRetryable = () => true,
    onRetry,
    onExhausted,
  } = options;

  const startTime = Date.now();
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await fn();
      return { data: result, success: true, attempts: attempt };
    } catch (error) {
      lastError = error;

      // Check if we should retry
      const isLastAttempt = attempt === maxAttempts;
      const elapsed = Date.now() - startTime;
      const withinDurationBudget = elapsed < maxTotalDurationMs;
      const shouldRetry = !isLastAttempt && isRetryable(error) && withinDurationBudget;

      if (!shouldRetry) {
        const reason = !withinDurationBudget ? 'duration_exceeded' : 'max_attempts';
        if (onExhausted) {
          onExhausted(error, attempt, reason);
        }
        return { error, success: false, attempts: attempt };
      }

      // Calculate exponential backoff: baseDelayMs * 4^(attempt-1)
      // Attempt 1: 1000ms, Attempt 2: 4000ms, Attempt 3: 16000ms
      const exponentialDelay = baseDelayMs * Math.pow(4, attempt - 1);
      const cappedDelay = Math.min(exponentialDelay, maxDelayMs);

      // Add jitter: ±20% of the delay
      const jitterRange = cappedDelay * 0.2;
      const jitter = (Math.random() * 2 - 1) * jitterRange;
      const delayWithJitter = Math.round(cappedDelay + jitter);

      // Notify caller of retry
      if (onRetry) {
        onRetry(attempt, error, delayWithJitter);
      }

      // Wait before next attempt
      await new Promise((resolve) => setTimeout(resolve, delayWithJitter));
    }
  }

  // This should never be reached, but TypeScript needs it
  if (onExhausted) {
    onExhausted(lastError, maxAttempts, 'max_attempts');
  }
  return { error: lastError, success: false, attempts: maxAttempts };
}

/**
 * Check if an HTTP status code represents a transient error.
 * Transient errors are retryable (5xx, 429 rate limit).
 */
export function isTransientHttpError(status: number): boolean {
  // 429 Too Many Requests - transient, retryable
  if (status === 429) return true;
  // 5xx Server Errors - transient, retryable
  if (status >= 500 && status < 600) return true;
  // 4xx Client Errors (except 429) - permanent, not retryable
  return false;
}

/**
 * Check if an error is a network-level failure (fetch failed, DNS, etc.)
 * Network errors are always transient and retryable.
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) {
    // TypeError is thrown by fetch on network failures
    return error.message.includes('fetch') || error.message.includes('network');
  }
  if (error instanceof Error) {
    const name = error.name.toLowerCase();
    return (
      name.includes('network') ||
      name.includes('timeout') ||
      name.includes('econnrefused') ||
      name.includes('econnreset')
    );
  }
  return false;
}
