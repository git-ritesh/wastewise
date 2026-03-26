const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();

const {
  getAllReports,
  getReportDetails,
  getCollectors,
  updateReportStatus,
  rejectReport,
  getAdminStats,
  getAllUsers,
  deleteUser
} = require('../controllers/adminController.js');
const { createCollector } = require('../controllers/collectorController.js');
const { protect } = require('../middleware/auth.js');
const { roleCheck } = require('../middleware/roleCheck.js');

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// All routes require authentication and admin role
router.use(protect);
router.use(roleCheck('admin'));

// Admin dashboard stats
router.get('/stats', getAdminStats);

// Users management
router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);

// Collectors management
router.get('/collectors', getCollectors);
router.post('/collectors', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').trim().isEmail().withMessage('Valid email is required'),
  body('phone').trim().notEmpty().withMessage('Phone number is required')
    .matches(/^[0-9]{7,15}$/).withMessage('Please provide a valid phone number (7-15 digits)')
], handleValidationErrors, createCollector);

// Reports management
router.get('/reports', getAllReports);
router.get('/reports/:id', getReportDetails);
router.patch('/reports/:id/status', updateReportStatus);
// Redemption management
router.get('/redemptions', require('../controllers/rewardController.js').getRedemptionRequests);
router.patch('/redemptions/:id/status', require('../controllers/rewardController.js').processRedemption);

module.exports = router;
