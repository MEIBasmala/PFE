const prisma = require('../../config/db');

// For patients: get only non-template plans assigned to them
const getAllPatientPlans = async (patientId) => {
  return await prisma.nutritionPlan.findMany({
    where: { 
      patientId: patientId,
      isTemplate: false,
    },
    include: { meals: { include: { foodItems: true } } },
    orderBy: { createdAt: 'desc' },
  });
};

// For nutritionists: get all plans they created (both patient-specific and templates they own)
const getNutritionistPlans = async (nutritionistId) => {
  return await prisma.nutritionPlan.findMany({
    where: { nutritionistId },
    include: {
      patient: { include: { user: { select: { id: true, fullName: true } } } },
      meals: { include: { foodItems: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
};

// Get all prebuilt (template) plans – optionally filter by active status
const getPrebuiltPlans = async () => {
  return await prisma.nutritionPlan.findMany({
    where: { 
      isTemplate: true,
      status: 'ACTIVE', // only show active templates
    },
    include: { meals: { include: { foodItems: true } } },
    orderBy: { createdAt: 'desc' },
  });
};

const getPlanById = async (id) => {
  return await prisma.nutritionPlan.findUnique({
    where: { id },
    include: { meals: { include: { foodItems: true } }, patient: { include: { user: true } } },
  });
};

// Create plan – now accepts optional patientId / nutritionistId (null for templates)
const createPlan = async (data) => {
  return await prisma.nutritionPlan.create({ data });
};

const updatePlan = async (id, data) => {
  return await prisma.nutritionPlan.update({ where: { id }, data });
};

const deletePlan = async (id) => {
  return await prisma.nutritionPlan.delete({ where: { id } });
};

// Meal / FoodItem functions unchanged (they work with any NutritionPlan)
const createMeal = async (data) => {
  return await prisma.meal.create({
    data,
    include: { foodItems: true },
  });
};

const updateMeal = async (id, data) => {
  return await prisma.meal.update({ where: { id }, data });
};

const deleteMeal = async (id) => {
  return await prisma.meal.delete({ where: { id } });
};

const getMealById = async (id) => {
  return await prisma.meal.findUnique({ where: { id } });
};

const getPatientByUserId = async (userId) => {
  return await prisma.patient.findUnique({ where: { userId } });
};

const getNutritionistByUserId = async (userId) => {
  return await prisma.nutritionist.findUnique({ where: { userId } });
};

module.exports = {
  getAllPatientPlans,
  getPlanById,
  getNutritionistPlans,
  createPlan,
  updatePlan,
  deletePlan,
  createMeal,
  updateMeal,
  deleteMeal,
  getMealById,
  getPatientByUserId,
  getNutritionistByUserId,
  getPrebuiltPlans
};
