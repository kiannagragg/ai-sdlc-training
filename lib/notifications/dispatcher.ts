import { logError } from '@/lib/errors';

const RESEND_API_URL = 'https://api.resend.com/emails';

interface EmailParams {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmailNotification(
  params: EmailParams,
): Promise<void> {
  const requestId = crypto.randomUUID();
  const action = 'send_email';
  const start = Date.now();

  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      logError(requestId, action, new Error('RESEND_API_KEY not configured'));
      return;
    }

    const from = params.from ?? process.env.RESEND_FROM_EMAIL ?? 'Meridian LMS <noreply@meridianlms.com>';

    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: params.to,
        subject: params.subject,
        html: params.html,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      logError(requestId, action, new Error(`Resend API error ${response.status}: ${body}`), Date.now() - start);
      return;
    }

    const duration = Date.now() - start;
    console.info(JSON.stringify({
      timestamp: new Date().toISOString(),
      requestId,
      action,
      to: params.to,
      subject: params.subject,
      durationMs: duration,
      status: 'sent',
    }));
  } catch (error) {
    logError(requestId, action, error, Date.now() - start);
  }
}
