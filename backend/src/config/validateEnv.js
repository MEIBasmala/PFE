'use strict';

/**
 * validateEnv.js
 *
 * Called once at process start (before any imports that consume env vars).
 * Groups required variables by subsystem so the error message immediately
 * tells you WHAT is missing and WHY it matters.
 *
 * Pattern: fail fast — process.exit(1) on any missing required var.
 * Optional vars get a warning but do NOT abort startup.
 */

// ── Required variables — server will NOT start without these ───────────────

const REQUIRED = [
  // Core runtime
  { key: 'DATABASE_URL',          reason: 'Prisma needs a database connection string' },
  { key: 'JWT_SECRET',            reason: 'Access tokens are signed with this secret' },
  { key: 'CLIENT_URL',            reason: 'CORS origin and password-reset links need this' },

  // Email (nodemailer)
  { key: 'EMAIL_HOST',            reason: 'Nodemailer SMTP host' },
  { key: 'EMAIL_PORT',            reason: 'Nodemailer SMTP port' },
  { key: 'EMAIL_USER',            reason: 'Nodemailer auth username' },
  { key: 'EMAIL_PASS',            reason: 'Nodemailer auth password' },

  // Stripe (payments — required even without payments to avoid silent undefined key)
  { key: 'STRIPE_SECRET_KEY',     reason: 'Stripe server-side API key for payment intents' },
  { key: 'STRIPE_WEBHOOK_SECRET', reason: 'Stripe webhook signature verification' },
];

// ── Optional variables — server starts but logs a warning ──────────────────

const OPTIONAL = [
  { key: 'PORT',           fallback: '5000',       reason: 'HTTP server port (defaults to 5000)' },
  { key: 'JWT_EXPIRES_IN', fallback: '15m',         reason: 'Access token TTL (defaults to 15m)' },
  { key: 'GEMINI_API_KEY', fallback: null,           reason: 'Chatbot Gemini provider — chatbot falls back to Ollama if absent' },
  { key: 'OLLAMA_URL',     fallback: null,           reason: 'Chatbot Ollama provider URL — chatbot fails gracefully if absent' },
  { key: 'OLLAMA_MODEL',   fallback: 'gemma:2b',    reason: 'Ollama model name (defaults to gemma:2b)' },
  { key: 'AI_SERVICE_URL', fallback: null,           reason: 'YOLOv8 food detection service — AI scans will be no-ops if absent' },
  { key: 'API_URL',        fallback: null,           reason: 'Public API base URL used in upload path construction' },
];

// ── Validator ──────────────────────────────────────────────────────────────

function validateEnv() {
  const missing = [];

  for (const { key, reason } of REQUIRED) {
    const val = process.env[key];
    if (!val || val.trim() === '') {
      missing.push({ key, reason });
    }
  }

  if (missing.length > 0) {
    const lines = missing.map(({ key, reason }) => `  ✗  ${key.padEnd(28)} — ${reason}`);
    console.error(
      '\n' +
      '╔══════════════════════════════════════════════════════════════╗\n' +
      '║          KhabirLens — MISSING ENVIRONMENT VARIABLES          ║\n' +
      '╚══════════════════════════════════════════════════════════════╝\n' +
      '\nThe following required environment variables are not set:\n\n' +
      lines.join('\n') +
      '\n\nCreate a .env file in the backend/ directory and set these values.' +
      '\nSee .env.example for a template.' +
      '\n'
    );
    process.exit(1);
  }

  // Warn about missing optional vars (no exit)
  const warnings = [];
  for (const { key, fallback, reason } of OPTIONAL) {
    const val = process.env[key];
    if (!val || val.trim() === '') {
      if (fallback !== null) {
        // Silently apply default — no noise for expected defaults
        process.env[key] = fallback;
      } else {
        warnings.push(`  ⚠  ${key.padEnd(28)} — ${reason}`);
      }
    }
  }

  if (warnings.length > 0) {
    console.warn(
      '\nKhabirLens — optional env vars not set (some features may be disabled):\n' +
      warnings.join('\n') + '\n'
    );
  }

  console.log('✅  Environment variables validated.\n');
}

module.exports = validateEnv;
