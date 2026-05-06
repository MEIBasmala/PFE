const prisma = require('../../config/db');

// Get appointments for a patient (with nutritionist and slot)
const getPatientAppointments = async (patientId) => {
  return await prisma.appointment.findMany({
    where: { patientId },
    include: {
      nutritionist: { include: { user: { select: { id: true, fullName: true, email: true } } } },
      slot: true,
    },
    orderBy: { createdAt: 'desc' },
  });
};

// Get appointments for a nutritionist (with patient and slot)
const getNutritionistAppointments = async (nutritionistId) => {
  return await prisma.appointment.findMany({
    where: { nutritionistId },
    include: {
      patient: { include: { user: { select: { id: true, fullName: true, email: true } } } },
      slot: true,
    },
    orderBy: { createdAt: 'desc' },
  });
};

// Get a single appointment by ID (includes patient, nutritionist, slot)
const getAppointmentById = async (id) => {
  return await prisma.appointment.findUnique({
    where: { id },
    include: {
      patient: { include: { user: true } },
      nutritionist: { include: { user: true } },
      slot: true,
    },
  });
};

// Create a new appointment (transaction will be used in service)
const createAppointment = async (data) => {
  return await prisma.appointment.create({
    data,
    include: {
      nutritionist: { include: { user: { select: { id: true, fullName: true, email: true } } } },
      slot: true,
    },
  });
};

// Update appointment status (used for confirm, cancel, complete)
const updateAppointmentStatus = async (id, data) => {
  return await prisma.appointment.update({
    where: { id },
    data,
    include: { slot: true },
  });
};

// Mark a slot as booked or free
const markSlotBooked = async (slotId, isBooked) => {
  return await prisma.availableSlot.update({
    where: { id: slotId },
    data: { isBooked },
  });
};

// Get Patient profile from user ID
const getPatientByUserId = async (userId) => {
  return await prisma.patient.findUnique({ where: { userId } });
};

// Get Nutritionist profile from user ID
const getNutritionistByUserId = async (userId) => {
  return await prisma.nutritionist.findUnique({ where: { userId } });
};

// Get slot by ID (without locking – used only for checks outside transaction)
const getSlotById = async (id) => {
  const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
  if (isNaN(numericId)) throw new Error('Invalid slot ID');
  return await prisma.availableSlot.findUnique({ where: { id: numericId } });
};

module.exports = {
  getPatientAppointments,
  getNutritionistAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointmentStatus,
  markSlotBooked,
  getPatientByUserId,
  getNutritionistByUserId,
  getSlotById,
};