const express = require('express');
const router = express.Router();
const subsController = require('./subscriptions.controller');
const { validateCreateSubscription } = require('./subscriptions.validation');
const { protect, authorize } = require('../../middleware/auth');

router.get('/packages',      protect,                                        subsController.getAllPackages);
router.get('/my',            protect, authorize('PATIENT'),                  subsController.getMySubscription);
router.post('/',             protect, authorize('PATIENT'), validateCreateSubscription, subsController.createSubscription);
router.put('/:id/cancel',    protect, authorize('PATIENT'),                  subsController.cancelSubscription);

module.exports = router;