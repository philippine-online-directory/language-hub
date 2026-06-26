import { BrevoClient } from '@getbrevo/brevo';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config({ path: fileURLToPath(new URL('.env', import.meta.url)) });

const apiKey = process.env.BREVO_API_KEY;

if (!apiKey) {
  throw new Error('BREVO_API_KEY is required to send transactional emails with Brevo.');
}

const brevo = new BrevoClient({
  apiKey
});

export default brevo;
