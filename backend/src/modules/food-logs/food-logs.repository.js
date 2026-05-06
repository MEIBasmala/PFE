const prisma = require('../../config/db');

const getFoodLogs = async (patientId, date) => {
  const where = { patientId };

  if (date) {
    const start = new Date(`${date}T00:00:00.000Z`);
    const end   = new Date(`${date}T23:59:59.999Z`);
    where.estimatedAt = { gte: start, lte: end };
  }

  return await prisma.foodLog.findMany({
    where,
    include: { aiEstimation: true },
    orderBy: { estimatedAt: 'desc' },
  });
};

const getFoodLogById = async (id) => {
  return await prisma.foodLog.findUnique({
    where: { id },
    include: { aiEstimation: true },
  });
};

const createFoodLog = async (data) => {
  return await prisma.foodLog.create({ data });
};

const createAIEstimation = async (data) => {
  return await prisma.aIEstimation.create({ data });
};

const deleteFoodLog = async (id) => {
  return await prisma.foodLog.delete({ where: { id } });
};

const getPatientByUserId = async (userId) => {
  return await prisma.patient.findUnique({ where: { userId } });
};
const countTodayAiScans = async (patientId) => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  return await prisma.foodLog.count({
    where: {
      patientId,
      estimatedAt: { gte: todayStart, lte: todayEnd },
      aiEstimation: { isNot: null } 
    }
  });
};


module.exports = {
  getFoodLogs,
  getFoodLogById,
  createFoodLog,
  createAIEstimation,
  deleteFoodLog,
  getPatientByUserId,
  countTodayAiScans
};