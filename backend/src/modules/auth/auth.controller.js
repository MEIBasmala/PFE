const jwt = require("jsonwebtoken");
const authService = require("./auth.service");
const tokenService = require("../../services/token.service");
const prisma = require("../../config/db");
const crypto = require("crypto");

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "15m" }
  );
};

// ── Cookie helper ────────────────────────────────────────────
const getRefreshCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
});

// Register
const register = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
    const { user, refreshToken } = await authService.register({
      fullName,
      email,
      password,
    });
    const accessToken = generateToken(user);

    res.cookie("refreshToken", refreshToken, getRefreshCookieOptions());

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      token: accessToken,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { user, refreshToken } = await authService.login({
      email,
      password,
    });
    const accessToken = generateToken(user);

    res.cookie("refreshToken", refreshToken, getRefreshCookieOptions());

    res.status(200).json({
      success: true,
      message: "Login successful",
      token: accessToken,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get Me
const getMe = async (req, res) => {
  try {
    const user = await authService.getMe(req.user.id);
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Forgot Password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    await authService.forgotPassword(email);
    res
      .status(200)
      .json({ success: true, message: "Reset link sent to your email" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Reset Password
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    await authService.resetPassword({ token, password });
    res
      .status(200)
      .json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ── Refresh Access Token ─────────────────────────────────────
const refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res
        .status(401)
        .json({ success: false, message: "No refresh token provided" });
    }

    const user = await tokenService.verifyRefreshToken(refreshToken);
    const accessToken = generateToken(user);

    res.status(200).json({ success: true, token: accessToken });
  } catch (error) {
    res
      .status(401)
      .json({ success: false, message: "Invalid or expired refresh token" });
  }
};

// ── Logout (cookie-based) ────────────────────────────────────
const refreshLogout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      const hashedToken = crypto
        .createHash("sha256")
        .update(refreshToken)
        .digest("hex");
      await prisma.user.updateMany({
        where: { refreshToken: hashedToken },
        data: { refreshToken: null },
      });
    }
    res.clearCookie("refreshToken", getRefreshCookieOptions());
    res
      .status(200)
      .json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    // Always clear the cookie even if the DB update fails
    res.clearCookie("refreshToken", getRefreshCookieOptions());
    res
      .status(200)
      .json({ success: true, message: "Logged out successfully" });
  }
};

module.exports = {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  refresh,
  refreshLogout,
};