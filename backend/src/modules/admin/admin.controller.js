const adminService = require('./admin.service');
const {
  CSV_EXPORT,
} = require('./admin.config');

const getAllPatients = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 50));
    const { patients, total } = await adminService.getAllPatients(page, limit);
    res.status(200).json({ 
      success: true, 
      patients,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getAllNutritionists = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 50));
    const { nutritionists, total } = await adminService.getAllNutritionists(page, limit);
    res.status(200).json({ 
      success: true, 
      nutritionists,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const togglePatientStatus = async (req, res) => {
  try {
    const result = await adminService.togglePatientStatus(req.user.id, parseInt(req.params.id));
    res.status(200).json({ success: true, message: 'Client status updated', result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deletePatient = async (req, res) => {
  try {
    await adminService.deletePatient(req.user.id, parseInt(req.params.id));
    res.status(200).json({ success: true, message: 'Client deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const createNutritionist = async (req, res) => {
  try {
    const { nutritionist, tempPassword } = await adminService.createNutritionist(req.user.id, req.body);
    res.status(201).json({
      success: true,
      message: 'Nutritionist created successfully. Save this password — it will not be shown again.',
      nutritionist,
      tempPassword, // Still exposed, but admin UI handles it once
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const toggleNutritionistStatus = async (req, res) => {
  try {
    const result = await adminService.toggleNutritionistStatus(req.user.id, parseInt(req.params.id));
    res.status(200).json({ success: true, message: 'Nutritionist status updated', result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteNutritionist = async (req, res) => {
  try {
    await adminService.deleteNutritionist(req.user.id, parseInt(req.params.id));
    res.status(200).json({ success: true, message: 'Nutritionist deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getStatistics = async (req, res) => {
  try {
    const stats = await adminService.getStatistics();
    res.status(200).json({ success: true, stats });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getAuditLogs = async (req, res) => {
  try {
    const logs = await adminService.getAuditLogs();
    res.status(200).json({ success: true, logs });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getAllSubscriptions = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 50));
    const { subscriptions, total } = await adminService.getAllSubscriptions(page, limit);
    res.status(200).json({ 
      success: true, 
      subscriptions,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getAllPayments = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 50));
    const { payments, total } = await adminService.getAllPayments(page, limit);
    res.status(200).json({ 
      success: true, 
      payments,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const exportPaymentsCSV = async (req, res) => {
  try {
    const { payments } = await adminService.getAllPayments(1, 10000); // FIX: destructure + high limit
    const csvRows = [
      CSV_EXPORT.HEADERS,
      ...payments.map((p) => [
        new Date(p.createdAt).toLocaleDateString(),
        p.userFullName,
        p.planName,
        p.amount,
        CSV_EXPORT.STATUS_MAP[p.status] || p.status,
      ]),
    ];
    const csvContent = csvRows.map((row) => row.join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${CSV_EXPORT.FILENAME}`);
    res.status(200).send(csvContent);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getAnalytics = async (req, res) => {
  try {
    const { period } = req.query;
    const analytics = await adminService.getAnalytics(period);
    res.status(200).json(analytics);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ======================== BLOG MANAGEMENT ========================
const getAdminBlogPosts = async (req, res) => {
  try {
    const posts = await adminService.getAdminBlogPosts();
    res.status(200).json({ success: true, posts });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const createAdminBlogPost = async (req, res) => {
  try {
    const post = await adminService.createAdminBlogPost(req.user.id, req.body);
    res.status(201).json({ success: true, post });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateAdminBlogPost = async (req, res) => {
  try {
    const post = await adminService.updateAdminBlogPost(req.user.id, parseInt(req.params.id), req.body);
    res.status(200).json({ success: true, post });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteAdminBlogPost = async (req, res) => {
  try {
    await adminService.deleteAdminBlogPost(req.user.id, parseInt(req.params.id));
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllPatients,
  getAllNutritionists,
  togglePatientStatus,
  deletePatient,
  createNutritionist,
  toggleNutritionistStatus,
  deleteNutritionist,
  getStatistics,
  getAuditLogs,
  getAllSubscriptions,
  getAllPayments,
  exportPaymentsCSV,
  getAnalytics,
  getAdminBlogPosts,
  createAdminBlogPost,
  updateAdminBlogPost,
  deleteAdminBlogPost,
};