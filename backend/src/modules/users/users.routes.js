const express = require('express');
const router = express.Router();
const usersController = require('./users.controller');
const { validateUpdateProfile, validateChangePassword } = require('./users.validation');
const { protect, authorize } = require('../../middleware/auth');
const prisma = require('../../config/db');

router.get('/profile',         protect, usersController.getProfile);
router.put('/profile',         protect, validateUpdateProfile, usersController.updateProfile);
router.put('/change-password', protect, validateChangePassword, usersController.changePassword);
router.get('/:id', protect, usersController.getUserById);


// Accessible to any authenticated user — safe because password is excluded via select
router.get('/role/:role', protect, async (req, res) => {
  try {
    const VALID_ROLES = ['PATIENT', 'NUTRITIONIST', 'ADMIN'];
    const role = req.params.role?.toUpperCase();

    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const users = await prisma.user.findMany({
      where: { role, isActive: true },  
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        // password intentionally excluded
        nutritionist: {
          select: {
            id: true,
            specialization: true,
            bio: true,
          },
        },
        patient: {
          select: {
            id: true,
          },
        },
      },
    });

    res.status(200).json(users); 
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;