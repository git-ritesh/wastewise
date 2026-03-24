const mongoose = require('mongoose');

const collectorProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  employeeId: {
    type: String,
    unique: true,
    sparse: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'on_leave', 'suspended'],
    default: 'active'
  },
  serviceAreas: [{
    name: String,
    pincode: String,
    city: String,
    state: String
  }],
  vehicleInfo: {
    type: {
      type: String,
      enum: ['truck', 'van', 'bike', 'other']
    },
    registrationNumber: String,
    capacity: String
  },
  workingHours: {
    start: { type: String, default: '09:00' },
    end: { type: String, default: '18:00' }
  },
  stats: {
    totalTasksAssigned: { type: Number, default: 0 },
    totalTasksCompleted: { type: Number, default: 0 },
    totalTasksCancelled: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 }
  },
  currentTasks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GarbageReport'
  }],
  joinedAt: {
    type: Date,
    default: Date.now
  },
  lastActiveAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Generate employee ID
collectorProfileSchema.pre('save', async function(next) {
  if (!this.employeeId) {
    const count = await mongoose.model('CollectorProfile').countDocuments();
    this.employeeId = `COL${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Virtual for completion rate
collectorProfileSchema.virtual('completionRate').get(function() {
  if (this.stats.totalTasksAssigned === 0) return 0;
  return Math.round((this.stats.totalTasksCompleted / this.stats.totalTasksAssigned) * 100);
});

// Method to update stats after task completion
collectorProfileSchema.methods.updateTaskStats = async function(taskStatus) {
  if (taskStatus === 'completed') {
    this.stats.totalTasksCompleted += 1;
  } else if (taskStatus === 'cancelled') {
    this.stats.totalTasksCancelled += 1;
  }
  this.lastActiveAt = new Date();
  await this.save();
};

// Method to add rating
collectorProfileSchema.methods.addRating = async function(rating) {
  const totalPoints = this.stats.averageRating * this.stats.totalRatings;
  this.stats.totalRatings += 1;
  this.stats.averageRating = (totalPoints + rating) / this.stats.totalRatings;
  await this.save();
};

collectorProfileSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('CollectorProfile', collectorProfileSchema);
