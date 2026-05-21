const validateUploadMeal = (req, res, next) => {
  const { imageUrl, category } = req.body;

  if (!imageUrl || imageUrl.trim() === '') {
    return res.status(400).json({ success: false, message: 'Image URL is required' });
  }

  if (category && !['breakfast', 'lunch', 'dinner', 'snack'].includes(category)) {
    return res.status(400).json({ success: false, message: 'Invalid meal category' });
  }

  next();
};

module.exports = { validateUploadMeal };