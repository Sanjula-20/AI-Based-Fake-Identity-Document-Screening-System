const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const errorHandler = require('./middleware/errorHandler');
const healthRoutes = require('./routes/health.routes');
const documentRoutes = require('./routes/document.routes');

const app = express();

// Security Middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use(limiter);

// Body Parser
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Routes
app.use('/api', healthRoutes);
app.use('/api/documents', documentRoutes);

// Root Endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'AI-Based Fake Identity & Document Screening System API',
    version: '1.0.0',
    status: 'Running'
  });
});

// Error Handling Middleware
app.use(errorHandler);

module.exports = app;
