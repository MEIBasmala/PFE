const prisma = require('../../config/db');

// Get all available (free) slots with nutritionist info
const getAllSlots = async () => {
  return await prisma.availableSlot.findMany({
    where: {
      isBooked: false,
      nutritionist: {
        user: {
          isActive: true,
        },
      },
    },
    include: {
      nutritionist: {
        include: {
          user: { select: { id: true, fullName: true, email: true, isActive: true } },
        },
      },
    },
    orderBy: { date: 'asc' },
  });
};

// Get all slots of a nutritionist (for management, including booked)
const getNutritionistSlots = async (nutritionistId) => {
  return await prisma.availableSlot.findMany({
    where: { nutritionistId },
    orderBy: { date: 'asc' },
  });
};

// Get single slot by ID
const getSlotById = async (id) => {
  return await prisma.availableSlot.findUnique({
    where: { id },
    include: { nutritionist: true },
  });
};

// Create a slot
const createSlot = async (data) => {
  return await prisma.availableSlot.create({ data });
};

// Delete a slot
const deleteSlot = async (id) => {
  return await prisma.availableSlot.delete({ where: { id } });
};

// Update the booked status of a slot (used internally or by sync)
const updateSlotBookedStatus = async (slotId, isBooked) => {
  return await prisma.availableSlot.update({
    where: { id: slotId },
    data: { isBooked },
  });
};

// Get nutritionist profile from user ID
const getNutritionistByUserId = async (userId) => {
  return await prisma.nutritionist.findUnique({ where: { userId } });
};

// Get free slots for a specific nutritionist on a specific date
const getSlotsByNutritionistAndDate = async (nutritionistId, date) => {
  const targetDate = new Date(date);
  const nextDay = new Date(targetDate);
  nextDay.setDate(targetDate.getDate() + 1);
  return await prisma.availableSlot.findMany({
    where: {
      nutritionistId,
      date: { gte: targetDate, lt: nextDay },
      isBooked: false,
      nutritionist: {
        user: {
          isActive: true,
        },
      },
    },
    orderBy: { startTime: 'asc' },
  });
};

// Check for overlapping slots for a nutritionist on a given date
const findOverlappingSlots = async (nutritionistId, date, startTime, endTime) => {
  return await prisma.availableSlot.findMany({
    where: {
      nutritionistId,
      date,
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    },
  });
};

// Check if a slot has any appointment (for extra safety before deletion)
const getAppointmentBySlotId = async (slotId) => {
  return await prisma.appointment.findFirst({
    where: { slotId },
  });
};

module.exports = {
  getAllSlots,
  getNutritionistSlots,
  getSlotById,
  createSlot,
  deleteSlot,
  updateSlotBookedStatus,     
  getNutritionistByUserId,
  getSlotsByNutritionistAndDate,
  findOverlappingSlots,
  getAppointmentBySlotId,
};