const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();

const {
  getDashboardData,
  getUserReports,
  createReport,
  getReport,
  cancelReport,
  getLeaderboard,
  updateProfile
} = require('../controllers/dashboardController.js');
const { protect } = require('../middleware/auth.js');
const { roleCheck } = require('../middleware/roleCheck.js');
const { upload } = require('../middleware/upload.js');

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

// Middleware to parse stringified JSON from FormData (for mobile compatibility)
const parseFormData = (req, res, next) => {
  if (req.body.location && typeof req.body.location === 'string') {
    try {
      req.body.location = JSON.parse(req.body.location);
    } catch (e) {
      console.error('Failed to parse location in middleware');
    }
  }
  next();
};

// Report validation
const reportValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 100 }).withMessage('Title cannot exceed 100 characters'),
  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  body('wasteType')
    .notEmpty().withMessage('Waste type is required')
    .isIn(['household', 'recyclable', 'ewaste', 'organic', 'hazardous', 'mixed'])
    .withMessage('Invalid waste type'),
  body('estimatedWeight')
    .notEmpty().withMessage('Estimated weight is required')
    .isIn(['less_than_5kg', '5_to_10kg', '10_to_20kg', 'more_than_20kg'])
    .withMessage('Invalid weight range'),
  body('location.address')
    .notEmpty().withMessage('Address is required')
];

// Profile validation
const profileValidation = [
  body('name').optional().trim().isLength({ min: 2, max: 50 }),
  body('phone').optional().matches(/^[0-9]{10}$/).withMessage('Invalid phone number')
];

// All routes require authentication
router.use(protect);

// Dashboard routes
router.get('/', getDashboardData);
router.get('/leaderboard', getLeaderboard);
router.patch('/profile', profileValidation, handleValidationErrors, updateProfile);

// Report routes
router.get('/reports', getUserReports);
router.post('/reports', upload.array('images', 5), parseFormData, reportValidation, handleValidationErrors, createReport);
router.get('/reports/:id', getReport);
router.patch('/reports/:id/cancel', cancelReport);

module.exports = router;
