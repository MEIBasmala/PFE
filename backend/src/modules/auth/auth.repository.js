const prisma = require('../../config/db');

//  Find User by Email 
const findByEmail = async (email) => {
  return await prisma.user.findUnique({ where: { email } });
};

//  Find User by ID 
const findById = async (id) => {
  return await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });
};

//  Find User by Reset Token 
const findByResetToken = async (token) => {
  return await prisma.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExpiry: { gt: new Date() },
    },
  });
};

//  Create User 
const createUser = async ({ fullName, email, password }) => {
  return await prisma.user.create({
    data: {
      fullName,
      email,
      password,
      role: 'PATIENT',
    },
  });
};

//  Create Patient Profile 
const createPatientProfile = async (userId) => {
  return await prisma.patient.create({ data: { userId } });
};

//  Save Reset Token 
const saveResetToken = async (userId, token, expiry) => {
  return await prisma.user.update({
    where: { id: userId },
    data: { resetToken: token, resetTokenExpiry: expiry },
  });
};

//  Update Password 
const updatePassword = async (userId, hashedPassword) => {
  return await prisma.user.update({
    where: { id: userId },
    data: {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null,
    },
  });
};

//  Update Last Login 
const updateLastLogin = async (userId) => {
  return await prisma.user.update({
    where: { id: userId },
    data: { updatedAt: new Date() },
  });
};

module.exports = {
  findByEmail,
  findById,
  findByResetToken,
  createUser,
  createPatientProfile,
  saveResetToken,
  updatePassword,
  updateLastLogin,
};