const express = require('express');
const router = express.Router();
const axios = require('axios');
const { protect } = require('../middleware/authMiddleware');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// GET /api/eval/metrics
router.get('/metrics', async (req, res, next) => {
  try {
    const aiResponse = await axios.get(`${AI_SERVICE_URL}/eval/metrics`, { timeout: 5000 });
    res.status(200).json(aiResponse.data);
  } catch (error) {
    res.status(200).json({
      success: false,
      message: 'AI Evaluation metrics unavailable or not yet evaluated.',
      metrics: null,
      error: error.message
    });
  }
});

// POST /api/eval/run
router.post('/run', protect, async (req, res, next) => {
  try {
    const aiResponse = await axios.post(`${AI_SERVICE_URL}/eval/run`, {}, { timeout: 30000 });
    res.status(200).json(aiResponse.data);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to run model evaluation',
      error: error.message
    });
  }
});

module.exports = router;
