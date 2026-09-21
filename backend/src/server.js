require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// Connect Database
connectDB();

const server = app.listen(PORT, () => {
  console.log(`[Express Backend] Listening on port ${PORT} (${process.env.NODE_ENV || 'development'} mode)`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  // Keep process running gracefully in dev
});
