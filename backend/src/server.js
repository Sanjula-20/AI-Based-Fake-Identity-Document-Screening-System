const path = require('path');
const dotenv = require('dotenv');

// Load .env from backend directory and root directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env'), override: true });

const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// Connect Database
connectDB();

const server = app.listen(PORT, () => {
  console.log(`[Express Backend] Listening on port ${PORT} (${process.env.NODE_ENV || 'development'} mode)`);
});

server.timeout = 120000;
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;
// Server reloaded successfully

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  // Keep process running gracefully in dev
});
