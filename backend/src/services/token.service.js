const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../config/db');

const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');
// Generate short-lived access token (15-60 min)
const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );
};

// Generate long-lived refresh token (random string)
const generateRefreshToken = () => {
  return crypto.randomBytes(40).toString('hex');
};

// Store refresh token in DB for a user
const storeRefreshToken = async (userId, refreshToken) => {
  const hashedToken = hashToken(refreshToken);
  await prisma.user.update({
    where: { id: userId },
    data: { refreshToken: hashedToken },
  });
};
// Verify refresh token exists and is valid
const verifyRefreshToken = async (refreshToken) => {
  const hashedToken = hashToken(refreshToken);
  const user = await prisma.user.findFirst({
    where: { refreshToken: hashedToken },
  });
  if (!user) throw new Error('Invalid or expired refresh token');
  if (!user.isActive) throw new Error('Account is deactivated');
  return user;
};

// Remove refresh token (logout)
const removeRefreshToken = async (userId) => {
  await prisma.user.update({
    where: { id: userId },
    data: { refreshToken: null },
  });
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  storeRefreshToken,
  verifyRefreshToken,
  removeRefreshToken,
};