const prisma = require('../../config/db');
const { PAGINATION, SUBSCRIPTION_STATUS, PAYMENT_STATUS, ROLES } = require('./admin.config');

const getAllPatients = async (page = 1, limit = PAGINATION.DEFAULT_LIMIT) => {
  const skip = (page - 1) * limit;
  return await prisma.patient.findMany({
    skip,
    take: limit,
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          isActive: true,
          createdAt: true,
        },
      },
    },
    orderBy: PAGINATION.DEFAULT_ORDER_BY,
  });
};

const getAllNutritionists = async (page = 1, limit = PAGINATION.DEFAULT_LIMIT) => {
  const skip = (page - 1) * limit;
  return await prisma.nutritionist.findMany({
    skip,
    take: limit,
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          isActive: true,
          createdAt: true,
        },
      },
    },
    orderBy: PAGINATION.DEFAULT_ORDER_BY,
  });
};


const toggleUserStatus = async (userId, isActive) => {
  return await prisma.user.update({
    where: { id: userId },
    data: { isActive },
  });
};

const deleteUser = async (userId) => {
  return await prisma.user.delete({ where: { id: userId } });
};

const createNutritionist = async ({
  fullName,
  email,
  password,
  specialization,
  bio,
  mustChangePassword,
}) => {
  const user = await prisma.user.create({
    data: {
      fullName,
      email,
      password,
      role: ROLES.NUTRITIONIST,
      mustChangePassword: mustChangePassword ?? false,
    },
  });

  const nutritionist = await prisma.nutritionist.create({
    data: {
      userId: user.id,
      specialization: specialization || null,
      bio: bio || null,
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          isActive: true,
          createdAt: true,
        },
      },
    },
  });

  return nutritionist;
};

const getStatistics = async () => {
  const [patients, nutritionists, subscriptions, payments] = await Promise.all([
    prisma.patient.count(),
    prisma.nutritionist.count(),
    prisma.subscription.count({ where: { status: SUBSCRIPTION_STATUS.ACTIVE } }),
    prisma.payment.aggregate({
      where: { status: PAYMENT_STATUS.SUCCESS },
      _sum: { amount: true },
    }),
  ]);
  return {
    totalPatients: patients,
    totalNutritionists: nutritionists,
    activeSubscriptions: subscriptions,
    totalRevenue: payments._sum.amount || 0,
  };
};

const getAuditLogs = async () => {
  return await prisma.auditLog.findMany({
    include: { admin: { include: { user: { select: { fullName: true } } } } },
    orderBy: { performedAt: 'desc' },
    take: PAGINATION.DEFAULT_LIMIT,
  });
};

const createAuditLog = async (adminId, action, targetType, targetId) => {
  return await prisma.auditLog.create({
    data: { adminId, action, targetType, targetId },
  });
};

const getAdminByUserId = async (userId) => {
  return await prisma.admin.findUnique({ where: { userId } });
};

const getPatientById = async (id) => {
  return await prisma.patient.findUnique({
    where: { id },
    include: { user: true },
  });
};

const getNutritionistById = async (id) => {
  return await prisma.nutritionist.findUnique({
    where: { id },
    include: { user: true },
  });
};

const getAllPayments = async (page = 1, limit = PAGINATION.DEFAULT_LIMIT) => {
  const skip = (page - 1) * limit;
  return await prisma.payment.findMany({
    skip,
    take: limit,
    include: {
      subscription: {
        include: {
          patient: {
            include: {
              user: { select: { id: true, fullName: true, email: true } },
            },
          },
          package: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

const getAllSubscriptions = async (page = 1, limit = PAGINATION.DEFAULT_LIMIT) => {
  const skip = (page - 1) * limit;
  return await prisma.subscription.findMany({
    skip,
    take: limit,
    include: {
      patient: {
        include: {
          user: { select: { id: true, fullName: true, email: true } },
        },
      },
      package: true,
    },
    orderBy: { createdAt: 'desc' },
  });
};

// Helper counts
const getAllPatientsCount = async () => await prisma.patient.count();
const getAllNutritionistsCount = async () => await prisma.nutritionist.count();
const getActiveSubscriptionsCount = async () =>
  await prisma.subscription.count({ where: { status: SUBSCRIPTION_STATUS.ACTIVE } });
const getAllPaymentsCount = async () => await prisma.payment.count();
const getAllSubscriptionsCount = async () => await prisma.subscription.count();


const getTotalRevenue = async () => {
  const result = await prisma.payment.aggregate({
    where: { status: PAYMENT_STATUS.SUCCESS },
    _sum: { amount: true },
  });
  return result._sum.amount || 0;
};
const getTotalRevenueForPeriod = async (startDate, endDate) => {
  const result = await prisma.payment.aggregate({
    where: {
      status: PAYMENT_STATUS.SUCCESS,
      createdAt: { gte: startDate, lt: endDate },
    },
    _sum: { amount: true },
  });
  return result._sum.amount || 0;
};
const getNewUsersCount = async (startDate, endDate) => {
  return await prisma.user.count({
    where: { createdAt: { gte: startDate, lt: endDate } },
  });
};
const getActiveUsersSince = async (sinceDate) => {
  return await prisma.user.count({
    where: { isActive: true, createdAt: { gte: sinceDate } },
  });
};
const getActiveSubscriptionsByPackage = async () => {
  const groups = await prisma.subscription.groupBy({
    by: ['packageId'],
    where: { status: SUBSCRIPTION_STATUS.ACTIVE },
    _count: { id: true },
  });
  const packageIds = groups.map((g) => g.packageId);
  const packages = await prisma.package.findMany({
    where: { id: { in: packageIds } },
    select: { id: true, name: true },
  });
  const packageMap = Object.fromEntries(packages.map((p) => [p.id, p.name]));
  return groups.map((g) => ({
    label: packageMap[g.packageId] || 'Unknown',
    count: g._count.id,
  }));
};
const getRecentPayments = async (limit = PAGINATION.RECENT_PAYMENTS_LIMIT) => {
  return await prisma.payment.findMany({
    where: { status: PAYMENT_STATUS.SUCCESS },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      subscription: {
        include: {
          patient: { include: { user: { select: { fullName: true } } } },
          package: true,
        },
      },
    },
  });
};

// BLOG MANAGEMENT
const getAllBlogArticles = async (page = 1, limit = PAGINATION.DEFAULT_LIMIT) => {
  const skip = (page - 1) * limit;
  return await prisma.blogArticle.findMany({
    skip,
    take: limit,
    include: {
      admin: { include: { user: { select: { id: true, fullName: true } } } },
      comments: {
        include: {
          patient: {
            include: { user: { select: { id: true, fullName: true } } },
          },
        },
      },
    },
    orderBy: PAGINATION.DEFAULT_ORDER_BY,
  });
};

const getBlogArticleById = async (id) => {
  return await prisma.blogArticle.findUnique({
    where: { id },
    include: {
      admin: { include: { user: { select: { id: true, fullName: true } } } },
      comments: true,
    },
  });
};

const createBlogArticle = async (data) => {
  return await prisma.blogArticle.create({ data });
};

const updateBlogArticle = async (id, data) => {
  return await prisma.blogArticle.update({ where: { id }, data });
};

const deleteBlogArticle = async (id) => {
  return await prisma.blogArticle.delete({ where: { id } });
};

module.exports = {
  getAllPatients,
  getAllNutritionists,
  toggleUserStatus,
  deleteUser,
  createNutritionist,
  getStatistics,
  getAuditLogs,
  createAuditLog,
  getAdminByUserId,
  getPatientById,
  getNutritionistById,
  getAllPayments,
  getAllSubscriptions,
  getAllPatientsCount,
  getAllNutritionistsCount,
  getActiveSubscriptionsCount,
  getAllPaymentsCount,
  getAllSubscriptionsCount,
  getTotalRevenue,
  getTotalRevenueForPeriod,
  getNewUsersCount,
  getActiveUsersSince,
  getActiveSubscriptionsByPackage,
  getRecentPayments,
  getAllBlogArticles,
  getBlogArticleById,
  createBlogArticle,
  updateBlogArticle,
  deleteBlogArticle,
};