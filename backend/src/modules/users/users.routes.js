const express = require('express');
const router = express.Router();
const usersController = require('./users.controller');
const { validateUpdateProfile, validateChangePassword } = require('./users.validation');
const { protect, authorize } = require('../../middleware/auth');

router.get('/profile',         protect, usersController.getProfile);
router.put('/profile',         protect, validateUpdateProfile, usersController.updateProfile);
router.put('/change-password', protect, validateChangePassword, usersController.changePassword);
router.get('/:id',             protect, usersController.getUserById);
router.post('/measurements',   protect,authorize('PATIENT'),   usersController.addMeasurement);



router.get('/role/:role', protect, usersController.getUsersByRole);

module.exports = router;