const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
} = require('./auth.validation');
const { protect } = require('../../middleware/auth');

router.post('/register',        validateRegister,       authController.register);
router.post('/login',           validateLogin,          authController.login);
router.post('/forgot-password', validateForgotPassword, authController.forgotPassword);
router.post('/reset-password',  validateResetPassword,  authController.resetPassword);
router.get('/me',               protect,                authController.getMe);

module.exports = router;