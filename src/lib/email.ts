import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async ({
  to,
  subject,
  html,
  from = process.env.FROM_EMAIL,
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