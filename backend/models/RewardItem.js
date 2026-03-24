const mongoose = require('mongoose');

const rewardItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  pointsCost: {
    type: Number,
    required: true
  },
  image: {
    type: String,
    // default: 'default_reward.png' - We'll use emojis or placeholder URLs for now
  },
  category: {
    type: String,
    enum: ['voucher', 'product', 'donation', 'cash'],
    required: true
  },
  stock: {
    type: Number,
    default: -1 // -1 means unlimited
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('RewardItem', rewardItemSchema);
