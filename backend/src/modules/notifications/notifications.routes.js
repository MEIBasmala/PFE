const express = require('express');
const router = express.Router();
const notificationsController = require('./notifications.controller');
const { protect } = require('../../middleware/auth');

router.get('/',             protect, notificationsController.getMyNotifications);
router.put('/read-all',     protect, notificationsController.markAllAsRead);
router.put('/:id/read',     protect, notificationsController.markAsRead);

module.exports = router;