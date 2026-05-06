const prisma = require('../../config/db');

const getPatientProgress = async (patientId) => {
  return await prisma.progress.findMany({
    where: { patientId },
    orderBy: { recordedAt: 'desc' },
  });
};

const getProgressById = async (id) => {
  return await prisma.progress.findUnique({ where: { id } });
};

const createProgress = async (data) => {
  return await prisma.progress.create({ data });
};

const updateProgressNotes = async (id, notes) => {
  return await prisma.progress.update({
    where: { id },
    data: { nutritionistNotes: notes },
  });
};

const getPatientByUserId = async (userId) => {
  return await prisma.patient.findUnique({ where: { userId } });
};

const getNutritionistByUserId = async (userId) => {
  return await prisma.nutritionist.findUnique({ where: { userId } });
};

module.exports = {
  getPatientProgress,
  getProgressById,
  createProgress,
  updateProgressNotes,
  getPatientByUserId,
  getNutritionistByUserId,
};