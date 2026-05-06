const express = require('express');
const router = express.Router();
const inquiriesController = require('./inquiries.controller');
const { validateCreateInquiry, validateReply } = require('./inquiries.validation');
const { protect, authorize } = require('../../middleware/auth');

router.get('/my',         protect, authorize('PATIENT'), inquiriesController.getMyInquiries);
router.get('/',           protect, authorize('ADMIN'),   inquiriesController.getAllInquiries);
router.post('/',          protect, authorize('PATIENT'), validateCreateInquiry, inquiriesController.createInquiry);
router.put('/:id/reply',  protect, authorize('ADMIN'),   validateReply, inquiriesController.replyToInquiry);

module.exports = router;