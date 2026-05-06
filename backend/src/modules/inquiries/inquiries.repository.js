const prisma = require('../../config/db');

const getPatientById = async (id) => {
  return await prisma.patient.findUnique({
    where: { id },
    include: {
      user: { select: { email: true } },
    },
  });
};


const getAllInquiries = async () => {
  return await prisma.inquiry.findMany({
    include: {
      patient: { include: { user: { select: { id: true, fullName: true, email: true } } } },
      admin: { include: { user: { select: { id: true, fullName: true } } } },
    },
    orderBy: { submittedAt: 'desc' },
  });
};

const getPatientInquiries = async (patientId) => {
  return await prisma.inquiry.findMany({
    where: { patientId },
    orderBy: { submittedAt: 'desc' },
  });
};

const getInquiryById = async (id) => {
  return await prisma.inquiry.findUnique({ where: { id } });
};

const createInquiry = async (data) => {
  return await prisma.inquiry.create({ data });
};

const replyToInquiry = async (id, adminId, reply) => {
  return await prisma.inquiry.update({
    where: { id },
    data: {
      reply,
      adminId,
      status: 'RESOLVED',
      repliedAt: new Date(),
    },
  });
};

const getPatientByUserId = async (userId) => {
  return await prisma.patient.findUnique({ where: { userId } });
};

const getAdminByUserId = async (userId) => {
  return await prisma.admin.findUnique({ where: { userId } });
};

module.exports = {
  getAllInquiries, getPatientInquiries, getInquiryById,
  createInquiry, replyToInquiry, getPatientByUserId, getAdminByUserId,getPatientById,
};