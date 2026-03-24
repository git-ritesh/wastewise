const RewardTransaction = require('../models/RewardTransaction.js');
const User = require('../models/User.js');
const { sendNotification } = require('../services/notificationService.js');

// @desc    Get user's reward history and balance
// @route   GET /api/rewards/history
// @access  Private
const getRewardHistory = async (req, res) => {
  try {
    const transactions = await RewardTransaction.find({ user: req.user.id })
      .sort({ createdAt: -1 });

    const user = await User.findById(req.user.id).select('rewardPoints');

    res.status(200).json({
      success: true,
      data: {
        pointsBalance: user.rewardPoints,
        history: transactions
      }
    });
  } catch (error) {
    console.error('Get reward history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reward history'
    });
  }
};

// @desc    Request reward redemption
// @route   POST /api/rewards/redeem
// @access  Private
const redeemPoints = async (req, res) => {
  try {
    const { amount, method, paymentInfo } = req.body;
    const user = await User.findById(req.user.id);

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount'
      });
    }

    if (user.rewardPoints < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient points balance'
      });
    }

    // Create redemption transaction
    const transaction = new RewardTransaction({
      user: req.user.id,
      amount: -amount, // Negative for redemption
      type: 'redeemed',
      description: `Redemption: ${method.toUpperCase()}`,
      status: 'pending',
      redemptionDetails: {
        method,
        paymentInfo
      }
    });

    await transaction.save();

    // Deduct points immediately (can be refunded if rejected)
    await user.save();

    // Notify Admins (assuming we have a way to get admin IDs, or just broadcast/log for now)
    // For now, let's notify the user that their request is pending
    await sendNotification({
      recipientId: req.user.id,
      title: 'Redemption Request Received',
      message: `Your request to redeem ${amount} points for ${method} has been received and is pending approval.`,
      type: 'info',
      relatedId: transaction._id
    });

    res.status(201).json({
      success: true,
      message: 'Redemption request submitted',
      data: transaction
    });
  } catch (error) {
    console.error('Redeem points error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing redemption'
    });
  }
};

// @desc    Get global leaderboard
// @route   GET /api/rewards/leaderboard
// @access  Private
const getLeaderboard = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const leaderboard = await User.find({ role: 'user' })
      .select('name avatar rewardPoints')
      .sort({ rewardPoints: -1 })
      .limit(limit);

    // Find current user's rank
    const userRank = await User.countDocuments({ 
      role: 'user', 
      rewardPoints: { $gt: req.user.rewardPoints } 
    }) + 1;

    res.status(200).json({
      success: true,
      data: {
        leaderboard,
        userRank
      }
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching leaderboard'
    });
  }
};

// @desc    Get all redemption requests (Admin)
// @route   GET /api/admin/redemptions
// @access  Admin Only
const getRedemptionRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = { type: 'redeemed' };
    
    if (status && status !== 'all') {
      query.status = status;
    }

    const requests = await RewardTransaction.find(query)
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await RewardTransaction.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        requests,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get redemptions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching redemption requests'
    });
  }
};

// @desc    Process redemption (Approve/Reject)
// @route   PATCH /api/admin/redemptions/:id/status
// @access  Admin Only
const processRedemption = async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    const transaction = await RewardTransaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    if (transaction.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Transaction is already processed'
      });
    }

    if (status === 'rejected') {
      // Refund points
      const user = await User.findById(transaction.user);
      if (user) {
        user.rewardPoints += Math.abs(transaction.amount);
        await user.save();
      }
    }

    transaction.status = status;
    if (adminNote) transaction.redemptionDetails.adminNote = adminNote;
    await transaction.save();

    // Notify User
    await sendNotification({
      recipientId: transaction.user,
      title: `Redemption ${status === 'approved' ? 'Approved' : 'Rejected'}`,
      message: `Your redemption request for ${Math.abs(transaction.amount)} points has been ${status}.${adminNote ? ` Note: ${adminNote}` : ''}`,
      type: status === 'approved' ? 'success' : 'error',
      relatedId: transaction._id,
      sendEmailAlert: true
    });

    res.status(200).json({
      success: true,
      message: `Redemption request ${status}`,
      data: transaction
    });
  } catch (error) {
    console.error('Process redemption error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing redemption'
    });
  }
};

const RewardItem = require('../models/RewardItem.js');

// @desc    Get reward catalog
// @route   GET /api/rewards/catalog
// @access  Private
const getCatalog = async (req, res) => {
  try {
    const { category } = req.query;
    const query = { isActive: true };
    
    if (category && category !== 'all') {
      query.category = category;
    }

    const items = await RewardItem.find(query).sort({ pointsCost: 1 });

    res.status(200).json({
      success: true,
      data: items
    });
  } catch (error) {
    console.error('Get catalog error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching catalog'
    });
  }
};

// Internal function to seed default items if none exist
const seedDefaultItems = async () => {
  try {
    const count = await RewardItem.countDocuments();
    if (count === 0) {
      const defaultItems = [
        {
          name: 'Amazon Gift Card ₹100',
          description: 'Digital voucher for Amazon.in shopping',
          pointsCost: 500,
          category: 'voucher',
          image: 'https://cdn-icons-png.flaticon.com/512/5968/5968144.png'
        },
        {
          name: 'Movie Ticket Voucher',
          description: 'Get ₹200 off on BookMyShow',
          pointsCost: 800,
          category: 'voucher',
          image: 'https://cdn-icons-png.flaticon.com/512/2503/2503508.png'
        },
        {
          name: 'Eco-friendly Water Bottle',
          description: 'Reusable stainless steel bottle',
          pointsCost: 1500,
          category: 'product',
          image: 'https://cdn-icons-png.flaticon.com/512/3100/3100570.png'
        },
        {
          name: 'Plant a Tree',
          description: 'We will plant a tree in your name',
          pointsCost: 300,
          category: 'donation',
          image: 'https://cdn-icons-png.flaticon.com/512/620/620707.png'
        },
        {
          name: 'Direct Cash Transfer ₹50',
          description: 'Transfer to your bank account via UPI',
          pointsCost: 250,
          category: 'cash',
          image: 'https://cdn-icons-png.flaticon.com/512/2489/2489756.png'
        }
      ];
      await RewardItem.insertMany(defaultItems);
      console.log('Default reward items seeded');
    }
  } catch (error) {
    console.error('Seeding error:', error);
  }
};

// Run seeding logic
seedDefaultItems();

module.exports = {
  getRewardHistory,
  redeemPoints,
  getLeaderboard,
  getRedemptionRequests,
  processRedemption,
  getCatalog
};
