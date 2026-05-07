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

const createProgressPhoto = async (data) => {
  const { patientId, month, photoUrl } = data;
  return await prisma.progressPhoto.upsert({
    where: {
      patientId_month: {  
        patientId: patientId,
        month: month,
      },
    },
    update: {
      photoUrl: photoUrl, // replace the old photo with the new one
    },
    create: {
      patientId: patientId,
      month: month,
      photoUrl: photoUrl,
    },
  });
};
const getPatientProgressPhotos = async (patientId) => {
  return await prisma.progressPhoto.findMany({
    where: { patientId },
    orderBy: { createdAt: 'desc' },
  });
};

const getLastProgressPhoto = async (patientId) => {
  return await prisma.progressPhoto.findFirst({
    where: { patientId },
    orderBy: { createdAt: 'desc' },
  });
};

const deleteProgressPhoto = async (id, patientId) => {
  return await prisma.progressPhoto.deleteMany({
    where: { id, patientId },
  });
};

module.exports = {
  getPatientProgress,
  getProgressById,
  createProgress,
  updateProgressNotes,
  getPatientByUserId,
  getNutritionistByUserId,
  createProgressPhoto,
  getPatientProgressPhotos,
  getLastProgressPhoto,
  deleteProgressPhoto
};