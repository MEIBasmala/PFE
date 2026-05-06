const notificationsService = require('./notifications.service');

const getMyNotifications = async (req, res) => {
  try {
    const notifications = await notificationsService.getMyNotifications(req.user.id);
    res.status(200).json({ success: true, notifications });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const markAsRead = async (req, res) => {
  try {
    const notification = await notificationsService.markAsRead(req.user.id, parseInt(req.params.id));
    res.status(200).json({ success: true, message: 'Notification marked as read', notification });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    await notificationsService.markAllAsRead(req.user.id);
    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = { getMyNotifications, markAsRead, markAllAsRead };