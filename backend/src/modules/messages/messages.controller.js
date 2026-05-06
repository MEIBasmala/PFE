// messages.controller.js
const messagesService = require('./messages.service');

// GET /messages/conversations
const getMyConversations = async (req, res) => {
  try {
    const conversations = await messagesService.getMyConversations(req.user.id);
    res.status(200).json(conversations);  // return array directly — frontend expects array
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// GET /messages/conversations/:otherUserId/messages
const getConversationMessages = async (req, res) => {
  try {
    const otherUserId = parseInt(req.params.otherUserId);
    if (isNaN(otherUserId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }
    const messages = await messagesService.getConversationMessages(req.user.id, otherUserId);
    res.status(200).json(messages);  // return array directly
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// POST /messages/send
const sendMessage = async (req, res) => {
  try {
    const message = await messagesService.sendMessage(req.user.id, req.body);
    res.status(201).json({ message });  // { message: Message } — matches frontend expectation
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// PATCH /messages/:id/read
const markAsRead = async (req, res) => {
  try {
    const message = await messagesService.markAsRead(req.user.id, parseInt(req.params.id));
    res.status(200).json({ success: true, data: message });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  getMyConversations,
  getConversationMessages,
  sendMessage,
  markAsRead,
};