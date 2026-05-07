const express = require('express');
const router = express.Router();
const blogController = require('./blog.controller');
const { validateCreateArticle, validateAddComment } = require('./blog.validation');
const { protect, authorize } = require('../../middleware/auth');

// Public routes — no token needed (homepage preview, SEO, unauthenticated visitors)
router.get('/',    blogController.getAllArticles);
router.get('/:id', blogController.getArticleById);

// Admin-only write operations
router.post('/',   protect, authorize('ADMIN'), validateCreateArticle, blogController.createArticle);
router.put('/:id', protect, authorize('ADMIN'),                        blogController.updateArticle);
router.delete('/:id', protect, authorize('ADMIN'),                     blogController.deleteArticle);

// Patient-only comment operations
router.post('/:id/comments',              protect, authorize('PATIENT'), validateAddComment, blogController.addComment);
router.delete('/:id/comments/:commentId', protect, authorize('PATIENT'),                     blogController.deleteComment);

module.exports = router;