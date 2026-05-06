// src/modules/admin/admin.validation.js
const { VALIDATION, ROLES } = require('./admin.config');

const validateCreateNutritionist = (req, res, next) => {
  const { fullName, email, specialization, bio } = req.body;

  // fullName — required, non-empty, max length
  if (!fullName || fullName.trim() === '') {
    return res.status(400).json({ success: false, message: 'Full name is required' });
  }
  if (fullName.trim().length > VALIDATION.FULL_NAME_MAX_LENGTH) {
    return res.status(400).json({
      success: false,
      message: `Full name must be under ${VALIDATION.FULL_NAME_MAX_LENGTH} characters`,
    });
  }

  // email — required, valid format
  if (!email || email.trim() === '') {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }
  if (!VALIDATION.EMAIL_REGEX.test(email.trim())) {
    return res.status(400).json({ success: false, message: 'Invalid email format' });
  }

  // specialization — optional, max length
  if (specialization !== undefined && specialization.trim().length > VALIDATION.SPECIALIZATION_MAX_LENGTH) {
    return res.status(400).json({
      success: false,
      message: `Specialization must be under ${VALIDATION.SPECIALIZATION_MAX_LENGTH} characters`,
    });
  }

  // bio — optional, max length
  if (bio !== undefined && bio.trim().length > VALIDATION.BIO_MAX_LENGTH) {
    return res.status(400).json({
      success: false,
      message: `Bio must be under ${VALIDATION.BIO_MAX_LENGTH} characters`,
    });
  }

  // Sanitize — trim all string fields before they reach the service
  req.body.fullName = fullName.trim();
  req.body.email = email.trim().toLowerCase();
  if (specialization) req.body.specialization = specialization.trim();
  if (bio) req.body.bio = bio.trim();

  next();
};

module.exports = { validateCreateNutritionist };