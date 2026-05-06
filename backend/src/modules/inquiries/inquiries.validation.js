const validateCreateInquiry = (req, res, next) => {
  const { subject, message } = req.body;

  if (!subject || subject.trim() === '') {
    return res.status(400).json({ success: false, message: 'Subject is required' });
  }

  if (!message || message.trim() === '') {
    return res.status(400).json({ success: false, message: 'Message is required' });
  }

  next();
};

const validateReply = (req, res, next) => {
  const { reply } = req.body;

  if (!reply || reply.trim() === '') {
    return res.status(400).json({ success: false, message: 'Reply is required' });
  }

  next();
};

module.exports = { validateCreateInquiry, validateReply };