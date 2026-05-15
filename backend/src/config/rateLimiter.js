'use strict';

const rateLimit = require('express-rate-limit');

// ── Shared error response format ─────────────────────────────────────────────
// Matches the rest of the API: { success: false, message: '...' }
const rateLimitHandler = (req, res) => {
  res.status(429).json({
    success: false,
    message: 'Too many requests. Please wait a moment before trying again.',
  });
};

// ── Auth limiter ─────────────────────────────────────────────────────────────
// Protects: /api/auth/login, /api/auth/register, /api/auth/forgot-password
// Prevents brute force attacks and registration spam.
// 10 attempts per 15 minutes per IP is generous for legitimate users
// (a real user never needs to log in 10 times in 15 minutes).
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,    // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false,     // Disable `X-RateLimit-*` headers
  handler: rateLimitHandler,
  // Skip rate limiting in test environment
  skip: () => process.env.NODE_ENV === 'test',
});

// ── Chatbot limiter ───────────────────────────────────────────────────────────
// Protects: /api/chatbot/message
// Each message triggers a Gemini API call which costs real money.
// 20 messages per minute is more than enough for normal use.
const chatbotLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: () => process.env.NODE_ENV === 'test',
});

// ── General API limiter ───────────────────────────────────────────────────────
// Protects: all other /api/* routes
// 200 requests per 15 minutes covers normal dashboard usage comfortably.
// This is a safety net against automated scraping or abuse.
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: () => process.env.NODE_ENV === 'test',
});

module.exports = { authLimiter, chatbotLimiter, generalLimiter };
