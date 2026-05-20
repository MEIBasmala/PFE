//  Register Validation 
const validateRegister = (req, res, next) => {
  const { fullName, email, password } = req.body;

  if (!fullName || fullName.trim() === '') {
    return res.status(400).json({ success: false, message: 'Full name is required' });
  }

  if (!email || email.trim() === '') {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, message: 'Invalid email format' });
  }

  if (!password || password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
  }

   const passwordError = validatePasswordStrength(password);
  if (passwordError) {
    return res.status(400).json({ success: false, message: passwordError });
  }

  next();
};

const validatePasswordStrength = (password) => {
  const minLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*]/.test(password);

  if (!minLength) return 'Password must be at least 8 characters';
  if (!hasUpper)  return 'Password must contain uppercase letter';
  if (!hasLower)  return 'Password must contain lowercase letter';
  if (!hasNumber) return 'Password must contain a number';
  if (!hasSpecial) return 'Password must contain special character (!@#$%^&*)';

  return null; // null = valid
};

//  Login Validation 
const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || email.trim() === '') {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }

  if (!password || password.trim() === '') {
    return res.status(400).json({ success: false, message: 'Password is required' });
  }

  next();
};

//  Forgot Password Validation 
const validateForgotPassword = (req, res, next) => {
  const { email } = req.body;

  if (!email || email.trim() === '') {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, message: 'Invalid email format' });
  }

  next();
};

//  Reset Password Validation 
const validateResetPassword = (req, res, next) => {
  const { token, password } = req.body;

  if (!token || token.trim() === '') {
    return res.status(400).json({ success: false, message: 'Token is required' });
  }

  if (!password || password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
  }

  next();
};

module.exports = {
  validateRegister,
  validatePasswordStrength,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
};