const express = require('express');
const router = express.Router();
const {
  getRewardHistory,
  redeemPoints,
  getLeaderboard
} = require('../controllers/rewardController.js');
const { protect } = require('../middleware/auth.js');

// Protected routes for users
router.use(protect);

router.get('/history', getRewardHistory);
router.get('/catalog', require('../controllers/rewardController.js').getCatalog);
router.post('/redeem', redeemPoints);
router.get('/leaderboard', getLeaderboard);

module.exports = router;
