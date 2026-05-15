const plansRepo = require('./plans.repository');
const sendEmail = require('../../config/email');
const { createNotification } = require('../notifications/notifications.service');
const usersRepo = require('../users/users.repository');
const cloudinary = require('../../config/cloudinary');


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

// Get prebuilt templates (public)
const getPrebuiltPlans = async () => {
  return await plansRepo.getPrebuiltPlans();
};

const createPlan = async (userId, planData) => {
  const nutritionist = await plansRepo.getNutritionistByUserId(userId);
  if (!nutritionist) throw new Error('Nutritionist profile not found');

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

  // Notify patient if this is a real plan (not a template) — non-blocking
  if (!isTemplate && patientId) {
    setImmediate(async () => {
      try {
        const patientUser = await usersRepo.findById(patientId);
        if (patientUser) {
          await createNotification(
            patientUser.id,
            'PLAN',
            `A new nutrition plan has been created for you (${new Date(startDate).toLocaleDateString()} – ${new Date(endDate).toLocaleDateString()}). Check your dashboard.`
          );
        }
      } catch (err) {
        console.error('[Plan] Failed to create plan notification:', err.message);
      }

      try {
        // patientId here is the Patient table row id — resolve to User for email
        const patientProfile = await plansRepo.getPatientByUserId(patientId);
        if (patientProfile) {
          const patientUser = await usersRepo.findById(patientProfile.userId);
          if (patientUser) {
            await sendEmail({
              to: patientUser.email,
              subject: 'KhabirLens — New Nutrition Plan 🥗',
              html: `<h2>New Nutrition Plan!</h2>
                     <p>Your nutritionist has created a new nutrition plan for you.</p>`,
            });
          }
        }
      } catch (e) {
        console.error('[Plan] Email failed:', e.message);
      }
    });
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

  // Notify patient on activation — non-blocking
  if (data.status === 'ACTIVE' && oldStatus !== 'ACTIVE') {
    setImmediate(async () => {
      try {
        const patientUser = await usersRepo.findById(plan.patient?.userId);
        if (patientUser) {
          await createNotification(
            patientUser.id,
            'PLAN',
            `Your nutrition plan is now active! You can view and follow it in your dashboard.`
          );
        }
      } catch (err) {
        console.error('[Plan] Failed to send plan activation notification:', err.message);
      }
    });
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

// Helper to upload PDF buffer to Cloudinary
const uploadPdfToCloudinary = (buffer, originalName) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw',
        folder: 'meal_plans',
        public_id: `pdf_${Date.now()}_${originalName.replace(/\.[^/.]+$/, '')}`,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );
    uploadStream.end(buffer);
  });
};

const createPdfPlan = async (nutritionistUserId, file, patientId, title, notes) => {
  // 1. Get nutritionist profile
  const nutritionist = await plansRepo.getNutritionistByUserId(nutritionistUserId);
  if (!nutritionist) throw new Error('Nutritionist profile not found');

  // 2. Validate patient exists
  const patient = await plansRepo.getPatientByUserId(patientId);
  if (!patient) throw new Error('Patient not found');

  // 3. Upload PDF
  const pdfUrl = await uploadPdfToCloudinary(file.buffer, file.originalname);

  // 4. Create a NutritionPlan record with pdfUrl
  const plan = await plansRepo.createPlan({
    patientId: patient.id,
    nutritionistId: nutritionist.id,
    startDate: null,
    endDate: null,
    status: 'ACTIVE',          // PDF plans are immediately active
    isTemplate: false,
    name: title?.trim() || 'Meal Plan PDF',
    pdfUrl,
    pdfAssignedAt: new Date(),
    pdfNotes: notes?.trim() || null,
  });

  // 5. Notify patient (async)
  setImmediate(async () => {
    try {
      const patientUser = await usersRepo.findById(patient.userId);
      if (patientUser) {
        await createNotification(
          patientUser.id,
          'PLAN',
          `A new PDF meal plan (“${plan.name}”) has been assigned to you.`
        );
        await sendEmail({
          to: patientUser.email,
          subject: 'New Meal Plan PDF',
          html: `<p>Your nutritionist has uploaded a new meal plan PDF.</p>
                 <p><strong>${plan.name}</strong></p>
                 <a href="${pdfUrl}" target="_blank">View PDF</a>`,
        });
      }
    } catch (err) {
      console.error('PDF plan notification error:', err.message);
    }
  });

  // 6. Return formatted response for frontend
  return {
    id: plan.id,
    patientId: plan.patientId,
    patientName: patient.user.fullName,
    title: plan.name,
    notes: plan.pdfNotes,
    pdfUrl: plan.pdfUrl,
    uploadedAt: plan.pdfAssignedAt,
    assignedAt: plan.pdfAssignedAt,
  };
};

// Optional: get all PDF plans for the nutritionist
const getMyPdfPlans = async (nutritionistUserId) => {
  const nutritionist = await plansRepo.getNutritionistByUserId(nutritionistUserId);
  if (!nutritionist) throw new Error('Nutritionist profile not found');
  const allPlans = await plansRepo.getNutritionistPlans(nutritionist.id);
  return allPlans
    .filter(plan => plan.pdfUrl !== null)
    .map(plan => ({
      id: plan.id,
      patientId: plan.patientId,
      patientName: plan.patient?.user?.fullName ?? 'Unknown',
      title: plan.name,
      notes: plan.pdfNotes,
      pdfUrl: plan.pdfUrl,
      uploadedAt: plan.pdfAssignedAt,
      assignedAt: plan.pdfAssignedAt,
    }));
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
  getPrebuiltPlans,
  createPdfPlan,
  getMyPdfPlans,
  uploadPdfToCloudinary,
};