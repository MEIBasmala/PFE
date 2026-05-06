const prisma = require('../../config/db');

//  Create Payment 
const createPayment = async (data) => {
  return await prisma.payment.create({ data });
};

//  Get Payment by Intent ID 
const getPaymentByIntentId = async (stripePaymentIntentId) => {
  return await prisma.payment.findFirst({
    where: { stripePaymentIntentId },
  });
};

//  Update Payment Status 
const updatePaymentStatus = async (id, status) => {
  return await prisma.payment.update({
    where: { id },
    data: { status },
  });
};

//  Get Patient Payments 
const getPatientPayments = async (patientId) => {
  return await prisma.payment.findMany({
    where: { subscription: { patientId } },
    include: { subscription: { include: { package: true } } },
    orderBy: { createdAt: 'desc' },
  });
};

//  Get Patient by UserID 
const getPatientByUserId = async (userId) => {
  return await prisma.patient.findUnique({ where: { userId } });
};

//  Get Active Subscription 
const getActiveSubscription = async (patientId) => {
  return await prisma.subscription.findFirst({
    where: { patientId, status: 'ACTIVE' },
    include: { package: true },
  });
};

//  Create Subscription after Payment 
const createSubscriptionAfterPayment = async (data) => {
  return await prisma.subscription.create({ data });
};

//  Update Subscription Stripe ID
const updateSubscriptionStripeId = async (id, stripeSubscriptionId) => {
  return await prisma.subscription.update({
    where: { id },
    data: { stripeSubscriptionId },
  });
};

module.exports = {
  createPayment,
  getPaymentByIntentId,
  updatePaymentStatus,
  getPatientPayments,
  getPatientByUserId,
  getActiveSubscription,
  createSubscriptionAfterPayment,
  updateSubscriptionStripeId,
};