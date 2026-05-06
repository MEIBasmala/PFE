const express = require('express');
const router = express.Router();
const blogController = require('./blog.controller');
const { validateCreateArticle, validateAddComment } = require('./blog.validation');
const { protect, authorize } = require('../../middleware/auth');

router.get('/',                           protect,                                            blogController.getAllArticles);
router.get('/:id',                        protect,                                            blogController.getArticleById);
router.post('/',                          protect, authorize('ADMIN'), validateCreateArticle, blogController.createArticle);
router.put('/:id',                        protect, authorize('ADMIN'),                        blogController.updateArticle);
router.delete('/:id',                     protect, authorize('ADMIN'),                        blogController.deleteArticle);
router.post('/:id/comments',              protect, authorize('PATIENT'), validateAddComment,  blogController.addComment);
router.delete('/:id/comments/:commentId', protect, authorize('PATIENT'),                      blogController.deleteComment);

module.exports = router;