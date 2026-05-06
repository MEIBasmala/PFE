const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

const protect = async (req, res, next) => {
  try {
    // njib token man lheader
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const token = authHeader.split(' ')[1];

    // nataaked manou
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // njib l user man BD
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, fullName: true, email: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const userRole = req.user.role?.toUpperCase();
    if (!roles.map(r => r.toUpperCase()).includes(userRole)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    next();
  };
};

module.exports = { protect, authorize };