const prisma = require('../../config/db');

// Helper: sanitize data for Prisma create/update
const transformPlanData = (data) => {
  // pdfAssignedAt is NOT in the Prisma schema — drop it
  const { patientId, nutritionistId, meals, pdfAssignedAt, ...rest } = data;
  const transformed = { ...rest };

  if (patientId !== undefined) {
    if (patientId === null || patientId === '') {
      transformed.patient = { disconnect: true };
    } else {
      transformed.patient = { connect: { id: Number(patientId) } };
    }
  }

  if (nutritionistId !== undefined) {
    if (nutritionistId === null || nutritionistId === '') {
      transformed.nutritionist = { disconnect: true };
    } else {
      transformed.nutritionist = { connect: { id: Number(nutritionistId) } };
    }
  }

  return transformed;
};

// For patients: get only non-template plans assigned to them
const getAllPatientPlans = async (patientId) => {
  return await prisma.nutritionPlan.findMany({
    where: {
      patientId: Number(patientId),
      isTemplate: false,
    },
    include: {
      patient: { include: { user: { select: { id: true, fullName: true, email: true } } } },
      nutritionist: { include: { user: { select: { id: true, fullName: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  });
};

// For nutritionists: get all plans they created
const getNutritionistPlans = async (nutritionistId) => {
  return await prisma.nutritionPlan.findMany({
    where: { nutritionistId: Number(nutritionistId) },
    include: {
      patient: { include: { user: { select: { id: true, fullName: true, email: true } } } },
      nutritionist: { include: { user: { select: { id: true, fullName: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  });
};

// Get all prebuilt (template) plans
const getPrebuiltPlans = async () => {
  return await prisma.nutritionPlan.findMany({
    where: {
      isTemplate: true,
      status: 'ACTIVE',
    },
    include: {
      meals: {
        include: { foodItems: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

const getPlanById = async (id) => {
  return await prisma.nutritionPlan.findUnique({
    where: { id: Number(id) },
    include: {
      patient: { include: { user: true } },
      nutritionist: { include: { user: true } },
      meals: {
        include: { foodItems: true },
      },
    },
  });
};

// Create plan – uses relation connect for patient/nutritionist
const createPlan = async (data) => {
  const prismaData = transformPlanData(data);
  return await prisma.nutritionPlan.create({
    data: prismaData,
    include: {
      patient: { include: { user: true } },
      nutritionist: { include: { user: true } },
    },
  });
};

const updatePlan = async (id, data) => {
  const prismaData = transformPlanData(data);
  return await prisma.nutritionPlan.update({
    where: { id: Number(id) },
    data: prismaData,
    include: {
      patient: { include: { user: true } },
      nutritionist: { include: { user: true } },
    },
  });
};

const deletePlan = async (id) => {
  return await prisma.nutritionPlan.delete({
    where: { id: Number(id) },
    include: {
      patient: { include: { user: true } },
      nutritionist: { include: { user: true } },
    },
  });
};


const getMealById = async (id) => {
  return await prisma.meal.findUnique({ where: { id: Number(id) } });
};

// Lookups by User ID
const getPatientByUserId = async (userId) => {
  return await prisma.patient.findUnique({ where: { userId: Number(userId) } });
};

const getNutritionistByUserId = async (userId) => {
  return await prisma.nutritionist.findUnique({ where: { userId: Number(userId) } });
};

// Lookup by Patient ID
const getPatientById = async (id) => {
  return await prisma.patient.findUnique({
    where: { id: Number(id) },
    include: { user: true },
  });
};

module.exports = {
  getAllPatientPlans,
  getPlanById,
  getNutritionistPlans,
  createPlan,
  updatePlan,
  deletePlan,
  getMealById,
  getPatientByUserId,
  getNutritionistByUserId,
  getPatientById,
  getPrebuiltPlans,
};