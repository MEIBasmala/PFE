const adminRepo = require('./admin.repository');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const {
  CURRENCY,
  PAGINATION,
  ANALYTICS_PERIODS,
  DEFAULT_ANALYTICS_PERIOD,
  AUDIT_ACTIONS,
  TARGET_TYPES,
  BLOG_STATUS,
  SUBSCRIPTION_STATUS,
  PAYMENT_STATUS,
  USER_STATUS,
  NUTRITIONIST_DEFAULTS,
  PASSWORD,
} = require('./admin.config');

const getAllPatients = async () => await adminRepo.getAllPatients();
const getAllNutritionists = async () => await adminRepo.getAllNutritionists();

const getStatistics = async () => {
  const stats = await adminRepo.getStatistics();
  stats.totalRevenue = Math.round((stats.totalRevenue * CURRENCY.USD_RATE) / 100);
  return stats;
};

const getAuditLogs = async () => await adminRepo.getAuditLogs();

const togglePatientStatus = async (userId, patientId) => {
  const admin = await adminRepo.getAdminByUserId(userId);
  if (!admin) throw new Error('Admin profile not found');

  const patient = await adminRepo.getPatientById(patientId);
  if (!patient) throw new Error('Patient not found');

  const newStatus = !patient.user.isActive;
  const result = await adminRepo.toggleUserStatus(patient.user.id, newStatus);
  await adminRepo.createAuditLog(
    admin.id,
    newStatus ? AUDIT_ACTIONS.ACTIVATE_PATIENT : AUDIT_ACTIONS.DEACTIVATE_PATIENT,
    TARGET_TYPES.PATIENT,
    patientId
  );
  return result;
};

const deletePatient = async (userId, patientId) => {
  const admin = await adminRepo.getAdminByUserId(userId);
  if (!admin) throw new Error('Admin profile not found');

  const patient = await adminRepo.getPatientById(patientId);
  if (!patient) throw new Error('Patient not found');

  await adminRepo.deleteUser(patient.user.id);
  await adminRepo.createAuditLog(
    admin.id,
    AUDIT_ACTIONS.DELETE_PATIENT,
    TARGET_TYPES.PATIENT,
    patientId
  );
};

const createNutritionist = async (userId, data) => {
  const admin = await adminRepo.getAdminByUserId(userId);
  if (!admin) throw new Error('Admin profile not found');

  const tempPassword = crypto.randomBytes(PASSWORD.TEMP_BYTES).toString('hex');
  const hashed = await bcrypt.hash(tempPassword, PASSWORD.SALT_ROUNDS);

  const nutritionist = await adminRepo.createNutritionist({
    ...data,
    password: hashed,
    mustChangePassword: NUTRITIONIST_DEFAULTS.MUST_CHANGE_PASSWORD,
  });

  await adminRepo.createAuditLog(
    admin.id,
    AUDIT_ACTIONS.CREATE_NUTRITIONIST,
    TARGET_TYPES.NUTRITIONIST,
    nutritionist.id
  );

  return { nutritionist, tempPassword };
};

const toggleNutritionistStatus = async (userId, nutritionistId) => {
  const admin = await adminRepo.getAdminByUserId(userId);
  if (!admin) throw new Error('Admin profile not found');

  const nutritionist = await adminRepo.getNutritionistById(nutritionistId);
  if (!nutritionist) throw new Error('Nutritionist not found');

  const newStatus = !nutritionist.user.isActive;
  const result = await adminRepo.toggleUserStatus(nutritionist.user.id, newStatus);
  await adminRepo.createAuditLog(
    admin.id,
    newStatus ? AUDIT_ACTIONS.ACTIVATE_NUTRITIONIST : AUDIT_ACTIONS.DEACTIVATE_NUTRITIONIST,
    TARGET_TYPES.NUTRITIONIST,
    nutritionistId
  );
  return result;
};

const deleteNutritionist = async (userId, nutritionistId) => {
  const admin = await adminRepo.getAdminByUserId(userId);
  if (!admin) throw new Error('Admin profile not found');

  const nutritionist = await adminRepo.getNutritionistById(nutritionistId);
  if (!nutritionist) throw new Error('Nutritionist not found');

  await adminRepo.deleteUser(nutritionist.user.id);
  await adminRepo.createAuditLog(
    admin.id,
    AUDIT_ACTIONS.DELETE_NUTRITIONIST,
    TARGET_TYPES.NUTRITIONIST,
    nutritionistId
  );
};

const getAllSubscriptions = async () => {
  const subs = await adminRepo.getAllSubscriptions();
  return subs.map((sub) => ({
    id: sub.id,
    user: {
      fullName: sub.patient.user.fullName,
      email: sub.patient.user.email,
    },
    package: sub.package,
    startDate: sub.startDate,
    endDate: sub.endDate,
    status: sub.status,
    amount: sub.package.isSeasonal ? sub.package.price : sub.package.priceMonthly,
  }));
};

const getAllPayments = async () => {
  const payments = await adminRepo.getAllPayments();
  return payments.map((p) => ({
    id: p.id,
    subscriptionId: p.subscriptionId,
    amount: (p.amount * CURRENCY.USD_RATE) / 100,
    status: p.status,
    createdAt: p.createdAt,
    userFullName: p.subscription?.patient?.user.fullName || 'Unknown',
    planName: p.subscription?.package?.name || '-',
  }));
};

const getAnalytics = async (period) => {
  const selectedPeriod = ANALYTICS_PERIODS[period] || ANALYTICS_PERIODS[DEFAULT_ANALYTICS_PERIOD];
  const now = new Date();
  const start = new Date();
  const prevStart = new Date();

  if (period === '12m') {
    start.setFullYear(now.getFullYear() - 1);
    prevStart.setFullYear(now.getFullYear() - 2);
  } else {
    start.setDate(now.getDate() - selectedPeriod.days);
    prevStart.setDate(now.getDate() - selectedPeriod.days * 2);
  }

  const [
    totalPatients,
    totalNutritionists,
    activeSubscriptionsRaw,
    totalRevenueRaw,
    newUsersThisPeriod,
    newUsersPrevPeriod,
    activeUsers,
    subscriptionCounts,
    recentPaymentsRaw,
    revenuePrevPeriod,
    revenueCurrentPeriod,
  ] = await Promise.all([
    adminRepo.getAllPatientsCount(),
    adminRepo.getAllNutritionistsCount(),
    adminRepo.getActiveSubscriptionsCount(),
    adminRepo.getTotalRevenue(),
    adminRepo.getNewUsersCount(start, new Date()),
    adminRepo.getNewUsersCount(prevStart, start),
    adminRepo.getActiveUsersSince(start),
    adminRepo.getActiveSubscriptionsByPackage(),
    adminRepo.getRecentPayments(PAGINATION.RECENT_PAYMENTS_LIMIT),
    adminRepo.getTotalRevenueForPeriod(prevStart, start),
    adminRepo.getTotalRevenueForPeriod(start, new Date()),
  ]);

  const totalUsers = totalPatients + totalNutritionists;
  const premiumSubsCount = subscriptionCounts.find((s) => s.label === 'Premium')?.count || 0;
  const premiumConversion = totalUsers ? Math.round((premiumSubsCount / totalUsers) * 100) : 0;

  const revenueChangePercent =
    revenuePrevPeriod > 0
      ? Math.round(((revenueCurrentPeriod - revenuePrevPeriod) / revenuePrevPeriod) * 100)
      : revenueCurrentPeriod > 0
      ? 100
      : 0;

  const userGrowthPercent = newUsersPrevPeriod
    ? Math.round(((newUsersThisPeriod - newUsersPrevPeriod) / newUsersPrevPeriod) * 100)
    : 0;

  const periodDays = period === '12m' ? 365 : selectedPeriod.days;
  const avgDailyRevenue = periodDays ? Math.round(totalRevenueRaw / periodDays) : 0;

  const totalActiveSubs = subscriptionCounts.reduce((sum, s) => sum + s.count, 0);
  const subscriptionDistribution = subscriptionCounts.map((s) => ({
    label: s.label,
    count: s.count,
    pct: totalActiveSubs ? Math.round((s.count / totalActiveSubs) * 100) : 0,
  }));

  const recentTransactions = recentPaymentsRaw.map((p) => ({
    date: p.createdAt.toISOString().split('T')[0],
    user: p.subscription?.patient?.user.fullName || 'Unknown',
    plan: p.subscription?.package?.name || '-',
    amount: `${CURRENCY.CODE} ${Math.round((p.amount * CURRENCY.USD_RATE) / 100).toLocaleString()}`,
    status:
      p.status === PAYMENT_STATUS.SUCCESS
        ? 'Completed'
        : p.status === PAYMENT_STATUS.FAILED
        ? 'Failed'
        : 'Pending',
  }));

  return {
    totalUsers,
    activeUsers,
    monthlyRevenue: Math.round((totalRevenueRaw * CURRENCY.USD_RATE) / 100),
    premiumConversion,
    revenueOverview: {
      value: Math.round((totalRevenueRaw * CURRENCY.USD_RATE) / 100),
      avgPerDay: Math.round((avgDailyRevenue * CURRENCY.USD_RATE) / 100),
      changePercent: revenueChangePercent,
    },
    userGrowth: {
      total: totalUsers,
      newThisMonth: newUsersThisPeriod,
      growthPercent: userGrowthPercent,
    },
    subscriptionDistribution,
    recentTransactions,
  };
};

// ======================== BLOG MANAGEMENT ========================
const getAdminBlogPosts = async () => {
  return await adminRepo.getAllBlogArticles();
};

const createAdminBlogPost = async (adminUserId, data) => {
  const admin = await adminRepo.getAdminByUserId(adminUserId);
  if (!admin) throw new Error('Admin profile not found');

  return await adminRepo.createBlogArticle({
    adminId: admin.id,
    title: data.title,
    content: data.content,
    category: data.category || null,
    coverImage: data.coverImage || null,
    status: data.status === BLOG_STATUS.PUBLISHED ? BLOG_STATUS.PUBLISHED : BLOG_STATUS.DRAFT,
    publishedAt: data.status === BLOG_STATUS.PUBLISHED ? new Date() : null,
  });
};

const updateAdminBlogPost = async (adminUserId, articleId, data) => {
  const admin = await adminRepo.getAdminByUserId(adminUserId);
  if (!admin) throw new Error('Admin profile not found');

  const existing = await adminRepo.getBlogArticleById(articleId);
  if (!existing) throw new Error('Article not found');
  if (existing.adminId !== admin.id) throw new Error('Unauthorized');

  const updateData = {
    title: data.title,
    content: data.content,
    category: data.category || null,
    coverImage: data.coverImage || null,
    status: data.status,
  };
  if (data.status === BLOG_STATUS.PUBLISHED && existing.status !== BLOG_STATUS.PUBLISHED) {
    updateData.publishedAt = new Date();
  }
  return await adminRepo.updateBlogArticle(articleId, updateData);
};

const deleteAdminBlogPost = async (adminUserId, articleId) => {
  const admin = await adminRepo.getAdminByUserId(adminUserId);
  if (!admin) throw new Error('Admin profile not found');

  const existing = await adminRepo.getBlogArticleById(articleId);
  if (!existing) throw new Error('Article not found');
  if (existing.adminId !== admin.id) throw new Error('Unauthorized');

  await adminRepo.deleteBlogArticle(articleId);
};

module.exports = {
  getAllPatients,
  getAllNutritionists,
  getStatistics,
  getAuditLogs,
  togglePatientStatus,
  deletePatient,
  createNutritionist,
  toggleNutritionistStatus,
  deleteNutritionist,
  getAllSubscriptions,
  getAllPayments,
  getAnalytics,
  getAdminBlogPosts,
  createAdminBlogPost,
  updateAdminBlogPost,
  deleteAdminBlogPost,
};