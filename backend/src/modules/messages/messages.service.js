// messages.service.js
const messagesRepo = require('./messages.repository');
const { createNotification } = require('../notifications/notifications.service');
const usersRepo = require('../users/users.repository');

// ── Helper: resolve the actual User.id (not patient/nutritionist row id) ──
// The Message model uses User.id directly (senderId/receiverId → User)
// So we just use req.user.id directly — no patient/nutritionist lookup needed.

// ── Get all conversations for the logged-in user ─────────────────────────
// Returns one entry per unique "other person", with last message + unread count
const getMyConversations = async (userId) => {
  const messages = await messagesRepo.getMessagesByUserId(userId);

  // Build a map: otherUserId → { participant, lastMessage, unreadCount }
  const convMap = new Map();

  for (const msg of messages) {
    const otherId = msg.senderId === userId ? msg.receiverId : msg.senderId;
    const otherUser = msg.senderId === userId ? msg.receiver : msg.sender;

    if (!convMap.has(otherId)) {
      convMap.set(otherId, {
        id: otherId,                    // use other user's id as conversation id
        participant: {
          id: otherUser.id,
          fullName: otherUser.fullName,
          role: otherUser.role,
        },
        lastMessage: {
          content: msg.content,
          sentAt: msg.sentAt,
          isRead: msg.isRead,
        },
        unreadCount: 0,
      });
    }

    // Count unread messages sent TO the current user
    if (msg.receiverId === userId && !msg.isRead) {
      convMap.get(otherId).unreadCount += 1;
    }
  }

  return Array.from(convMap.values());
};

// ── Get messages between current user and another user ────────────────────
const getConversationMessages = async (userId, otherUserId) => {
  const messages = await messagesRepo.getConversationMessages(userId, otherUserId);
  return messages;
};

// ── Send a message ────────────────────────────────────────────────────────
const sendMessage = async (userId, { receiverId, content, imageUrl }) => {
  const receiverIdInt = parseInt(receiverId);  // sanitize once, use everywhere

  const message = await messagesRepo.sendMessage({
    senderId: userId,
    receiverId: receiverIdInt,
    content,
    imageUrl: imageUrl || null,
    isRead: false,
  });

  try {
    const sender = await usersRepo.findById(userId);
    const preview = content.length > 80 ? content.substring(0, 77) + '...' : content;
    await createNotification(
      receiverIdInt,
      'MESSAGE',
      `New message from ${sender.fullName}: ${preview}`
    );
  } catch (notifError) {
    console.error('Failed to create message notification:', notifError.message);
  }

  return message;
};

// ── Mark a message as read ────────────────────────────────────────────────
const markAsRead = async (userId, messageId) => {
  const message = await messagesRepo.getMessageById(messageId);
  if (!message) throw new Error('Message not found');
  if (message.receiverId !== userId) throw new Error('Unauthorized');
  return await messagesRepo.markAsRead(messageId);
};

module.exports = {
  getMyConversations,
  getConversationMessages,
  sendMessage,
  markAsRead,
};