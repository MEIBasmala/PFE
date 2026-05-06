const prisma = require('../../config/db');

const getMyNotifications = async (userId) => {
  return await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
};

const markAsRead = async (id) => {
  return await prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });
};

const markAllAsRead = async (userId) => {
  return await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
};

const getNotificationById = async (id) => {
  return await prisma.notification.findUnique({ where: { id } });
};
const createNotification = async (data) => {
  return await prisma.notification.create({ data });
};
module.exports = { getMyNotifications, markAsRead, markAllAsRead, getNotificationById, createNotification };