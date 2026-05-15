const usersService = require('./users.service');

// ── Get Profile ──────────────────────────────
const getProfile = async (req, res) => {
  try {
    const profile = await usersService.getProfile(req.user.id, req.user.role);
    res.status(200).json({ success: true, profile });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ── Update Profile ───────────────────────────
const updateProfile = async (req, res) => {
  try {
    const profile = await usersService.updateProfile(req.user.id, req.user.role, req.body);
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      profile,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ── Change Password ──────────────────────────
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await usersService.changePassword(req.user.id, {
      currentPassword,
      newPassword,
    });
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const targetUserId = parseInt(req.params.id);
    const user = await usersService.getUserById(
      targetUserId,
      req.user.id,
      req.user.role
    );
    res.status(200).json({ success: true, user });
  } catch (error) {
    const status = error.message.includes('denied') ? 403 : 404;
    res.status(status).json({ success: false, message: error.message });
  }
};
const addMeasurement = async (req, res) => {
  try {
    const measurement = await usersService.addMeasurement(req.user.id, req.body);
    res.status(201).json({ success: true, measurement });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  getUserById,
  addMeasurement,
};
