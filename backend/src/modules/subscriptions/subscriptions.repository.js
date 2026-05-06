const prisma = require('../../config/db');

//  Get All Packages 
const getAllPackages = async () => {
  return await prisma.package.findMany({
    orderBy: { price: 'asc' },
  });
};

//  Get Package by ID 
const getPackageById = async (id) => {
  return await prisma.package.findUnique({ where: { id } });
};

//  Get Active Subscription 
const getActiveSubscription = async (patientId) => {
  return await prisma.subscription.findFirst({
    where: {
      patientId,
      status: 'ACTIVE',
    },
    include: { package: true },
  });
};

//  Get All Patient Subscriptions 
const getPatientSubscriptions = async (patientId) => {
  return await prisma.subscription.findMany({
    where: { patientId },
    include: { package: true },
    orderBy: { createdAt: 'desc' },
  });
};

//  Create Subscription 
const createSubscription = async (data) => {
  return await prisma.subscription.create({
    data,
    include: { package: true },
  });
};

//  Cancel Subscription 
const cancelSubscription = async (id) => {
  return await prisma.subscription.update({
    where: { id },
    data: { status: 'CANCELLED' },
    include: { package: true },
  });
};

//  Get Subscription by ID 
const getSubscriptionById = async (id) => {
  return await prisma.subscription.findUnique({
    where: { id },
    include: { package: true },
  });
};

//  Get Patient by UserID 
const getPatientByUserId = async (userId) => {
  return await prisma.patient.findUnique({ where: { userId } });
};

module.exports = {
  getAllPackages,
  getPackageById,
  getActiveSubscription,
  getPatientSubscriptions,
  createSubscription,
  cancelSubscription,
  getSubscriptionById,
  getPatientByUserId,
};