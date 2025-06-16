import { Resend } from 'resend';

// Lazy initialization of Resend client
let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

export const sendEmail = async ({
  to,
  subject,
  html,
  from = process.env.FROM_EMAIL || 'onboarding@resend.dev',
  senderName = 'Sam from Split',
  replyTo = 'sam@split.dev'
}: {
  to: string;
  subject: string;
  html: string;
  from?: string;
  senderName?: string;
  replyTo?: string;
}) => {
  try {
    const resend = getResendClient();
    const data = await resend.emails.send({
      from: `${senderName} <${from}>`,
      to,
      subject,
      html,
      replyTo: replyTo,
    });
    
    console.log('Email sent:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Email failed:', error);
    return { success: false, error };
  }
}; 