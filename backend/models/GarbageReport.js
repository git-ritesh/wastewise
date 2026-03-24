const mongoose = require('mongoose');

const garbageReportSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please provide a title'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please provide a description'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  wasteType: {
    type: String,
    enum: ['household', 'recyclable', 'ewaste', 'organic', 'hazardous', 'mixed'],
    required: [true, 'Please specify waste type']
  },
  estimatedWeight: {
    type: String,
    enum: ['less_than_5kg', '5_to_10kg', '10_to_20kg', 'more_than_20kg'],
    required: true
  },
  location: {
    address: {
      type: String,
      required: [true, 'Please provide address']
    },
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  images: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['pending', 'assigned', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  assignedCollector: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  scheduledDate: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  completionProof: {
    type: String
  },
  completionNote: {
    type: String
  },
  rewardPointsEarned: {
    type: Number,
    default: 0
  },
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String
  }
}, {
  timestamps: true
});

// Index for faster queries
garbageReportSchema.index({ user: 1, status: 1 });
garbageReportSchema.index({ status: 1, createdAt: -1 });

// Calculate and assign reward points based on waste type and weight
garbageReportSchema.methods.calculateRewardPoints = function() {
  const wasteTypePoints = {
    household: 10,
    recyclable: 25,
    ewaste: 50,
    organic: 15,
    hazardous: 40,
    mixed: 10
  };

  const weightMultiplier = {
    less_than_5kg: 1,
    '5_to_10kg': 1.5,
    '10_to_20kg': 2,
    more_than_20kg: 3
  };

  const basePoints = wasteTypePoints[this.wasteType] || 10;
  const multiplier = weightMultiplier[this.estimatedWeight] || 1;
  
  return Math.round(basePoints * multiplier);
};

module.exports = mongoose.model('GarbageReport', garbageReportSchema);
