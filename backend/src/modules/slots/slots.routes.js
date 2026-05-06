const express = require('express');
const router = express.Router();
const slotsController = require('./slots.controller');
const { validateCreateSlot } = require('./slots.validation');
const { protect, authorize } = require('../../middleware/auth');

router.get('/',         protect,                                          slotsController.getAllSlots);
router.get('/my',       protect, authorize('NUTRITIONIST'),               slotsController.getMySlots);
router.post('/',        protect, authorize('NUTRITIONIST'), validateCreateSlot, slotsController.createSlot);
router.delete('/:id',   protect, authorize('NUTRITIONIST'),               slotsController.deleteSlot);

module.exports = router;