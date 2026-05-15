// backend/src/modules/patients/patients.repository.js
const prisma = require('../../config/db');

const getPatientsByNutritionist = async (nutritionistId) => {
  const appointments = await prisma.appointment.findMany({
    where: {
      nutritionistId,
      status: { in: ['CONFIRMED', 'COMPLETED'] },
    },
    select: { patientId: true },
    distinct: ['patientId'],
  });

  const patientIds = appointments.map(a => a.patientId);
  if (patientIds.length === 0) return [];

  return await prisma.patient.findMany({
    where: { id: { in: patientIds } },
    include: {
      user: { select: { id: true, fullName: true, email: true } }, 
      measurements: { orderBy: { recordedAt: 'desc' } },
    },
  });
};

const getPatientByIdForNutritionist = async (patientId, nutritionistId) => {
  const appointment = await prisma.appointment.findFirst({
    where: {
      patientId,
      nutritionistId,
      status: { in: ['CONFIRMED', 'COMPLETED'] },
    },
  });
  if (!appointment) return null;

  return await prisma.patient.findUnique({
    where: { id: patientId },
    include: {
      user: { select: { id: true, fullName: true, email: true } },
      measurements: { orderBy: { recordedAt: 'desc' } },
    },
  });
};

module.exports = {
  getPatientsByNutritionist,
  getPatientByIdForNutritionist,
};