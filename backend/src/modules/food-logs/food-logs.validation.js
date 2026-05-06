const validateUploadMeal = (req, res, next) => {
  const { imageUrl } = req.body;

  if (!imageUrl || imageUrl.trim() === '') {
    return res.status(400).json({ success: false, message: 'Image URL is required' });
  }

  next();
};

module.exports = { validateUploadMeal };