// messages.repository.js
const prisma = require('../../config/db');

// All messages involving a user, newest first, with sender/receiver info
const getMessagesByUserId = async (userId) => {
  return await prisma.message.findMany({
    where: {
      OR: [{ senderId: userId }, { receiverId: userId }],
    },
    include: {
      sender: { select: { id: true, fullName: true, role: true } },
      receiver: { select: { id: true, fullName: true, role: true } },
    },
    orderBy: { sentAt: 'desc' },
  });
};

// Messages between exactly two users, oldest first (for chat display)
const getConversationMessages = async (userId, otherUserId) => {
  return await prisma.message.findMany({
    where: {
      OR: [
        { senderId: userId,      receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId },
      ],
    },
    include: {
      sender:   { select: { id: true, fullName: true, role: true } },
      receiver: { select: { id: true, fullName: true, role: true } },
    },
    orderBy: { sentAt: 'asc' },  // oldest first for chat
  });
};

const sendMessage = async (data) => {
  return await prisma.message.create({
    data,
    include: {
      sender:   { select: { id: true, fullName: true, role: true } },
      receiver: { select: { id: true, fullName: true, role: true } },
    },
  });
};

const markAsRead = async (id) => {
  return await prisma.message.update({
    where: { id },
    data: { isRead: true },
  });
};

const getMessageById = async (id) => {
  return await prisma.message.findUnique({ where: { id } });
};

module.exports = {
  getMessagesByUserId,
  getConversationMessages,
  sendMessage,
  markAsRead,
  getMessageById,
};