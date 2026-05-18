const cron = require('node-cron');
const prisma = require('../config/db');
const { createNotification } = require('../modules/notifications/notifications.service');

const BATCH_SIZE = 500;

async function sendProgressPhotoReminders() {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);

  // ── Phase 1: Patients with old photos (single raw query) ──
  const patientsWithOldPhotos = await prisma.$queryRaw`
    SELECT p."userId", MAX(pp."createdAt") as "lastPhotoDate"
    FROM "patients" p
    JOIN "progress_photos" pp ON pp."patientId" = p.id
    GROUP BY p.id, p."userId"
    HAVING MAX(pp."createdAt") <= ${thirtyDaysAgo}
  `;

  // ── Phase 2: Patients with no photos and old accounts ──
  const patientsWithNoPhotos = await prisma.$queryRaw`
    SELECT p."userId"
    FROM "patients" p
    JOIN "users" u ON u.id = p."userId"
    WHERE NOT EXISTS (
      SELECT 1 FROM "progress_photos" pp WHERE pp."patientId" = p.id
    )
    AND u."createdAt" <= ${thirtyDaysAgo}
  `;

  const allUserIds = [
    ...patientsWithOldPhotos.map(p => p.userId),
    ...patientsWithNoPhotos.map(p => p.userId),
  ];

  const uniqueUserIds = [...new Set(allUserIds)];
  if (uniqueUserIds.length === 0) return;

  // ── Phase 3: Bulk check who already got notified today ──
  const existingToday = await prisma.notification.findMany({
    where: {
      type: 'PROGRESS_PHOTO',
      createdAt: { gte: startOfDay },
      userId: { in: uniqueUserIds },
    },
    select: { userId: true },
  });

  const notifiedToday = new Set(existingToday.map(n => n.userId));
  const needsNotification = uniqueUserIds.filter(id => !notifiedToday.has(id));

  // ── Phase 4: Single fast createMany (no N+1, no memory bloat) ──
  if (needsNotification.length > 0) {
    for (let i = 0; i < needsNotification.length; i += BATCH_SIZE) {
      const batch = needsNotification.slice(i, i + BATCH_SIZE);
      await prisma.notification.createMany({
        data: batch.map(userId => ({
          userId,
          type: 'PROGRESS_PHOTO',
          message: `It's time to upload your monthly progress photo! 📸 Show us your transformation.`,
          isRead: false,
        })),
      });
    }
    console.log(`[ProgressPhotoReminder] Sent ${needsNotification.length} reminders`);
  }
}

// Schedule the job to run every day at 9:00 AM
cron.schedule('0 9 * * *', () => {
  console.log('Running progress photo reminder job...');
  sendProgressPhotoReminders().catch(err => {
    console.error('[ProgressPhotoReminder] Job failed:', err);
  });
});

module.exports = { sendProgressPhotoReminders };