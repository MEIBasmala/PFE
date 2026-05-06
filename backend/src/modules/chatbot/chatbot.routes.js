const express = require('express');
const router = express.Router();
const chatbotController = require('./chatbot.controller');
const { validateChat } = require('./chatbot.validation');
const { protect, authorize } = require('../../middleware/auth');


router.post('/message',  protect, authorize('PATIENT'), validateChat, chatbotController.chat);
router.get('/history',   protect, authorize('PATIENT'),               chatbotController.getChatHistory);
router.get('/stats',     protect, authorize('ADMIN'),                  chatbotController.getChatbotStats);

module.exports = router;