// ── Create Payment Intent Validation ────────
const validateCreatePaymentIntent = (req, res, next) => {
  const { packageId } = req.body;

  if (!packageId) {
    return res.status(400).json({ success: false, message: 'Package ID is required' });
  }

  if (isNaN(packageId) || packageId < 1) {
    return res.status(400).json({ success: false, message: 'Invalid package ID' });
  }

  next();
};

module.exports = {
  validateCreatePaymentIntent,
};