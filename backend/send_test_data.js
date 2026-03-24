const mongoose = require('mongoose');
const User = require('./models/User.js');
const RewardTransaction = require('./models/RewardTransaction.js');
const Dustbin = require('./models/Dustbin.js');
const dotenv = require('dotenv');

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find a user
    const user = await User.findOne({ role: 'user' });
    if (!user) {
      console.log('No user found to seed history. Please register a user first.');
    } else {
      // Create a test transaction
      const transaction = await RewardTransaction.create({
        user: user._id,
        amount: 100,
        type: 'earned',
        description: 'Welcome Bonus Points',
        status: 'completed'
      });
      console.log('Created test transaction for:', user.email);
      
      // Update user points
      user.rewardPoints = (user.rewardPoints || 0) + 100;
      await user.save();
      console.log('Updated user points');
    }

    // Seed some dustbins if none exist
    const binCount = await Dustbin.countDocuments();
    if (binCount === 0) {
      await Dustbin.create([
        {
          binId: 'BIN001',
          location: {
            address: 'Central Park Entrance',
            latitude: 28.6139,
            longitude: 77.2090
          },
          fillLevel: 45,
          status: 'active'
        },
        {
          binId: 'BIN002',
          location: {
            address: 'Market Square South',
            latitude: 28.6200,
            longitude: 77.2150
          },
          fillLevel: 85,
          status: 'active'
        }
      ]);
      console.log('Created test dustbins');
    }

    console.log('Seeding completed!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

seedData();
