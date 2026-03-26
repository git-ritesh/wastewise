const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  phone: {
    type: String,
    required: [true, 'Please provide a phone number'],
    match: [/^[0-9]{7,15}$/, 'Please provide a valid phone number (7-15 digits, no spaces or dashes)']
  },
  role: {
    type: String,
    enum: ['admin', 'collector', 'user'],
    default: 'user'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  rewardPoints: {
    type: Number,
    default: 0
  },
  avatar: {
    type: String,
    default: ''
  },
  address: {
    type: String,
    default: ''
  },
  otp: {
    type: String,
    select: false
  },
  otpExpiry: {
    type: Date,
    select: false
  },
  resetPasswordOtp: {
    type: String,
    select: false
  },
  resetPasswordOtpExpiry: {
    type: Date,
    select: false
  }
}, {
  timestamps: true
});

// Auto-delete accounts that remain unverified beyond TTL window.
const unverifiedTtlSeconds = (parseInt(process.env.UNVERIFIED_ACCOUNT_TTL_MINUTES || '30', 10) || 30) * 60;
userSchema.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: unverifiedTtlSeconds,
    partialFilterExpression: { isVerified: false, role: 'user' }
  }
);

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate OTP
userSchema.methods.generateOTP = function() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.otp = otp;
  this.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  return otp;
};

// Generate Reset Password OTP
userSchema.methods.generateResetPasswordOTP = function() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.resetPasswordOtp = otp;
  this.resetPasswordOtpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  return otp;
};

module.exports = mongoose.model('User', userSchema);
