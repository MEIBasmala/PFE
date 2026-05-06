const foodLogsService = require('./food-logs.service');

// food-logs.controller.js
const getMyFoodLogs = async (req, res) => {
  try {
    const logs = await foodLogsService.getMyFoodLogs(
      req.user.id,
      req.query.date
    );
    res.status(200).json(logs);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getFoodLogById = async (req, res) => {
  try {
    const log = await foodLogsService.getFoodLogById(req.user.id, parseInt(req.params.id));
    res.status(200).json({ success: true, log });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const uploadMealImage = async (req, res) => {
  try {
    const { imageUrl } = req.body;
    const log = await foodLogsService.uploadMealImage(req.user.id, imageUrl);
    res.status(201).json({ success: true, message: 'Meal image uploaded successfully', log });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteFoodLog = async (req, res) => {
  try {
    await foodLogsService.deleteFoodLog(req.user.id, parseInt(req.params.id));
    res.status(200).json({ success: true, message: 'Food log deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getDailyAiUsage = async (req, res) => {
  try {
    const usage = await foodLogsService.getDailyAiUsage(req.user.id);
    res.status(200).json(usage);   // { aiScansUsedToday: number }
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const createFoodLog = async (req, res) => {
  try {
    const log = await foodLogsService.createFoodLog(req.user.id, req.body);
    res.status(201).json(log);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Also export it
module.exports = { getMyFoodLogs, getFoodLogById, uploadMealImage, deleteFoodLog, getDailyAiUsage , createFoodLog};
