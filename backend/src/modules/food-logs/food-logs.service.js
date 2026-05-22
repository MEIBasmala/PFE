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

const uploadMealImage = async (userId, imageUrl, category) => {
  const patient = await foodLogsRepo.getPatientByUserId(userId);
  if (!patient) throw new Error('Client profile not found');

  // ─── AI QUOTA ENFORCEMENT ──────────────────────────────────────────────────
  const FREE_DAILY_SCANS = 2;
  const activeSub = await prisma.subscription.findFirst({
    where: {
      patientId: patient.id,
      status: 'ACTIVE',
      endDate: { gt: new Date() },
    },
    include: { package: true },
  });
  const dailyLimit = activeSub?.package?.aiScansPerDay ?? FREE_DAILY_SCANS;
  const usedToday = await foodLogsRepo.countTodayAiScans(patient.id);
  if (usedToday >= dailyLimit) {
    throw new Error(
      `Daily AI scan limit reached (${usedToday}/${dailyLimit}). Upgrade your plan or try again tomorrow.`
    );
  }
  // ───────────────────────────────────────────────────────────────────────────

  let detectedFoods = {
    category: category || 'lunch',
    source: 'ai',
    name: 'Meal',
  };
  let totalCalories = null;
  let confidenceScore = null;
  let aiEstimationData = null;

  // ─── AI SERVICE CALL ───────────────────────────────────────────────────────
  try {
    const startTime = Date.now();

    const response = await axios.post(
      `${process.env.AI_SERVICE_URL}/predict/url`,
      { imageUrl },
      { timeout: 60000 }
    );

    const processingTime = (Date.now() - startTime) / 1000;
    const data = response.data;

    const rawDetectedItems = data.items || null;
    totalCalories = Math.round(data.total_calories ?? 0);

    if (rawDetectedItems && rawDetectedItems.length > 0) {
      // Calculate average confidence across all detections
      const avgConfidence = rawDetectedItems.reduce((sum, i) => sum + (i.confidence || 0), 0) 
        / rawDetectedItems.length;
      
      // Filter 1: Only individual items above 0.5 confidence
      const confidentItems = rawDetectedItems.filter((i) => (i.confidence || 0) >= 0.5);
      
      // Filter 2: Only show ingredient names if average confidence >= 0.6
      const ingredientNames = avgConfidence >= 0.6 && confidentItems.length > 0
        ? confidentItems
            .map((i) => i.name || i.label || i.class_name || 'Unknown item')
            .filter((n, i, arr) => arr.indexOf(n) === i)
        : [];

      const displayName = ingredientNames.length > 0
        ? ingredientNames.slice(0, 3).join(', ') + (ingredientNames.length > 3 ? ` +${ingredientNames.length - 3}` : '')
        : 'Meal';

      confidenceScore = avgConfidence;

      detectedFoods = {
        items: rawDetectedItems, // keep all for reference/debug
        category: category || 'lunch',
        source: 'ai',
        name: displayName,
        macros: {
          protein: Math.round(data.total_protein_g ?? 0),
          carbs: Math.round(data.total_carb_g ?? 0),
          fat: Math.round(data.total_fat_g ?? 0),
        },
      };
    }

    aiEstimationData = {
      modelVersion: 'YOLOv8',
      detectedItems: rawDetectedItems,
      processingTime,
      warning: !confidenceScore || confidenceScore < 0.6,
    };
  } catch (aiError) {
    console.log('AI Service unavailable:', aiError.message);
    if (aiError.response) {
      console.log('AI Service status:', aiError.response.status);
      console.log('AI Service error data:', aiError.response.data);
    }

    const isTimeout = aiError.code === 'ECONNABORTED' || aiError.message?.includes('timeout');
    const is404 = aiError.response?.status === 404;

    if (isTimeout) {
      throw new Error('AI analysis timed out. The service may be waking up — please try again in a moment.');
    } else if (is404) {
      throw new Error('AI service not found. Please check the service URL or contact support.');
    } else {
      throw new Error('AI analysis failed. Please try again shortly.');
    }
  }
  // ───────────────────────────────────────────────────────────────────────────

  if (!aiEstimationData || totalCalories === null) {
    throw new Error('AI could not analyze this image. Please try with a clearer photo of your meal.');
  }

  const foodLog = await foodLogsRepo.createFoodLog({
    patientId: patient.id,
    imageUrl,
    detectedFoods,
    totalCalories,
    confidenceScore,
    estimatedAt: new Date(),
  });

  await foodLogsRepo.createAIEstimation({
    foodLogId: foodLog.id,
    ...aiEstimationData,
  });

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

const getMyFoodLogsForWeek = async (userId, startDate, endDate) => {
  const patient = await foodLogsRepo.getPatientByUserId(userId);
  if (!patient) throw new Error('Patient profile not found');
  return await foodLogsRepo.getFoodLogsForWeek(patient.id, startDate, endDate);
};

module.exports = {
  getMyFoodLogs,
  getFoodLogById,
  getMyFoodLogsForWeek,
  uploadMealImage,
  deleteFoodLog,
  getDailyAiUsage,
  createFoodLog,
};