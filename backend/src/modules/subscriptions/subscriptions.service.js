const subsRepo = require('./subscriptions.repository');

//  Get All Packages 
const getAllPackages = async () => {
  return await subsRepo.getAllPackages(); // returns [] if empty, never throws
};

//  Get My Subscription 
const getMySubscription = async (userId) => {
  const patient = await subsRepo.getPatientByUserId(userId);
  if (!patient) throw new Error('Patient profile not found');

  const subscriptions = await subsRepo.getPatientSubscriptions(patient.id);
  const active = await subsRepo.getActiveSubscription(patient.id);

  return { active, history: subscriptions };
};

//  Create Subscription 
const createSubscription = async (userId, { packageId, stripeSubscriptionId }) => {
  
  const patient = await subsRepo.getPatientByUserId(userId);
  if (!patient) throw new Error('Patient profile not found');

  
  const pkg = await subsRepo.getPackageById(packageId);
  if (!pkg) throw new Error('Package not found');


  const existing = await subsRepo.getActiveSubscription(patient.id);
  if (existing) throw new Error('You already have an active subscription');


   const startDate = new Date();
  const endDate = new Date();

  if (pkg.isSeasonal && pkg.duration) {
    const [num, unit] = pkg.duration.split(' ');
    const n = parseInt(num);
    if (unit.startsWith('day'))  endDate.setDate(endDate.getDate() + n);
    if (unit.startsWith('week')) endDate.setDate(endDate.getDate() + n * 7);
  } else {
    endDate.setMonth(endDate.getMonth() + 1);
  }

  const subscription = await subsRepo.createSubscription({
    patientId: patient.id,
    packageId,
    startDate,
    endDate,
    status: 'ACTIVE',
    stripeSubscriptionId: stripeSubscriptionId || null,
  });

  return subscription;
};

//  Cancel Subscription 
const cancelSubscription = async (userId, subscriptionId) => {
  
  const patient = await subsRepo.getPatientByUserId(userId);
  if (!patient) throw new Error('Patient profile not found');

 
  const subscription = await subsRepo.getSubscriptionById(subscriptionId);
  if (!subscription) throw new Error('Subscription not found');

 
  if (subscription.patientId !== patient.id) {
    throw new Error('Unauthorized');
  }

 
  if (subscription.status !== 'ACTIVE') {
    throw new Error('Subscription is not active');
  }

  return await subsRepo.cancelSubscription(subscriptionId);
};

module.exports = {
  getAllPackages,
  getMySubscription,
  createSubscription,
  cancelSubscription,
};