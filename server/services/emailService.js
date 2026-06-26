import brevo from '../brevo.js';
import { passwordResetTemplate } from '../jobs/helpers/emailTemplate.js';

const SENDER = {
  name: "Philippine Online Dictionary",
  email: "philippineonlinedirectory.auto@gmail.com"
};

async function sendPasswordResetEmail(email, resetUrl) {
  await brevo.transactionalEmails.sendTransacEmail({
    subject: "[POD] Reset your password",
    sender: SENDER,
    to: [{ email }],
    htmlContent: passwordResetTemplate(resetUrl)
  });
}

const emailService = {
  sendPasswordResetEmail
};

export default emailService;
