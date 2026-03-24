const express = require('express');
const router = express.Router();
const { updateBinData, getAllBins } = require('../controllers/iotController.js');
const { protect, authorize } = require('../middleware/auth.js');

// Public route for sensors (in production, use API Key)
router.post('/data', updateBinData);

// Protected routes for dashboard
router.use(protect);
// Bins can be viewed by anyone authenticated
router.get('/bins', getAllBins);

module.exports = router;
