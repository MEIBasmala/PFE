const express = require('express');
const router = express.Router();
const progressController = require('./progress.controller');
const { validateAddProgress, validateAddNotes } = require('./progress.validation');
const { protect, authorize } = require('../../middleware/auth');

router.get('/my',         protect, authorize('PATIENT'),       progressController.getMyProgress);
router.post('/',          protect, authorize('PATIENT'),       validateAddProgress, progressController.addProgress);
router.put('/:id/notes',  protect, authorize('NUTRITIONIST'),  validateAddNotes, progressController.addNotes);

module.exports = router;