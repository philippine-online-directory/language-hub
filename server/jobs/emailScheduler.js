import cron from 'node-cron';
import prisma from '../prisma.js'
import brevo from '../brevo.js';
import { wordOfTheDayTemplate, checkWordOfTheDayTemplate } from './helpers/emailTemplate.js';

// Run every day at 8 AM Philippine Standard Time
cron.schedule('0 8 * * *', async () => {

  // Get current date in Philippine Standard Time
  const now = new Date();
  const options = { 
    timeZone: "Asia/Manila", 
    year: "numeric", 
    month: "long", 
    day: "numeric" 
  };
  const formattedDate = now.toLocaleDateString("en-US", options);

  const users = await prisma.user.findMany({
    where: { reminderType: { not: null } },
    orderBy: { lastReminderSentAt: 'asc' }
  });

  // Max 300 per day to stay within email limits of brevo free tier
  const todaysBatch = users.slice(0, 300);

  for (const user of todaysBatch) {
    try {
      console.log(`Sending reminder to ${user.email} with type ${user.reminderType}`);

      await brevo.transactionalEmails.sendTransacEmail({
        subject: `[POD] ${user.reminderType === "WORD" ? "Here’s today’s Word of the Day 🎉" : "Still haven’t checked today’s word? 👀"}`,
        sender: { name: "Philippine Online Directory", email: "philippineonlinedirectory.auto@gmail.com" },
        to: [{ email: user.email }],
        htmlContent: user.reminderType === "WORD"
          ? wordOfTheDayTemplate(formattedDate, "Ambot", "Cebuano", "I don’t know / No idea / Uncertain response", `"Ambot, basin ugma pa siya moabot." (I don’t know, maybe he’ll arrive tomorrow.)`)
          : checkWordOfTheDayTemplate()
      });

      await prisma.user.update({
        where: { id: user.id },
        data: { lastReminderSentAt: new Date() }
      });
    } catch (err) {
      console.error(`Failed to send reminder to ${user.email}`, err);
    }
  }
}, {
  scheduled: true,
  timezone: "Asia/Manila"   // Philippine Standard Time
});