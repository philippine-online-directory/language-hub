import cron from 'node-cron';
import prisma from '../prisma.js'
import brevo from '../brevo.js';
import wordOfTheDayService from '../services/wordOfTheDayService.js';
import { wordOfTheDayTemplate } from './helpers/emailTemplate.js';

cron.schedule('0 0 * * *', async () => {
    await wordOfTheDayService.assignWordOfTheDay();
}, {
    scheduled: true,
    timezone: "Asia/Manila"
});

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

  const { wordTemplate, checkTemplate, templateArgs } = await wordOfTheDayService.getEmailTemplates(formattedDate);

  const users = await prisma.user.findMany({
    where: { reminderType: { not: null } },
    orderBy: { lastReminderSentAt: ‘asc’ }
  });

  const guests = await prisma.guestEmailSubscription.findMany({
    where: { active: true },
    orderBy: { createdAt: ‘asc’ }
  });

  // Max 300 per day to stay within email limits of brevo free tier
  const remaining = 300 - users.length;
  const todaysBatch = users.slice(0, 300);
  const guestBatch = remaining > 0 ? guests.slice(0, remaining) : [];

  for (const user of todaysBatch) {
    try {
      await brevo.transactionalEmails.sendTransacEmail({
        subject: `[POD] ${user.reminderType === "WORD" ? "Here’s today’s Word of the Day 🎉" : "Still haven’t checked today’s word? 👀"}`,
        sender: { name: "Philippine Online Dictionary", email: "philippineonlinedirectory.auto@gmail.com" },
        to: [{ email: user.email }],
        htmlContent: user.reminderType === "WORD" ? wordTemplate : checkTemplate
      });

      await prisma.user.update({
        where: { id: user.id },
        data: { lastReminderSentAt: new Date() }
      });
    } catch (err) {
      console.error(`Failed to send reminder to ${user.email}`, err);
    }
  }

  for (const guest of guestBatch) {
    try {
      await brevo.transactionalEmails.sendTransacEmail({
        subject: "[POD] Here’s today’s Word of the Day 🎉",
        sender: { name: "Philippine Online Dictionary", email: "philippineonlinedirectory.auto@gmail.com" },
        to: [{ email: guest.email }],
        htmlContent: wordOfTheDayTemplate(...templateArgs, guest.unsubscribeToken)
      });
    } catch (err) {
      console.error(`Failed to send word to guest ${guest.email}`, err);
    }
  }
}, {
  scheduled: true,
  timezone: "Asia/Manila"   // Philippine Standard Time
});