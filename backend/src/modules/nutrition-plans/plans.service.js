const plansRepo = require('./plans.repository');
const sendEmail = require('../../config/email');
const { createNotification } = require('../notifications/notifications.service');

const getMyPlans = async (userId, role) => {
  if (role === 'PATIENT') {
    const patient = await plansRepo.getPatientByUserId(userId);
    if (!patient) throw new Error('Patient profile not found');
    return await plansRepo.getAllPatientPlans(patient.id);
  }
  if (role === 'NUTRITIONIST') {
    const nutritionist = await plansRepo.getNutritionistByUserId(userId);
    if (!nutritionist) throw new Error('Nutritionist profile not found');
    return await plansRepo.getNutritionistPlans(nutritionist.id);
  }
  throw new Error('Invalid role');
};

const getPlanById = async (planId) => {
  const plan = await plansRepo.getPlanById(planId);
  if (!plan) throw new Error('Plan not found');
  return plan;
};

// New: get prebuilt templates (public)
const getPrebuiltPlans = async () => {
  return await plansRepo.getPrebuiltPlans();
};

const createPlan = async (userId, planData) => {
  const nutritionist = await plansRepo.getNutritionistByUserId(userId);
  if (!nutritionist) throw new Error('Nutritionist profile not found');

  // If it's a template, patientId and nutritionistId can be null (or set nutritionistId)
  const { patientId, startDate, endDate, isTemplate, name, durationDays } = planData;

  const plan = await plansRepo.createPlan({
    patientId: isTemplate ? null : (patientId ? patientId : null),
    nutritionistId: nutritionist.id,
    startDate: startDate ? new Date(startDate) : null,
    endDate: endDate ? new Date(endDate) : null,
    status: isTemplate ? 'ACTIVE' : 'DRAFT',
    isTemplate: isTemplate || false,
    name: name || null,
    durationDays: durationDays || null,
  });

  if (!isTemplate && patientId) {
    // --- NOTIFY THE PATIENT ---
    try {
      // patientId here is the patient's User.id (since frontend sends patient's user id)
      const patientUser = await require('../users/users.repository').findById(patientId);
      if (patientUser) {
        await createNotification(
          patientUser.id,
          'PLAN',
          `A new nutrition plan has been created for you (${new Date(startDate).toLocaleDateString()} – ${new Date(endDate).toLocaleDateString()}). Check your dashboard.`
        );
      }
    } catch (err) {
      console.error('Failed to create plan notification:', err.message);
    }
    try {
      const patient = await require('../users/users.repository').findById(
        (await plansRepo.getPatientByUserId(patientId))?.userId
      );
      await sendEmail({
        to: patient?.email,
        subject: 'KhabirLens — New Nutrition Plan 🥗',
        html: `<h2>New Nutrition Plan!</h2>
             <p>Your nutritionist has created a new nutrition plan for you.</p>`,
      });
    } catch (e) {
      console.log('Email failed:', e.message);
    }
  }
  return plan;
};

const updatePlan = async (userId, planId, data) => {
  const nutritionist = await plansRepo.getNutritionistByUserId(userId);
  const plan = await plansRepo.getPlanById(planId);
  if (!plan) throw new Error('Plan not found');
  if (plan.nutritionistId !== nutritionist.id) throw new Error('Unauthorized');

  const oldStatus = plan.status;
  const updated = await plansRepo.updatePlan(planId, data);

  if (data.status === 'ACTIVE' && oldStatus !== 'ACTIVE') {
    try {
      const patientUser = await require('../users/users.repository').findById(plan.patient?.userId);
      if (patientUser) {
        await createNotification(
          patientUser.id,
          'PLAN',
          `Your nutrition plan is now active! You can view and follow it in your dashboard.`
        );
      }
    } catch (err) {
      console.error('Failed to send plan activation notification:', err.message);
    }
  }

  return updated;

};

const deletePlan = async (userId, planId) => {
  const nutritionist = await plansRepo.getNutritionistByUserId(userId);
  if (!nutritionist) throw new Error('Nutritionist profile not found');

  const plan = await plansRepo.getPlanById(planId);
  if (!plan) throw new Error('Plan not found');
  if (plan.nutritionistId !== nutritionist.id) throw new Error('Unauthorized');

  return await plansRepo.deletePlan(planId);
};

const addMeal = async (userId, planId, { dayNumber, mealType, instructions }) => {
  const nutritionist = await plansRepo.getNutritionistByUserId(userId);
  if (!nutritionist) throw new Error('Nutritionist profile not found');

  const plan = await plansRepo.getPlanById(planId);
  if (!plan) throw new Error('Plan not found');
  if (plan.nutritionistId !== nutritionist.id) throw new Error('Unauthorized');

  return await plansRepo.createMeal({ planId, dayNumber, mealType, instructions });
};

const updateMeal = async (userId, planId, mealId, data) => {
  const nutritionist = await plansRepo.getNutritionistByUserId(userId);
  if (!nutritionist) throw new Error('Nutritionist profile not found');

  const plan = await plansRepo.getPlanById(planId);
  if (!plan) throw new Error('Plan not found');
  if (plan.nutritionistId !== nutritionist.id) throw new Error('Unauthorized');

  const meal = await plansRepo.getMealById(mealId);
  if (!meal) throw new Error('Meal not found');

  return await plansRepo.updateMeal(mealId, data);
};

const deleteMeal = async (userId, planId, mealId) => {
  const nutritionist = await plansRepo.getNutritionistByUserId(userId);
  if (!nutritionist) throw new Error('Nutritionist profile not found');

  const plan = await plansRepo.getPlanById(planId);
  if (!plan) throw new Error('Plan not found');
  if (plan.nutritionistId !== nutritionist.id) throw new Error('Unauthorized');

  return await plansRepo.deleteMeal(mealId);
};

module.exports = {
  getMyPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan,
  addMeal,
  updateMeal,
  deleteMeal,
  getPrebuiltPlans
};