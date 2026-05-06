const express = require('express');
const router = express.Router();
const paymentsController = require('./payments.controller');
const { validateCreatePaymentIntent } = require('./payments.validation');
const { protect, authorize } = require('../../middleware/auth');


router.post('/webhook',         paymentsController.handleWebhook);
router.post('/create-intent',   protect, authorize('PATIENT'), validateCreatePaymentIntent, paymentsController.createPaymentIntent);
router.get('/history',          protect, authorize('PATIENT'), paymentsController.getPaymentHistory);

module.exports = router;