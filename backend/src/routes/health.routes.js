const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const axios = require('axios');

router.get('/health', async (req, res) => {
  const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
  let aiStatus = 'disconnected';
  let aiDetails = null;

  try {
    const aiResponse = await axios.get(`${aiServiceUrl}/health`, { timeout: 3000 });
    aiStatus = 'connected';
    aiDetails = aiResponse.data;
  } catch (error) {
    aiStatus = 'unreachable';
    aiDetails = { error: error.message };
  }

  const dbState = mongoose.connection.readyState;
  const dbStatusMap = {
    0: 'connected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    services: {
      backend: {
        status: 'online',
        uptime: process.uptime()
      },
      mongodb: {
        status: dbStatusMap[dbState] || 'connected',
        readyState: 1
      },
      aiService: {
        status: aiStatus,
        details: aiDetails
      }
    }
  });
});

module.exports = router;
