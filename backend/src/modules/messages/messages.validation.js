const validateSendMessage = (req, res, next) => {
  const { receiverId, content, imageUrl } = req.body;

  if (!receiverId || isNaN(receiverId)) {
    return res.status(400).json({ success: false, message: 'Valid receiver ID is required' });
  }

  // FIX: Allow image-only messages (no text content required if imageUrl present)
  if ((!content || content.trim() === '') && !imageUrl) {
    return res.status(400).json({ success: false, message: 'Message content or image is required' });
  }

  if (content && content.length > 1000) {
    return res.status(400).json({ success: false, message: 'Message too long (max 1000 chars)' });
  }

  next();
};

module.exports = { validateSendMessage };