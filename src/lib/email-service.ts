import { Resend } from 'resend';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  replyTo?: string;
  attachments?: {
    filename: string;
    content: Buffer | string;
  }[];
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  simulated: boolean;
  error?: string;
}

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

/**
 * Universal email dispatcher for Mett Global carrier claims & enquiries.
 * Uses Resend API when RESEND_API_KEY is configured in .env,
 * otherwise gracefully simulates dispatch in development / test environments.
 */
export async function sendCarrierEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const defaultFrom =
    process.env.EMAIL_FROM ||
    process.env.RESEND_FROM ||
    'Mett Global Claims <claims@mettglobal.com>';

  const fallbackFrom = 'Mett Global Claims <onboarding@resend.dev>';
  const from = options.from || (resendApiKey ? defaultFrom : fallbackFrom);

  const to = Array.isArray(options.to) ? options.to : [options.to];

  // If Resend API key is present, attempt real dispatch
  if (resend) {
    try {
      const response = await resend.emails.send({
        from,
        to,
        replyTo: options.replyTo,
        subject: options.subject,
        text: options.text || '',
        html: options.html,
      });

      if (response.error) {
        console.warn('[EmailService] Resend API error:', response.error);
        return {
          success: false,
          simulated: false,
          error: response.error.message,
        };
      }

      console.log(`[EmailService] Real email dispatched via Resend to ${to.join(', ')}. ID: ${response.data?.id}`);
      return {
        success: true,
        messageId: response.data?.id,
        simulated: false,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[EmailService] Unexpected dispatch error:', msg);
      return {
        success: false,
        simulated: false,
        error: msg,
      };
    }
  }

  // Simulation fallback for local/test execution without requiring an active Resend account
  console.log(`[EmailService - SIMULATION] Email to: ${to.join(', ')} | Subject: "${options.subject}"`);
  console.log(`[EmailService - SIMULATION] Body preview:\n${(options.text || '').slice(0, 200)}...`);

  return {
    success: true,
    messageId: `sim-${Date.now()}`,
    simulated: true,
  };
}
