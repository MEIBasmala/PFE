require('dotenv').config();

// ── UNHANDLED REJECTION HANDLER (must be first) ─────────────────────────
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // In production, you might want to exit and let PM2/Render restart
  // process.exit(1);
});

const validateEnv = require('./config/validateEnv');
validateEnv();

require('./services/progressPhotoReminder');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');
 
const { createServer } = require('./config/socket');

// Rate limiters
const {
  authLimiter,
  chatbotLimiter,
  generalLimiter,
} = require('./config/rateLimiter');

const app = express();
app.use(cookieParser());

const { server } = createServer(app);

app.use(helmet());
app.use(morgan('dev'));

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// Rate limiters
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api/auth/refresh', authLimiter);

app.use('/api/chatbot/message', chatbotLimiter);

// General API limiter
app.use('/api', generalLimiter);

// Stripe webhook needs raw body before express.json()
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// ── ADDED: Body size limits (prevents large base64 image crashes) ───────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));


//  Routes
app.use('/api/auth',            require('./modules/auth/auth.routes'));
app.use('/api/auth/refresh',    require('./modules/refresh/refresh.routes'));
app.use('/api/users',           require('./modules/users/users.routes'));
app.use('/api/subscriptions',   require('./modules/subscriptions/subscriptions.routes'));
app.use('/api/payments',        require('./modules/payments/payments.routes'));
app.use('/api/slots',           require('./modules/slots/slots.routes'));
app.use('/api/appointments',    require('./modules/appointments/appointments.routes'));
app.use('/api/nutrition-plans', require('./modules/nutrition-plans/plans.routes'));
app.use('/api/food-logs',       require('./modules/food-logs/food-logs.routes'));
app.use('/api/progress',        require('./modules/progress/progress.routes'));
app.use('/api/messages',        require('./modules/messages/messages.routes'));
app.use('/api/blog',            require('./modules/blog/blog.routes'));
app.use('/api/inquiries',       require('./modules/inquiries/inquiries.routes'));
app.use('/api/notifications',   require('./modules/notifications/notifications.routes'));
app.use('/api/admin',           require('./modules/admin/admin.routes'));
app.use('/api/recipes',         require('./modules/recipes/recipes.routes'));
app.use('/api/patients',        require('./modules/patients/patients.routes'));
app.use('/api/chatbot',         require('./modules/chatbot/chatbot.routes'));

//  Health Check 
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'KhabirLens API is running 🚀' });
});



app.get('/api/debug/db', async (req, res) => {
  try {
    const prisma = require('./config/db');
    const result = await prisma.$queryRaw`SELECT 1 as connected`;
    const count = await prisma.user.count();
    res.json({ 
      status: 'OK', 
      dbConnected: true, 
      userCount: count,
      message: 'Database is connected' 
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      dbConnected: false, 
      error: error.message 
    });
  }
});


//  404 Handler 
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

//  Global Error Handler 
app.use((err, req, res, next) => {
  console.error(err.stack || err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

//  Start 
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`KhabirLens API running on http://localhost:${PORT}`);
  console.log(`Socket.IO attached`);
});

