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

const addMeal = async (req, res) => {
  try {
    const meal = await plansService.addMeal(req.user.id, parseInt(req.params.id), req.body);
    res.status(201).json({ success: true, message: 'Meal added successfully', meal });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateMeal = async (req, res) => {
  try {
    const meal = await plansService.updateMeal(
      req.user.id, parseInt(req.params.planId),
      parseInt(req.params.mealId), req.body
    );
    res.status(200).json({ success: true, message: 'Meal updated successfully', meal });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteMeal = async (req, res) => {
  try {
    await plansService.deleteMeal(
      req.user.id, parseInt(req.params.planId), parseInt(req.params.mealId)
    );
    res.status(200).json({ success: true, message: 'Meal deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
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