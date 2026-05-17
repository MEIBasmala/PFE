// messages.routes.js
const express = require("express");
const router = express.Router();
const messagesController = require("./messages.controller");
const { validateSendMessage } = require("./messages.validation");
const { protect } = require("../../middleware/auth");

const multer = require("multer");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");

// ── Allowed MIME types ───────────────────────────────────────────────────────
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

const ALLOWED_FILE_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
];

// ── Multer storage ───────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = "uploads/messages/";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    cb(null, `${uuidv4()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max (images: 5 MB enforced in frontend)
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_FILE_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type "${file.mimetype}" is not allowed`));
    }
  },
});

// ── Routes ───────────────────────────────────────────────────────────────────

// POST /messages/upload  — image OR file attachment
router.post("/upload", protect, upload.single("image"), (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }
    const baseUrl =
      process.env.API_URL || `${req.protocol}://${req.get("host")}`;
    const imageUrl = `${baseUrl}/uploads/messages/${req.file.filename}`;
    res.status(200).json({ success: true, imageUrl });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Multer error handler (e.g. file type / size violations)
router.use((err, _req, res, next) => {
  if (err instanceof multer.MulterError || err.message?.includes("not allowed")) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next(err);
});

// GET  /messages/conversations
router.get("/conversations", protect, messagesController.getMyConversations);

// GET  /messages/conversations/:otherUserId/messages
router.get(
  "/conversations/:otherUserId/messages",
  protect,
  messagesController.getConversationMessages
);

// POST /messages/send
router.post(
  "/send",
  protect,
  validateSendMessage,
  messagesController.sendMessage
);

// PATCH /messages/:id/read
router.patch("/:id/read", protect, messagesController.markAsRead);

module.exports = router;