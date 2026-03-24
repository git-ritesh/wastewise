const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();

const {
  register,
  verifyOTP,
  login,
  resendOTP,
  forgotPassword,
  resetPassword,
  getMe
} = require('../controllers/authController.js');
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

// Registration validation
const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email'),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .matches(/^[0-9]{7,15}$/).withMessage('Please provide a valid phone number (7-15 digits)')
];

// Login validation
const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email'),
  body('password')
    .notEmpty().withMessage('Password is required')
];

// OTP validation
const otpValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email'),
  body('otp')
    .trim()
    .notEmpty().withMessage('OTP is required')
    .isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
];

// Reset password validation
const resetPasswordValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email'),
  body('otp')
    .trim()
    .notEmpty().withMessage('OTP is required')
    .isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

// Public routes
router.post('/register', registerValidation, handleValidationErrors, register);
router.post('/verify-otp', otpValidation, handleValidationErrors, verifyOTP);
router.post('/login', loginValidation, handleValidationErrors, login);
router.post('/resend-otp', [body('email').isEmail()], handleValidationErrors, resendOTP);
router.post('/forgot-password', [body('email').isEmail()], handleValidationErrors, forgotPassword);
router.post('/reset-password', resetPasswordValidation, handleValidationErrors, resetPassword);

// Protected routes
router.get('/me', protect, getMe);

// Role-specific routes (examples)
router.get('/admin-only', protect, roleCheck('admin'), (req, res) => {
  res.json({ success: true, message: 'Welcome Admin!' });
});

router.get('/collector-only', protect, roleCheck('collector', 'admin'), (req, res) => {
  res.json({ success: true, message: 'Welcome Collector!' });
});

module.exports = router;
