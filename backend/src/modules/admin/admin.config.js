// src/modules/admin/admin.config.js

/**
 * Admin module configuration constants.
 * All hardcoded values extracted for maintainability and environment flexibility.
 */

// ── Currency & Pricing ──────────────────────────────────────
const CURRENCY = {
  USD_RATE: 135, // DZD per USD cent (i.e., 1.35 DZD per USD)
  CODE: 'DZD',
  DECIMAL_PLACES: 0,
};

// ── Pagination ──────────────────────────────────────────────
const PAGINATION = {
  DEFAULT_LIMIT: 100,
  DEFAULT_ORDER_BY: { id: 'desc' },
  RECENT_PAYMENTS_LIMIT: 5,
};

// ── Analytics Periods ───────────────────────────────────────
const ANALYTICS_PERIODS = {
  '7d': { days: 7, label: '7 days' },
  '30d': { days: 30, label: '30 days' },
  '90d': { days: 90, label: '90 days' },
  '12m': { days: 365, label: '12 months' },
};

const DEFAULT_ANALYTICS_PERIOD = '30d';

// ── Validation Limits ───────────────────────────────────────
const VALIDATION = {
  FULL_NAME_MAX_LENGTH: 100,
  SPECIALIZATION_MAX_LENGTH: 100,
  BIO_MAX_LENGTH: 500,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
};

// ── CSV Export ──────────────────────────────────────────────
const CSV_EXPORT = {
  FILENAME: 'payments.csv',
  HEADERS: ['Date', 'User', 'Plan', 'Amount (DZD)', 'Status'],
  STATUS_MAP: {
    SUCCESS: 'Completed',
    FAILED: 'Failed',
    PENDING: 'Pending',
  },
};

// ── Audit Log Actions ───────────────────────────────────────
const AUDIT_ACTIONS = {
  ACTIVATE_PATIENT: 'ACTIVATE_PATIENT',
  DEACTIVATE_PATIENT: 'DEACTIVATE_PATIENT',
  DELETE_PATIENT: 'DELETE_PATIENT',
  CREATE_NUTRITIONIST: 'CREATE_NUTRITIONIST',
  ACTIVATE_NUTRITIONIST: 'ACTIVATE_NUTRITIONIST',
  DEACTIVATE_NUTRITIONIST: 'DEACTIVATE_NUTRITIONIST',
  DELETE_NUTRITIONIST: 'DELETE_NUTRITIONIST',
};

// ── Target Types ────────────────────────────────────────────
const TARGET_TYPES = {
  PATIENT: 'Patient',
  NUTRITIONIST: 'Nutritionist',
};

// ── Roles ───────────────────────────────────────────────────
const ROLES = {
  ADMIN: 'ADMIN',
  PATIENT: 'PATIENT',
  NUTRITIONIST: 'NUTRITIONIST',
};

// ── Blog Status ─────────────────────────────────────────────
const BLOG_STATUS = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
};

// ── Subscription Status ─────────────────────────────────────
const SUBSCRIPTION_STATUS = {
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
};

// ── Payment Status ──────────────────────────────────────────
const PAYMENT_STATUS = {
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  PENDING: 'PENDING',
};

// ── User Status ─────────────────────────────────────────────
const USER_STATUS = {
  ACTIVE: true,
  INACTIVE: false,
};

// ── Nutritionist Defaults ───────────────────────────────────
const NUTRITIONIST_DEFAULTS = {
  MUST_CHANGE_PASSWORD: true,
  ROLE: 'NUTRITIONIST',
};

// ── Password Generation ─────────────────────────────────────
const PASSWORD = {
  TEMP_BYTES: 8,
  SALT_ROUNDS: 10,
};

// ── Export all ──────────────────────────────────────────────
module.exports = {
  CURRENCY,
  PAGINATION,
  ANALYTICS_PERIODS,
  DEFAULT_ANALYTICS_PERIOD,
  VALIDATION,
  CSV_EXPORT,
  AUDIT_ACTIONS,
  TARGET_TYPES,
  ROLES,
  BLOG_STATUS,
  SUBSCRIPTION_STATUS,
  PAYMENT_STATUS,
  USER_STATUS,
  NUTRITIONIST_DEFAULTS,
  PASSWORD,
};