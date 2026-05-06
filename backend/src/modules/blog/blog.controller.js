const blogService = require('./blog.service');

const getAllArticles = async (req, res) => {
  try {
    const articles = await blogService.getAllArticles();
    res.status(200).json({ success: true, articles });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getArticleById = async (req, res) => {
  try {
    const article = await blogService.getArticleById(parseInt(req.params.id));
    res.status(200).json({ success: true, article });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const createArticle = async (req, res) => {
  try {
    const article = await blogService.createArticle(req.user.id, req.body);
    res.status(201).json({ success: true, message: 'Article created successfully', article });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateArticle = async (req, res) => {
  try {
    const article = await blogService.updateArticle(req.user.id, parseInt(req.params.id), req.body);
    res.status(200).json({ success: true, message: 'Article updated successfully', article });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteArticle = async (req, res) => {
  try {
    await blogService.deleteArticle(req.user.id, parseInt(req.params.id));
    res.status(200).json({ success: true, message: 'Article deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const addComment = async (req, res) => {
  try {
    const comment = await blogService.addComment(req.user.id, parseInt(req.params.id), req.body.content);
    res.status(201).json({ success: true, message: 'Comment added successfully', comment });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteComment = async (req, res) => {
  try {
    await blogService.deleteComment(req.user.id, parseInt(req.params.id), parseInt(req.params.commentId));
    res.status(200).json({ success: true, message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllArticles, getArticleById, createArticle,
  updateArticle, deleteArticle, addComment, deleteComment,
};