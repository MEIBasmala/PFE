const prisma = require('../../config/db');

//  Get Patient Profile 
const getPatientProfile = async (userId) => {
  return await prisma.patient.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true, fullName: true, email: true,
          role: true, isActive: true, createdAt: true,
        },
      },
      measurements: {                    
        orderBy: { recordedAt: 'desc' },
        take: 1,
      },
    },
  });
};

//  Get Nutritionist Profile 
const getNutritionistProfile = async (userId) => {
  return await prisma.nutritionist.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      },
    },
  });
};

//  Update User 
const updateUser = async (userId, data) => {
  return await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      updatedAt: true,
    },
  });
};

//  Update Patient Profile 
const updatePatientProfile = async (userId, data) => {
  return await prisma.patient.update({
    where: { userId },
    data,
  });
};

//  Update Nutritionist Profile 
const updateNutritionistProfile = async (userId, data) => {
  return await prisma.nutritionist.update({
    where: { userId },
    data,
  });
};

//  Find User by ID 
const findById = async (id) => {
  return await prisma.user.findUnique({ where: { id } });
};

// Create Measurement for Patient
const createMeasurement = async (patientId, data) => {
  return await prisma.measurement.create({
    data: {
      patientId,
      chest: data.chest ?? null,
      waist: data.waist ?? null,
      hips: data.hips ?? null,
      arm: data.arm ?? null,
      thigh: data.thigh ?? null,
      bodyFat: data.bodyFat ?? null,
    },
  });
};
module.exports = {
  getPatientProfile,
  getNutritionistProfile,
  updateUser,
  updatePatientProfile,
  updateNutritionistProfile,
  findById,
  createMeasurement,
};