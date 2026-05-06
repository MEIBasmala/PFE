const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const authRepo = require('./auth.repository');
const sendEmail = require('../../config/email');
const tokenService = require('../../services/token.service');

//  Register 
const register = async ({ fullName, email, password }) => {
  const existing = await authRepo.findByEmail(email);
  if (existing) throw new Error('Email already in use');

  const hashed = await bcrypt.hash(password, 10);
  const user = await authRepo.createUser({ fullName, email, password: hashed });

  // Patient Profile
  await authRepo.createPatientProfile(user.id);

  try {
    await sendEmail({
      to: user.email,
      subject: 'Welcome to KhabirLens 🥗',
      html: `<h2>Welcome ${user.fullName}!</h2>
             <p>Your account has been created successfully.</p>
             <p>You can now login and start your nutrition journey.</p>`,
    });
  } catch (emailError) {
    console.log('Email notification failed:', emailError.message);
  }

  const refreshToken = tokenService.generateRefreshToken();
  await tokenService.storeRefreshToken(user.id, refreshToken);

  // Return both user and refreshToken
  return { user, refreshToken };
};

//  Login 
const login = async ({ email, password }) => {
  const user = await authRepo.findByEmail(email);
  if (!user) throw new Error('Invalid email or password');

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error('Invalid email or password');

  if (!user.isActive) throw new Error('Account is deactivated');

  await authRepo.updateLastLogin(user.id);

  const refreshToken = tokenService.generateRefreshToken();
  await tokenService.storeRefreshToken(user.id, refreshToken);

  return { user, refreshToken };
};

//  Get Me 
const getMe = async (id) => {
  const user = await authRepo.findById(id);
  if (!user) throw new Error('User not found');
  return user;
};

//  Forgot Password 
const forgotPassword = async (email) => {
  const user = await authRepo.findByEmail(email);
  if (!user) throw new Error('No account found with this email');

  const token = crypto.randomBytes(32).toString('hex');
  const expiry = new Date(Date.now() + 60 * 60 * 1000);

  await authRepo.saveResetToken(user.id, token, expiry);

  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
  try {
    await sendEmail({
      to: user.email,
      subject: 'KhabirLens — Reset Your Password',
      html: `<h2>Reset Your Password</h2>
             <p>Click the link below to reset your password:</p>
             <a href="${resetUrl}">Reset Password</a>
             <p>This link expires in 1 hour.</p>`,
    });
  } catch (emailError) {
    console.log('Email notification failed:', emailError.message);
  }

  return { user, token };
};

//  Reset Password 
const resetPassword = async ({ token, password }) => {
  const user = await authRepo.findByResetToken(token);
  if (!user) throw new Error('Invalid or expired token');

  const hashed = await bcrypt.hash(password, 10);
  await authRepo.updatePassword(user.id, hashed);

  try {
    await sendEmail({
      to: user.email,
      subject: 'KhabirLens — Password Changed Successfully',
      html: `<h2>Password Changed</h2>
             <p>Your password has been reset successfully.</p>`,
    });
  } catch (emailError) {
    console.log('Email notification failed:', emailError.message);
  }

  return user;
};

module.exports = {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
};