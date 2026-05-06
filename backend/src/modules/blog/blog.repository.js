const prisma = require('../../config/db');

const getAllArticles = async () => {
  return await prisma.blogArticle.findMany({
    where: { status: 'PUBLISHED' },
    include: {
      admin: { include: { user: { select: { id: true, fullName: true } } } },
      comments: { include: { patient: { include: { user: { select: { id: true, fullName: true } } } } } },
    },
    orderBy: { publishedAt: 'desc' },
  });
};

const getArticleById = async (id) => {
  return await prisma.blogArticle.findUnique({
    where: { id },
    include: {
      admin: { include: { user: { select: { id: true, fullName: true } } } },
      comments: { include: { patient: { include: { user: { select: { id: true, fullName: true } } } } } },
    },
  });
};

const createArticle = async (data) => {
  return await prisma.blogArticle.create({ data });
};

const updateArticle = async (id, data) => {
  return await prisma.blogArticle.update({ where: { id }, data });
};

const deleteArticle = async (id) => {
  return await prisma.blogArticle.delete({ where: { id } });
};

const addComment = async (data) => {
  return await prisma.comment.create({ data });
};

const deleteComment = async (id) => {
  return await prisma.comment.delete({ where: { id } });
};

const getCommentById = async (id) => {
  return await prisma.comment.findUnique({ where: { id } });
};

const getAdminByUserId = async (userId) => {
  return await prisma.admin.findUnique({ where: { userId } });
};

const getPatientByUserId = async (userId) => {
  return await prisma.patient.findUnique({ where: { userId } });
};

module.exports = {
  getAllArticles, getArticleById, createArticle,
  updateArticle, deleteArticle, addComment,
  deleteComment, getCommentById, getAdminByUserId,
  getPatientByUserId,
};