// backend/src/modules/patients/patients.repository.js
const prisma = require('../../config/db');

// Get all patients that have at least one appointment with a given nutritionist
// (only appointments with status CONFIRMED or COMPLETED)
const getPatientsByNutritionist = async (nutritionistId) => {
  // Get distinct patient IDs from appointments
  const appointments = await prisma.appointment.findMany({
    where: {
      nutritionistId,
      status: { in: ['CONFIRMED', 'COMPLETED'] }
    },
    select: {
      patientId: true,
    },
    distinct: ['patientId'],
  });

  const patientIds = appointments.map(a => a.patientId);
  if (patientIds.length === 0) return [];

  // Fetch full patient profiles with user data
  return await prisma.patient.findMany({
    where: { id: { in: patientIds } },
    include: {
      user: { select: { id: true, fullName: true, email: true } },
      measurements: { orderBy: { recordedAt: 'desc' }, take: 1 }, // latest measurements
    },
  });
};

// Get a single patient by ID (only if they belong to the nutritionist)
const getPatientByIdForNutritionist = async (patientId, nutritionistId) => {
  // Check if this nutritionist has any confirmed/completed appointment with this patient
  const appointment = await prisma.appointment.findFirst({
    where: {
      patientId,
      nutritionistId,
      status: { in: ['CONFIRMED', 'COMPLETED'] }
    },
  });
  if (!appointment) return null;

  // Return patient with user and latest measurements
  return await prisma.patient.findUnique({
    where: { id: patientId },
    include: {
      user: { select: { id: true, fullName: true, email: true } },
      measurements: { orderBy: { recordedAt: 'desc' }, take: 1 },
    },
  });
};

module.exports = {
  getPatientsByNutritionist,
  getPatientByIdForNutritionist,
};