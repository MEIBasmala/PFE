// messages.routes.js
const express = require("express");
const router = express.Router();
const messagesController = require("./messages.controller");
const { validateSendMessage } = require("./messages.validation");
const { protect } = require("../../middleware/auth");

const multer = require("multer");
const cloudinary = require("cloudinary").v2;

// ── Cloudinary config ────────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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

// ── Multer memory storage (file lives in RAM, uploaded to Cloudinary) ─────
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_FILE_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type "${file.mimetype}" is not allowed`));
    }
  },
});

// ── Helper: upload buffer to Cloudinary ─────────────────────────────────────
const uploadToCloudinary = (buffer, mimetype) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "khabirlens/messages",
        resource_type: "auto",
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(buffer);
  });
};

// ── Routes ───────────────────────────────────────────────────────────────────

// POST /messages/upload — image OR file attachment → Cloudinary
router.post("/upload", protect, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }

    const result = await uploadToCloudinary(req.file.buffer, req.file.mimetype);
    res.status(200).json({ success: true, imageUrl: result.secure_url });
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    res.status(500).json({ success: false, message: "Failed to upload image" });
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