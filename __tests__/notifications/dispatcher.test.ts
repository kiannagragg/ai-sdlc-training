/*
 * TASK-018 — Unit Tests for Hardened Notification Dispatcher
 *
 * Tests: retry logic, exponential backoff, permanent vs transient failure handling,
 *        structured logging, fire-and-forget behavior, requestId persistence,
 *        payload diagnostics, and duration budget.
 */

import { sendEmailNotification, NotificationType } from '@/lib/notifications/dispatcher';

// Mock next/server after() to execute callback immediately
jest.mock('next/server', () => ({
  after: jest.fn((cb: () => Promise<void>) => cb()),
}));

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock console methods to capture logs
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
const mockConsoleInfo = jest.spyOn(console, 'info').mockImplementation();

// Test constants
const TEST_EMAIL = 'test@stratpoint.com';
const TEST_SUBJECT = 'Test Subject';
const TEST_HTML = '<p>Test content</p>';
const TEST_NOTIFICATION_TYPE: NotificationType = 'leave_submitted';

const defaultParams = {
  to: TEST_EMAIL,
  subject: TEST_SUBJECT,
  html: TEST_HTML,
  notificationType: TEST_NOTIFICATION_TYPE,
};

// Helper to create a mock Response
function createMockResponse(status: number, body?: string): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: jest.fn().mockResolvedValue(body ?? ''),
    json: jest.fn().mockResolvedValue({}),
    headers: new Headers(),
    redirected: false,
    statusText: 'OK',
    type: 'basic' as ResponseType,
    url: '',
    clone: jest.fn(),
    body: null,
    bodyUsed: false,
    arrayBuffer: jest.fn(),
    blob: jest.fn(),
    formData: jest.fn(),
    bytes: jest.fn(),
  } as unknown as Response;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockFetch.mockReset();
  process.env.RESEND_API_KEY = 'test-api-key';
  process.env.RESEND_FROM_EMAIL = 'Test <test@example.com>';
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

afterAll(() => {
  mockConsoleError.mockRestore();
  mockConsoleInfo.mockRestore();
});

describe('sendEmailNotification', () => {
  describe('Fire-and-forget execution', () => {
    it('returns void immediately without blocking', () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(200));
      const result = sendEmailNotification(defaultParams);
      expect(result).toBeUndefined();
    });
  });

  describe('Success path', () => {
    it('sends email successfully on first attempt', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(200));

      sendEmailNotification(defaultParams);
      // Allow after() callback to execute
      await new Promise((resolve) => jest.advanceTimersByTimeAsync(0).then(resolve));

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.resend.com/emails',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key',
          }),
        }),
      );

      // Verify success log
      expect(mockConsoleInfo).toHaveBeenCalledTimes(1);
      const logCall = JSON.parse(mockConsoleInfo.mock.calls[0][0]);
      expect(logCall).toMatchObject({
        action: 'send_email',
        notificationType: 'leave_submitted',
        recipient: TEST_EMAIL,
        outcome: 'sent',
      });
    });
  });

  describe('Transient failure → retry succeeds', () => {
    it('retries on 500 error and succeeds on second attempt', async () => {
      mockFetch
        .mockResolvedValueOnce(createMockResponse(500, 'Internal Server Error'))
        .mockResolvedValueOnce(createMockResponse(200));

      sendEmailNotification(defaultParams);

      // Allow first attempt to execute and fail
      await jest.advanceTimersByTimeAsync(0);
      // Advance through first retry delay (1s + jitter)
      await jest.advanceTimersByTimeAsync(1500);
      // Allow second attempt to complete
      await jest.advanceTimersByTimeAsync(0);

      expect(mockFetch).toHaveBeenCalledTimes(2);

      // Verify retry log via onRetry callback
      const errorLogs = mockConsoleError.mock.calls.map((call) =>
        JSON.parse(call[0]),
      );
      const retryLog = errorLogs.find((log) => log.outcome === 'retry');
      expect(retryLog).toBeDefined();
      expect(retryLog).toMatchObject({
        action: 'send_email',
        outcome: 'retry',
        notificationType: 'leave_submitted',
        attempt: 1,
      });

      // Verify success log
      expect(mockConsoleInfo).toHaveBeenCalledTimes(1);
      const successLog = JSON.parse(mockConsoleInfo.mock.calls[0][0]);
      expect(successLog).toMatchObject({
        outcome: 'sent',
      });
    });

    it('retries on network error and succeeds', async () => {
      mockFetch
        .mockRejectedValueOnce(new TypeError('fetch failed'))
        .mockResolvedValueOnce(createMockResponse(200));

      sendEmailNotification(defaultParams);
      await jest.advanceTimersByTimeAsync(0);
      await jest.advanceTimersByTimeAsync(1500);
      await jest.advanceTimersByTimeAsync(0);

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Transient failure → exhausted → logged and swallowed', () => {
    it('retries 3 times on persistent 500 error and swallows error', async () => {
      mockFetch
        .mockResolvedValueOnce(createMockResponse(500))
        .mockResolvedValueOnce(createMockResponse(500))
        .mockResolvedValueOnce(createMockResponse(500));

      sendEmailNotification(defaultParams);

      // Allow all attempts and retries to complete
      await jest.advanceTimersByTimeAsync(0);
      await jest.advanceTimersByTimeAsync(5000);
      await jest.advanceTimersByTimeAsync(0);
      await jest.advanceTimersByTimeAsync(20000);
      await jest.advanceTimersByTimeAsync(0);

      expect(mockFetch).toHaveBeenCalledTimes(3);

      // Verify exhaustion log via onExhausted callback
      const errorLogs = mockConsoleError.mock.calls.map((call) =>
        JSON.parse(call[0]),
      );
      const exhaustedLog = errorLogs.find(
        (log) => log.outcome === 'exhausted',
      );
      expect(exhaustedLog).toBeDefined();
      expect(exhaustedLog).toMatchObject({
        outcome: 'exhausted',
        attempts: 3,
        notificationType: 'leave_submitted',
      });

      // Verify no success log
      expect(mockConsoleInfo).not.toHaveBeenCalled();
    });
  });

  describe('Permanent failure → no retry → logged and swallowed', () => {
    it('does not retry on 400 Bad Request', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(400, 'Bad Request'));

      sendEmailNotification(defaultParams);
      await jest.advanceTimersByTimeAsync(0);

      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Verify no retry log — permanent errors skip onRetry entirely
      const errorLogs = mockConsoleError.mock.calls.map((call) =>
        JSON.parse(call[0]),
      );
      const retryLog = errorLogs.find((log) => log.outcome === 'retry');
      expect(retryLog).toBeUndefined();
    });

    it('does not retry on 422 Unprocessable Entity', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse(422, 'Unprocessable Entity'),
      );

      sendEmailNotification(defaultParams);
      await jest.advanceTimersByTimeAsync(0);

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('does not retry on 401 Unauthorized', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(401, 'Unauthorized'));

      sendEmailNotification(defaultParams);
      await jest.advanceTimersByTimeAsync(0);

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Rate limiting', () => {
    it('retries on 429 Too Many Requests', async () => {
      mockFetch
        .mockResolvedValueOnce(createMockResponse(429, 'Too Many Requests'))
        .mockResolvedValueOnce(createMockResponse(200));

      sendEmailNotification(defaultParams);
      await jest.advanceTimersByTimeAsync(0);
      await jest.advanceTimersByTimeAsync(1500);
      await jest.advanceTimersByTimeAsync(0);

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('requestId persistence', () => {
    it('uses the same requestId across all retry attempts', async () => {
      mockFetch
        .mockResolvedValueOnce(createMockResponse(500))
        .mockResolvedValueOnce(createMockResponse(500))
        .mockResolvedValueOnce(createMockResponse(200));

      sendEmailNotification(defaultParams);

      // Allow all attempts
      await jest.advanceTimersByTimeAsync(0);
      await jest.advanceTimersByTimeAsync(5000);
      await jest.advanceTimersByTimeAsync(0);
      await jest.advanceTimersByTimeAsync(20000);
      await jest.advanceTimersByTimeAsync(0);

      // Collect all log entries (error + info)
      const allLogs = [
        ...mockConsoleError.mock.calls.map((c) => JSON.parse(c[0])),
        ...mockConsoleInfo.mock.calls.map((c) => JSON.parse(c[0])),
      ];

      // All entries must share the same requestId
      const requestIds = allLogs.map((log) => log.requestId);
      const uniqueIds = new Set(requestIds);
      expect(uniqueIds.size).toBe(1);
      expect(requestIds[0]).toBeDefined();
    });
  });

  describe('Payload diagnostics', () => {
    it('logs payloadSizeBytes on Resend rejection', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(400, 'Invalid email'));

      sendEmailNotification(defaultParams);
      await jest.advanceTimersByTimeAsync(0);

      const errorLogs = mockConsoleError.mock.calls.map((call) =>
        JSON.parse(call[0]),
      );
      const rejectionLog = errorLogs.find(
        (log) => log.payloadSizeBytes !== undefined,
      );
      expect(rejectionLog).toBeDefined();
      expect(rejectionLog.payloadSizeBytes).toBeGreaterThan(0);
      expect(typeof rejectionLog.payloadSizeBytes).toBe('number');
    });
  });

  describe('Configuration', () => {
    it('returns early when RESEND_API_KEY is not set', async () => {
      delete process.env.RESEND_API_KEY;

      sendEmailNotification(defaultParams);
      await jest.advanceTimersByTimeAsync(0);

      expect(mockFetch).not.toHaveBeenCalled();

      // Verify config error log
      const errorLogs = mockConsoleError.mock.calls.map((call) =>
        JSON.parse(call[0]),
      );
      const configLog = errorLogs.find(
        (log) => log.outcome === 'config_error',
      );
      expect(configLog).toBeDefined();
    });

    it('uses default from address when not provided', async () => {
      delete process.env.RESEND_FROM_EMAIL;
      mockFetch.mockResolvedValueOnce(createMockResponse(200));

      sendEmailNotification(defaultParams);
      await jest.advanceTimersByTimeAsync(0);

      const fetchCall = mockFetch.mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.from).toBe('Meridian LMS <noreply@meridianlms.com>');
    });
  });

  describe('Logging', () => {
    it('logs notification type in all log entries', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(200));

      sendEmailNotification({
        ...defaultParams,
        notificationType: 'leave_approved',
      });
      await jest.advanceTimersByTimeAsync(0);

      const logCall = JSON.parse(mockConsoleInfo.mock.calls[0][0]);
      expect(logCall.notificationType).toBe('leave_approved');
    });
  });
});
