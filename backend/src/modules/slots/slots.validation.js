// slots.validation.js
const validateCreateSlot = (req, res, next) => {
  const { date, startTime, endTime } = req.body;

  // 1. Date presence & format
  if (!date || date.trim() === '') {
    return res.status(400).json({ success: false, message: 'Date is required' });
  }
  if (isNaN(Date.parse(date))) {
    return res.status(400).json({ success: false, message: 'Invalid date format' });
  }

  // 2. Past date check
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const slotDate = new Date(date);
  if (slotDate < today) {
    return res.status(400).json({ success: false, message: 'Cannot create slots in the past' });
  }

  // 3. Time presence
  if (!startTime || !endTime) {
    return res.status(400).json({ success: false, message: 'Start and end times are required' });
  }

  // 4. Start < End
  if (startTime >= endTime) {
    return res.status(400).json({ success: false, message: 'End time must be after start time' });
  }

  // 5. Duration between 30 and 60 minutes
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  const duration = (endHour * 60 + endMin) - (startHour * 60 + startMin);
  if (duration < 30) {
    return res.status(400).json({ success: false, message: 'Slot must be at least 30 minutes' });
  }
  if (duration > 60) {
    return res.status(400).json({ success: false, message: 'Slot cannot exceed 60 minutes' });
  }

  next();
};

module.exports = { validateCreateSlot };