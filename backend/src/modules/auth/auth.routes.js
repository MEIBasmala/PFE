const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const authController = require("./auth.controller");
const passport = require("../../config/passport");
const tokenService = require("../../services/token.service");
const {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
} = require("./auth.validation");
const { protect } = require("../../middleware/auth");

// Same cookie settings used in auth.controller.js
const getRefreshCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
});

router.post("/register", validateRegister, authController.register);
router.post("/login", validateLogin, authController.login);
router.post("/forgot-password", validateForgotPassword, authController.forgotPassword);
router.post("/reset-password", validateResetPassword, authController.resetPassword);
router.get("/me", protect, authController.getMe);

// ── Token Refresh ─────────────────────────────────────────────
router.post("/refresh", authController.refresh);
router.post("/refresh/logout", authController.refreshLogout);

// ── Google OAuth ──────────────────────────────────────────────
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${process.env.CLIENT_URL}/auth?error=google_failed`,
  }),
  async (req, res) => {
    const accessToken = jwt.sign(
      { id: req.user.id, role: req.user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "15m" }
    );

    const refreshToken = tokenService.generateRefreshToken();
    await tokenService.storeRefreshToken(req.user.id, refreshToken);
    res.cookie("refreshToken", refreshToken, getRefreshCookieOptions());

    res.redirect(
      `${process.env.CLIENT_URL}/auth?token=${accessToken}&role=${req.user.role}&source=oauth`
    );
  }
);

module.exports = router;