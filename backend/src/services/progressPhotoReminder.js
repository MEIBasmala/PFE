const cron = require('node-cron');
const prisma = require('../config/db');
const { createNotification } = require('../modules/notifications/notifications.service');

async function sendProgressPhotoReminders() {
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);

  // Find patients who have at least one progress photo,
  // and the most recent one is more than 30 days old.
  const patientsWhoNeedReminder = await prisma.patient.findMany({
    where: {
      progressPhotos: {
        some: {},  // at least one photo
      },
      // Using a raw SQL condition because Prisma doesn't support nested aggregation easily.
      // Alternative: fetch all patients with photos and filter in memory (simpler, safe because few users).
    },
    include: {
      progressPhotos: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      user: true,
    },
  });

  // Filter in memory to find those whose last photo > 30 days
  const toNotify = patientsWhoNeedReminder.filter(p => {
    const lastPhoto = p.progressPhotos[0];
    if (!lastPhoto) return false;
    const daysSinceLast = (today - new Date(lastPhoto.createdAt)) / (1000 * 60 * 60 * 24);
    return daysSinceLast >= 30;
  });

  // Also include patients who have **no** progress photos and whose account is older than 30 days
  const patientsWithNoPhotos = await prisma.patient.findMany({
    where: {
      progressPhotos: { none: {} },
      user: {
        createdAt: { lte: thirtyDaysAgo },
      },
    },
    include: { user: true },
  });

  const allToNotify = [...toNotify, ...patientsWithNoPhotos];

  for (const patient of allToNotify) {
    // Avoid duplicate notifications in the same day? We'll check if a notification of type "PROGRESS_PHOTO" was already sent today.
    const existingToday = await prisma.notification.findFirst({
      where: {
        userId: patient.userId,
        type: 'PROGRESS_PHOTO',
        createdAt: { gte: new Date(today.setHours(0, 0, 0, 0)) },
      },
    });
    if (!existingToday) {
      await createNotification(
        patient.userId,
        'PROGRESS_PHOTO',
        `It's time to upload your monthly progress photo! 📸 Show us your transformation.`
      );
    }
  }
}

// Schedule the job to run every day at 9:00 AM
cron.schedule('0 9 * * *', () => {
  console.log('Running progress photo reminder job...');
  sendProgressPhotoReminders().catch(console.error);
});

module.exports = { sendProgressPhotoReminders };