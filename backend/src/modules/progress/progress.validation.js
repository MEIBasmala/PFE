const validateAddProgress = (req, res, next) => {
  const { weight } = req.body;

  if (!weight || isNaN(weight)) {
    return res.status(400).json({ success: false, message: 'Valid weight is required' });
  }

  if (weight < 0 || weight > 500) {
    return res.status(400).json({ success: false, message: 'Invalid weight value' });
  }

  next();
};

const validateAddNotes = (req, res, next) => {
  const { notes } = req.body;

  if (!notes || notes.trim() === '') {
    return res.status(400).json({ success: false, message: 'Notes are required' });
  }

  next();
};
const validateAddPhoto = (req, res, next) => {
  const { photoUrl, month } = req.body;
  if (!photoUrl || !month) {
    return res.status(400).json({ success: false, message: 'Photo URL and month are required' });
  }
  if (!/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ success: false, message: 'Month must be in YYYY-MM format' });
  }
  next();
};


module.exports = { validateAddProgress, validateAddNotes, validateAddPhoto };