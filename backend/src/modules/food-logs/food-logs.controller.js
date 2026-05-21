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
    const { imageUrl, category } = req.body;
    const log = await foodLogsService.uploadMealImage(req.user.id, imageUrl, category);
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

const getMyFoodLogsForWeek = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'startDate and endDate are required' });
    }
    const logs = await foodLogsService.getMyFoodLogsForWeek(req.user.id, startDate, endDate);
    res.status(200).json({ success: true, logs });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = { getMyFoodLogs, getFoodLogById, getMyFoodLogsForWeek, uploadMealImage, deleteFoodLog, getDailyAiUsage, createFoodLog };
