const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db.js');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
const defaultAllowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173'
];

const envAllowedOrigins = [
  process.env.CLIENT_URL,
  ...(process.env.CLIENT_URLS || '').split(',').map(origin => origin.trim())
].filter(Boolean);

const allowedOrigins = [...new Set([...defaultAllowedOrigins, ...envAllowedOrigins])];

app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server calls and tools with no Origin header.
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true
}));
app.use((req, res, next) => {
  const logMsg = `📡 [${new Date().toLocaleTimeString()}] ${req.method} ${req.url} - From: ${req.ip}\n`;
  console.log(logMsg.trim());
  require('fs').appendFileSync(path.join(__dirname, 'debug_network.log'), logMsg);
  next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/authRoutes.js'));
app.use('/api/dashboard', require('./routes/dashboardRoutes.js'));
app.use('/api/upload', require('./routes/uploadRoutes.js'));
app.use('/api/admin', require('./routes/adminRoutes.js'));
app.use('/api/collector', require('./routes/collectorRoutes.js'));
app.use('/api/rewards', require('./routes/rewardRoutes.js'));
app.use('/api/notifications', require('./routes/notificationRoutes.js'));
app.use('/api/iot', require('./routes/iotRoutes.js'));

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'WasteWise API is running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 API Base URL: http://0.0.0.0:${PORT}/api`);
  console.log(`🏠 Local Network URL: http://192.168.1.107:${PORT}/api`);
});
