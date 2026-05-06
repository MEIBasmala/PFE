// ── Update Profile Validation ────────────────
const validateUpdateProfile = (req, res, next) => {
  const { fullName, age, weight, height } = req.body;

  if (fullName !== undefined && fullName.trim() === '') {
    return res.status(400).json({ success: false, message: 'Full name cannot be empty' });
  }

  if (age !== undefined && (isNaN(age) || age < 0 || age > 120)) {
    return res.status(400).json({ success: false, message: 'Invalid age' });
  }

  if (weight !== undefined && (isNaN(weight) || weight < 0 || weight > 500)) {
    return res.status(400).json({ success: false, message: 'Invalid weight' });
  }

  if (height !== undefined && (isNaN(height) || height < 0 || height > 300)) {
    return res.status(400).json({ success: false, message: 'Invalid height' });
  }

  next();
};

// ── Change Password Validation ───────────────
const validateChangePassword = (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || currentPassword.trim() === '') {
    return res.status(400).json({ success: false, message: 'Current password is required' });
  }

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
  }

  if (currentPassword === newPassword) {
    return res.status(400).json({ success: false, message: 'New password must be different from current password' });
  }

  next();
};

module.exports = {
  validateUpdateProfile,
  validateChangePassword,
};