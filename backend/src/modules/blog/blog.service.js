const blogRepo = require('./blog.repository');

const getAllArticles = async () => {
  return await blogRepo.getAllArticles();
};

const getArticleById = async (id) => {
  const article = await blogRepo.getArticleById(id);
  if (!article) throw new Error('Article not found');
  return article;
};

const createArticle = async (userId, { title, content, category, coverImage }) => {
  const admin = await blogRepo.getAdminByUserId(userId);
  if (!admin) throw new Error('Admin profile not found');

  return await blogRepo.createArticle({
    adminId: admin.id,
    title,
    content,
    category: category || null,
    coverImage: coverImage || null,
    status: 'DRAFT',
  });
};

const updateArticle = async (userId, articleId, data) => {
  const admin = await blogRepo.getAdminByUserId(userId);
  if (!admin) throw new Error('Admin profile not found');

  const article = await blogRepo.getArticleById(articleId);
  if (!article) throw new Error('Article not found');
  if (article.adminId !== admin.id) throw new Error('Unauthorized');

  // إذا status PUBLISHED نضيف publishedAt
  if (data.status === 'PUBLISHED' && article.status !== 'PUBLISHED') {
    data.publishedAt = new Date();
  }

  return await blogRepo.updateArticle(articleId, data);
};

const deleteArticle = async (userId, articleId) => {
  const admin = await blogRepo.getAdminByUserId(userId);
  if (!admin) throw new Error('Admin profile not found');

  const article = await blogRepo.getArticleById(articleId);
  if (!article) throw new Error('Article not found');
  if (article.adminId !== admin.id) throw new Error('Unauthorized');

  return await blogRepo.deleteArticle(articleId);
};

const addComment = async (userId, articleId, content) => {
  const patient = await blogRepo.getPatientByUserId(userId);
  if (!patient) throw new Error('Client profile not found');

  const article = await blogRepo.getArticleById(articleId);
  if (!article) throw new Error('Article not found');

  return await blogRepo.addComment({
    articleId,
    patientId: patient.id,
    content,
  });
};

const deleteComment = async (userId, articleId, commentId) => {
  const patient = await blogRepo.getPatientByUserId(userId);
  if (!patient) throw new Error('Client profile not found');

  const comment = await blogRepo.getCommentById(commentId);
  if (!comment) throw new Error('Comment not found');
  if (comment.patientId !== patient.id) throw new Error('Unauthorized');

  return await blogRepo.deleteComment(commentId);
};

module.exports = {
  getAllArticles, getArticleById, createArticle,
  updateArticle, deleteArticle, addComment, deleteComment,
};