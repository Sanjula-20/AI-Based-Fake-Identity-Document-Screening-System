const express = require('express');
const router = express.Router();
const Verification = require('../models/Verification');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// GET /api/admin/dashboard
router.get('/dashboard', protect, adminOnly, async (req, res, next) => {
  try {
    const totalVerifications = await Verification.countDocuments();
    const lowRiskCount = await Verification.countDocuments({ riskStatus: 'LOW_RISK' });
    const reviewRequiredCount = await Verification.countDocuments({ riskStatus: 'REVIEW_REQUIRED' });
    const highRiskCount = await Verification.countDocuments({ riskStatus: 'HIGH_RISK' });
    const unableToDetermineCount = await Verification.countDocuments({ riskStatus: 'UNABLE_TO_DETERMINE' });

    const docTypeStats = await Verification.aggregate([
      { $group: { _id: '$documentType', count: { $sum: 1 } } }
    ]);

    const totalUsers = await User.countDocuments();

    res.status(200).json({
      success: true,
      stats: {
        totalVerifications,
        totalUsers,
        lowRisk: lowRiskCount,
        reviewRequired: reviewRequiredCount,
        highRisk: highRiskCount,
        unableToDetermine: unableToDetermineCount
      },
      documentTypeBreakdown: docTypeStats.map(d => ({ documentType: d._id || 'UNKNOWN', count: d.count }))
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/verifications
router.get('/verifications', protect, adminOnly, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const verifications = await Verification.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Verification.countDocuments();

    res.status(200).json({
      success: true,
      count: verifications.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      verifications
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
