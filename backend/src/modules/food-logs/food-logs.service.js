const foodLogsRepo = require('./food-logs.repository');
const axios = require('axios');
const prisma = require('../../config/db');

const getMyFoodLogs = async (userId, date) => {
  const patient = await foodLogsRepo.getPatientByUserId(userId);
  if (!patient) throw new Error('Patient profile not found');
  return await foodLogsRepo.getFoodLogs(patient.id, date);
};

const getFoodLogById = async (userId, logId) => {
  const patient = await foodLogsRepo.getPatientByUserId(userId);
  if (!patient) throw new Error('Patient profile not found');

  const log = await foodLogsRepo.getFoodLogById(logId);
  if (!log) throw new Error('Food log not found');
  if (log.patientId !== patient.id) throw new Error('Unauthorized');

  return log;
};

const getDailyAiUsage = async (userId) => {
  const patient = await foodLogsRepo.getPatientByUserId(userId);
  if (!patient) throw new Error('Patient profile not found');
  const count = await foodLogsRepo.countTodayAiScans(patient.id);
  return { aiScansUsedToday: count };
};

const uploadMealImage = async (userId, imageUrl) => {
  const patient = await foodLogsRepo.getPatientByUserId(userId);
  if (!patient) throw new Error('Client profile not found');

  // ─── AI QUOTA ENFORCEMENT (BACKEND SECURITY) ───────────────────────────────
  // Enforces limits regardless of frontend (curl, postman, etc.)
  const activeSub = await prisma.subscription.findFirst({
    where: {
      patientId: patient.id,
      status: 'ACTIVE',
      endDate: { gt: new Date() },
    },
    include: { package: true },
  });

  // No active subscription → deny (NO guessing, NO fallback logic)
  if (!activeSub) {
    throw new Error('No active subscription. Please subscribe to use AI scanning.');
  }

  const dailyLimit = activeSub.package.aiScansPerDay;
  const usedToday = await foodLogsRepo.countTodayAiScans(patient.id);

  if (usedToday >= dailyLimit) {
    throw new Error(
      `Daily AI scan limit reached (${usedToday}/${dailyLimit}). Upgrade your plan or try again tomorrow.`
    );
  }
  // ───────────────────────────────────────────────────────────────────────────

  let detectedFoods = null;
  let totalCalories = null;
  let confidenceScore = null;
  let aiEstimationData = null;

  // AI service call 
  try {
    const startTime = Date.now();
    const response = await axios.post(`${process.env.AI_SERVICE_URL}/predict`, {
      image_url: imageUrl,
    });

    const processingTime = (Date.now() - startTime) / 1000;

    detectedFoods = response.data.detected_foods;
    totalCalories = response.data.total_calories;
    confidenceScore = response.data.confidence_score;

    aiEstimationData = {
      modelVersion: response.data.model_version || 'YOLOv8',
      detectedItems: detectedFoods,
      processingTime,
      warning: confidenceScore < 0.7,
    };
  } catch (aiError) {
    console.log('AI Service unavailable:', aiError.message);
  }

  // Create Food Log (always created even if AI fails)
  const foodLog = await foodLogsRepo.createFoodLog({
    patientId: patient.id,
    imageUrl,
    detectedFoods,
    totalCalories,
    confidenceScore,
  });

  // Create AI Estimation if AI succeeded
  if (aiEstimationData) {
    await foodLogsRepo.createAIEstimation({
      foodLogId: foodLog.id,
      ...aiEstimationData,
    });
  }

  return await foodLogsRepo.getFoodLogById(foodLog.id);
};

const deleteFoodLog = async (userId, logId) => {
  const patient = await foodLogsRepo.getPatientByUserId(userId);
  if (!patient) throw new Error('Patient profile not found');

  const log = await foodLogsRepo.getFoodLogById(logId);
  if (!log) throw new Error('Food log not found');
  if (log.patientId !== patient.id) throw new Error('Unauthorized');

  return await foodLogsRepo.deleteFoodLog(logId);
};

const createFoodLog = async (userId, data) => {
  const patient = await foodLogsRepo.getPatientByUserId(userId);
  if (!patient) throw new Error('Patient profile not found');

  const foodLog = await foodLogsRepo.createFoodLog({
    patientId: patient.id,
    imageUrl: data.imageUrl || null,
    detectedFoods: data.detectedFoods || null,
    totalCalories: data.totalCalories ?? 0,
    confidenceScore: data.confidenceScore || null,
    estimatedAt: data.estimatedAt ? new Date(data.estimatedAt) : new Date(),
  });

  return await foodLogsRepo.getFoodLogById(foodLog.id);
};

module.exports = {
  getMyFoodLogs,
  getFoodLogById,
  uploadMealImage,
  deleteFoodLog,
  getDailyAiUsage,
  createFoodLog,
};