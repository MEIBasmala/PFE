const validateCreatePlan = (req, res, next) => {
  const { patientId, startDate, endDate } = req.body;

  if (!patientId) return res.status(400).json({ success: false, message: 'Patient ID is required' });
  if (!startDate) return res.status(400).json({ success: false, message: 'Start date is required' });
  if (!endDate) return res.status(400).json({ success: false, message: 'End date is required' });
  if (new Date(startDate) >= new Date(endDate)) {
    return res.status(400).json({ success: false, message: 'End date must be after start date' });
  }

  next();
};

const validateAddMeal = (req, res, next) => {
  const { dayNumber, mealType } = req.body;

  if (!dayNumber || isNaN(dayNumber)) {
    return res.status(400).json({ success: false, message: 'Valid day number is required' });
  }

  const validTypes = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'];
  if (!mealType || !validTypes.includes(mealType)) {
    return res.status(400).json({ success: false, message: 'Valid meal type is required (BREAKFAST, LUNCH, DINNER, SNACK)' });
  }

  next();
};

module.exports = { validateCreatePlan, validateAddMeal };