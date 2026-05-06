const validateCreateArticle = (req, res, next) => {
  const { title, content } = req.body;

  if (!title || title.trim() === '') {
    return res.status(400).json({ success: false, message: 'Title is required' });
  }

  if (!content || content.trim() === '') {
    return res.status(400).json({ success: false, message: 'Content is required' });
  }

  next();
};

const validateAddComment = (req, res, next) => {
  const { content } = req.body;

  if (!content || content.trim() === '') {
    return res.status(400).json({ success: false, message: 'Comment content is required' });
  }

  if (content.length > 500) {
    return res.status(400).json({ success: false, message: 'Comment too long (max 500 chars)' });
  }

  next();
};

module.exports = { validateCreateArticle, validateAddComment };