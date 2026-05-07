// src/config/socket.js
const { Server } = require("socket.io");
const http = require("http");
const jwt = require("jsonwebtoken");
const prisma = require("./db");
const {
  createNotification,
} = require("../modules/notifications/notifications.service");

let io = null;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
    // Allow up to 5 MB payloads (base64-encoded images sent over the socket)
    maxHttpBufferSize: 5e6,
    pingTimeout: 20_000,
    pingInterval: 10_000,
  });

  // Auth middleware
  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace("Bearer ", "");
    if (!token) return next(new Error("Authentication required"));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  // Connection handler
  io.on("connection", (socket) => {
    const userId = socket.userId;
    console.log(`[Socket] User ${userId} connected (${socket.userRole})`);
    socket.join(`user:${userId}`);

    // send_message
    socket.on("send_message", async ({ receiverId, content, imageUrl }) => {
      try {
        const receiverIdInt = parseInt(receiverId);

        // Validate: must have a receiver, and at least one of content or imageUrl
        if (!receiverIdInt || isNaN(receiverIdInt)) return;
        const trimmedContent = content?.trim() ?? "";
        if (!trimmedContent && !imageUrl) return; // nothing to send

        const message = await prisma.message.create({
          data: {
            senderId: userId,
            receiverId: receiverIdInt,
            content: trimmedContent || "📷 Image", // fallback label for image-only
            imageUrl: imageUrl || null,
            isRead: false,
          },
          include: {
            sender: { select: { id: true, fullName: true, role: true } },
            receiver: { select: { id: true, fullName: true, role: true } },
          },
        });

        // Confirm to sender, deliver to receiver
        socket.emit("message_sent", { message });
        io.to(`user:${receiverIdInt}`).emit("new_message", { message });

        // Refresh conversation list for both parties
        socket.emit("conversations_updated");
        io.to(`user:${receiverIdInt}`).emit("conversations_updated");

        // Create in-app notification for the receiver
        try {
          const sender = await prisma.user.findUnique({
            where: { id: userId },
            select: { fullName: true },
          });
          const preview =
            trimmedContent.length > 80
              ? trimmedContent.substring(0, 77) + "..."
              : trimmedContent || "Sent an image";
          const notif = await createNotification(
            receiverIdInt,
            "MESSAGE",
            `New message from ${sender?.fullName || "Someone"}: ${preview}`
          );
          io.to(`user:${receiverIdInt}`).emit("new_notification", {
            notification: notif,
          });
        } catch (notifError) {
          console.error(
            "[Socket] Failed to create notification:",
            notifError.message
          );
        }
      } catch (err) {
        console.error("[Socket] send_message error:", err);
        socket.emit("message_error", { error: "Failed to send message" });
      }
    });

    // mark_read
    socket.on("mark_read", async ({ messageId }) => {
      try {
        const msg = await prisma.message.findUnique({
          where: { id: parseInt(messageId) },
        });
        if (!msg || msg.receiverId !== userId) return;
        await prisma.message.update({
          where: { id: parseInt(messageId) },
          data: { isRead: true },
        });
        io.to(`user:${msg.senderId}`).emit("message_read", { messageId });
      } catch (err) {
        console.error("[Socket] mark_read error:", err);
      }
    });

    // disconnect
    socket.on("disconnect", () => {
      console.log(`[Socket] User ${userId} disconnected`);
    });
  });

  return io;
};

const createServer = (app) => {
  const server = http.createServer(app);
  const socketIo = initSocket(server);
  return { server, io: socketIo };
};

const getIO = () => {
  if (!io) throw new Error("Socket.IO not initialized");
  return io;
};

module.exports = { initSocket, createServer, getIO };