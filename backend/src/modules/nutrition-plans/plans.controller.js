const plansService = require('./plans.service');

const getMyPlans = async (req, res) => {
  try {
    const plans = await plansService.getMyPlans(req.user.id, req.user.role);
    res.status(200).json({ success: true, plans });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getPlanById = async (req, res) => {
  try {
    const plan = await plansService.getPlanById(parseInt(req.params.id));
    res.status(200).json({ success: true, plan });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const createPlan = async (req, res) => {
  try {
    const plan = await plansService.createPlan(req.user.id, req.body);
    res.status(201).json({ success: true, message: 'Plan created successfully', plan });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updatePlan = async (req, res) => {
  try {
    const plan = await plansService.updatePlan(req.user.id, parseInt(req.params.id), req.body);
    res.status(200).json({ success: true, message: 'Plan updated successfully', plan });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deletePlan = async (req, res) => {
  try {
    await plansService.deletePlan(req.user.id, parseInt(req.params.id));
    res.status(200).json({ success: true, message: 'Plan deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Recipe-based meal endpoints removed — nutritionists now use PDF plans only
// Keeping stubs that return 410 Gone for backward compatibility
const addMeal = async (req, res) => {
  res.status(410).json({ 
    success: false, 
    message: 'Recipe-based meal planning is no longer supported. Please use PDF plans instead.' 
  });
};

const updateMeal = async (req, res) => {
  res.status(410).json({ 
    success: false, 
    message: 'Recipe-based meal planning is no longer supported. Please use PDF plans instead.' 
  });
};

const deleteMeal = async (req, res) => {
  res.status(410).json({ 
    success: false, 
    message: 'Recipe-based meal planning is no longer supported. Please use PDF plans instead.' 
  });
};

const getPrebuiltPlans = async (req, res) => {
  try {
    const plans = await plansService.getPrebuiltPlans();
    res.status(200).json({ success: true, plans });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const uploadPdfPlan = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No PDF file uploaded' });
    }
    const { patientId, title, notes } = req.body;
    if (!patientId) {
      return res.status(400).json({ success: false, message: 'Patient ID is required' });
    }

    const plan = await plansService.createPdfPlan(
      req.user.id,
      req.file,
      parseInt(patientId),
      title,
      notes
    );
    res.status(201).json({ success: true, plan });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getMyPdfPlans = async (req, res) => {
  try {
    const plans = await plansService.getMyPdfPlans(req.user.id);
    res.json({ success: true, plans });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  getMyPlans, getPlanById, createPlan, updatePlan,
  deletePlan, addMeal, updateMeal, deleteMeal, getPrebuiltPlans,
  uploadPdfPlan, getMyPdfPlans
};