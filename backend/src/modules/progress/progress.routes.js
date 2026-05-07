const express = require('express');
const router = express.Router();
const progressController = require('./progress.controller');
const { validateAddProgress, validateAddNotes, validateAddPhoto } = require('./progress.validation');
const { protect, authorize } = require('../../middleware/auth');

router.get('/my',         protect, authorize('PATIENT'),       progressController.getMyProgress);
router.post('/',          protect, authorize('PATIENT'),       validateAddProgress, progressController.addProgress);
router.put('/:id/notes',  protect, authorize('NUTRITIONIST'),  validateAddNotes, progressController.addNotes);
router.post('/photos', protect, authorize('PATIENT'),          validateAddPhoto, progressController.addProgressPhoto);
router.get('/photos', protect, authorize('PATIENT'),            progressController.getMyProgressPhotos);
module.exports = router;