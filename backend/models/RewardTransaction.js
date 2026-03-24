const mongoose = require('mongoose');

const rewardTransactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['earned', 'redeemed'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed'],
    default: 'completed' // 'earned' is usually auto-completed, 'redeemed' starts as 'pending'
  },
  relatedReport: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GarbageReport'
  },
  redemptionDetails: {
    method: {
      type: String,
      enum: ['cash', 'voucher', 'donation'],
      default: 'cash'
    },
    paymentInfo: String, // Bank details, UPI ID, etc.
    adminNote: String
  }
}, {
  timestamps: true
});

// Index for faster queries
rewardTransactionSchema.index({ user: 1, createdAt: -1 });
rewardTransactionSchema.index({ status: 1 });

module.exports = mongoose.model('RewardTransaction', rewardTransactionSchema);
