const validateChat = (req, res, next) => {
  const { message } = req.body;

  if (!message || message.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'Message is required'
    });
  }

  if (message.length > 1000) {
    return res.status(400).json({
      success: false,
      message: 'Message too long (max 1000 characters)'
    });
  }

  next();
};

module.exports = { validateChat };