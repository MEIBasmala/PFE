const foodLogsRepo = require('./food-logs.repository');
const axios = require('axios');
const FormData = require('form-data');   // ← NEW: needed for multipart file upload
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
  const FREE_DAILY_SCANS = 2;

  const activeSub = await prisma.subscription.findFirst({
    where: {
      patientId: patient.id,
      status: 'ACTIVE',
      endDate: { gt: new Date() },
    },
    include: { package: true },
  });

  // Fallback to free tier if no subscription exists
  const dailyLimit = activeSub?.package?.aiScansPerDay ?? FREE_DAILY_SCANS;
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

  // ─── AI SERVICE CALL (REWRITTEN) ───────────────────────────────────────────
  try {
    const startTime = Date.now();

    // 1. Download the image from Cloudinary (or wherever imageUrl points)
    const imageResponse = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 10000,
    });
    const imageBuffer = Buffer.from(imageResponse.data);

    // 2. Build multipart form (file upload) — AI service expects raw bytes, not a URL
    const form = new FormData();
    form.append('file', imageBuffer, {
      filename: 'meal.jpg',
      contentType: imageResponse.headers['content-type'] || 'image/jpeg',
    });

    // 3. Send to AI service as multipart/form-data file upload
    const response = await axios.post(
      `${process.env.AI_SERVICE_URL}/predict`,
      form,
      {
        headers: form.getHeaders(),
        timeout: 30000,
      }
    );

    const processingTime = (Date.now() - startTime) / 1000;
    const data = response.data;

    // 4. Map AI response fields to backend format
    detectedFoods = data.items || null;
    totalCalories = data.total_calories || null;

    // AI returns per-item confidence — calculate average for the log
    confidenceScore =
      data.items && data.items.length > 0
        ? data.items.reduce((sum, item) => sum + (item.confidence || 0), 0) /
          data.items.length
        : null;

    aiEstimationData = {
      modelVersion: 'YOLOv8',
      detectedItems: detectedFoods,
      processingTime,
      warning: !confidenceScore || confidenceScore < 0.7,
    };
  } catch (aiError) {
    console.log('AI Service unavailable:', aiError.message);
    // Log extra details if the AI service responded with an error
    if (aiError.response) {
      console.log('AI Service status:', aiError.response.status);
      console.log('AI Service error data:', aiError.response.data);
    }
  }
  // ───────────────────────────────────────────────────────────────────────────

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