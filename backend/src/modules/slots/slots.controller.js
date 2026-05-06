const slotsService = require('./slots.service');

//  Get All Available Slots 
const getAllSlots = async (req, res) => {
  try {
    const { nutritionistId, date } = req.query;
    let slots;
    if (nutritionistId && date) {
      slots = await slotsService.getSlotsByNutritionistAndDate(parseInt(nutritionistId), date);
    } else {
      slots = await slotsService.getAllSlots();
    }

    const transformed = slots.map(s => ({
      id: s.id,
      nutritionistId: s.nutritionistId,
      date: s.date.toISOString().split('T')[0], // YYYY-MM-DD
      startTime: s.startTime,
      endTime: s.endTime,
      isBooked: s.isBooked,
    }));
    res.status(200).json(transformed);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

//  Get My Slots (Nutritionist) 
const getMySlots = async (req, res) => {
  try {
    const slots = await slotsService.getMySlots(req.user.id);
    res.status(200).json({ success: true, slots });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

//  Create Slot 
const createSlot = async (req, res) => {
  try {
    const slot = await slotsService.createSlot(req.user.id, req.body);
    res.status(201).json({
      success: true,
      message: 'Slot created successfully',
      slot,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

//  Delete Slot 
const deleteSlot = async (req, res) => {
  try {
    await slotsService.deleteSlot(req.user.id, parseInt(req.params.id));
    res.status(200).json({
      success: true,
      message: 'Slot deleted successfully',
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllSlots,
  getMySlots,
  createSlot,
  deleteSlot,
};