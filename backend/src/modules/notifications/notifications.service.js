const notificationsRepo = require('./notifications.repository');

const getMyNotifications = async (userId) => {
  return await notificationsRepo.getMyNotifications(userId);
};

const markAsRead = async (userId, notificationId) => {
  const notification = await notificationsRepo.getNotificationById(notificationId);
  if (!notification) throw new Error('Notification not found');
  if (notification.userId !== userId) throw new Error('Unauthorized');
  return await notificationsRepo.markAsRead(notificationId);
};

const markAllAsRead = async (userId) => {
  return await notificationsRepo.markAllAsRead(userId);
};
const createNotification = async (userId, type, message) => {
  return await notificationsRepo.createNotification({ userId, type, message, isRead: false });
};
module.exports = { getMyNotifications, markAsRead, markAllAsRead,createNotification  };