const slotsRepo = require('./slots.repository');

// Get all free slots (public)
const getAllSlots = async () => {
  return await slotsRepo.getAllSlots();
};

// Get slots of the logged‑in nutritionist
const getMySlots = async (userId) => {
  const nutritionist = await slotsRepo.getNutritionistByUserId(userId);
  if (!nutritionist) throw new Error('Nutritionist profile not found');
  return await slotsRepo.getNutritionistSlots(nutritionist.id);
};

// Create a slot with validation
const createSlot = async (userId, { date, startTime, endTime }) => {
  const nutritionist = await slotsRepo.getNutritionistByUserId(userId);
  if (!nutritionist) throw new Error('Nutritionist profile not found');

  const slotDate = new Date(date);
  slotDate.setUTCHours(0, 0, 0, 0);

  // Past date check
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (slotDate < today) throw new Error('Cannot create slots in the past');

  // Duration check (30–60 minutes)
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  const duration = (endHour * 60 + endMin) - (startHour * 60 + startMin);
  if (duration < 30) throw new Error('Slot must be at least 30 minutes');
  if (duration > 60) throw new Error('Slot cannot exceed 60 minutes');

  // Overlap check
  const overlapping = await slotsRepo.findOverlappingSlots(
    nutritionist.id,
    slotDate,
    startTime,
    endTime
  );
  if (overlapping.length > 0) {
    throw new Error('You already have a slot that overlaps this time range');
  }

  return await slotsRepo.createSlot({
    nutritionistId: nutritionist.id,
    date: slotDate,
    startTime,
    endTime,
    isBooked: false,
  });
};

// Delete a slot – extra safety checks
const deleteSlot = async (userId, slotId) => {
  const nutritionist = await slotsRepo.getNutritionistByUserId(userId);
  if (!nutritionist) throw new Error('Nutritionist profile not found');

  const slot = await slotsRepo.getSlotById(slotId);
  if (!slot) throw new Error('Slot not found');
  if (slot.nutritionistId !== nutritionist.id) throw new Error('Unauthorized');

  // 1. Cannot delete if already booked
  if (slot.isBooked) throw new Error('Cannot delete a slot that has already been booked');

  // 2. Extra safety: check if an appointment exists (in case isBooked is out of sync)
  const existingAppointment = await slotsRepo.getAppointmentBySlotId(slotId);
  if (existingAppointment) {
    // Sync the flag and then throw a clear error
    await slotsRepo.updateSlotBookedStatus(slotId, true);
    throw new Error('Cannot delete a slot that is already linked to an appointment');
  }

  return await slotsRepo.deleteSlot(slotId);
};

// Helper to get free slots for a specific nutritionist on a given date
const getSlotsByNutritionistAndDate = async (nutritionistId, date) => {
  return await slotsRepo.getSlotsByNutritionistAndDate(nutritionistId, date);
};

module.exports = {
  getAllSlots,
  getMySlots,
  createSlot,
  deleteSlot,
  getSlotsByNutritionistAndDate,
};