import brevo from '../brevo.js';
import { passwordResetTemplate } from '../jobs/helpers/emailTemplate.js';

const SENDER = {
  name: process.env.EMAIL_FROM_NAME || "Philippine Online Dictionary",
  email: process.env.EMAIL_FROM_ADDRESS || "no-reply@philippineonlinedictionary.com"
};

async function sendEmail({ to, subject, htmlContent }) {
  await brevo.transactionalEmails.sendTransacEmail({
    subject,
    sender: SENDER,
    to,
    htmlContent
  });
}

async function sendPasswordResetEmail(email, resetUrl) {
  await sendEmail({
    subject: "[POD] Reset your password",
    to: [{ email }],
    htmlContent: passwordResetTemplate(resetUrl)
  });
}

const emailService = {
  sendEmail,
  sendPasswordResetEmail
};

export default emailService;
