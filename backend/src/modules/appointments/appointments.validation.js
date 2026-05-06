// Book Appointment Validation
const validateBookAppointment = (req, res, next) => {
  const { slotId, nutritionistId } = req.body;

  if (!slotId) {
    return res.status(400).json({ success: false, message: 'Slot ID is required' });
  }
  if (isNaN(slotId) || slotId < 1) {
    return res.status(400).json({ success: false, message: 'Invalid slot ID' });
  }
  if (!nutritionistId) {
    return res.status(400).json({ success: false, message: 'Nutritionist ID is required' });
  }
  if (isNaN(nutritionistId) || nutritionistId < 1) {
    return res.status(400).json({ success: false, message: 'Invalid nutritionist ID' });
  }
  next();
};

// Complete Appointment Validation
const validateCompleteAppointment = (req, res, next) => {
  const { notes } = req.body;
  if (notes !== undefined && notes.trim() === '') {
    return res.status(400).json({ success: false, message: 'Notes cannot be empty' });
  }
  next();
};

module.exports = {
  validateBookAppointment,
  validateCompleteAppointment,
};