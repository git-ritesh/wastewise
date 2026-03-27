const GarbageReport = require('../models/GarbageReport.js');
const User = require('../models/User.js');

// @desc    Get user dashboard data
// @route   GET /api/dashboard
// @access  Private
const getDashboardData = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user data
    const user = await User.findById(userId).select('-password');

    // Get report statistics
    const reportStats = await GarbageReport.aggregate([
      { $match: { user: user._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Transform stats into object
    const stats = {
      pending: 0,
      assigned: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0,
      total: 0
    };

    reportStats.forEach(stat => {
      stats[stat._id] = stat.count;
      stats.total += stat.count;
    });

    // Get recent activity (reward transactions)
    const recentActivity = await require('../models/RewardTransaction.js').find({ user: user._id })
      .sort({ createdAt: -1 })
      .limit(5);

    // Get unread notification count
    const unreadCount = await require('../models/Notification.js').countDocuments({
      recipient: user._id,
      isRead: false
    });

    // Get user's leaderboard position
    const leaderboardPosition = await User.countDocuments({
      rewardPoints: { $gt: user.rewardPoints },
      role: 'user'
    }) + 1;

    // Get total users for percentage calculation
    const totalUsers = await User.countDocuments({ role: 'user' });

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          avatar: user.avatar,
          address: user.address,
          rewardPoints: user.rewardPoints,
          memberSince: user.createdAt
        },
        stats,
        recentActivity,
        unreadCount,
        leaderboard: {
          position: leaderboardPosition,
          totalUsers,
          percentile: Math.round(((totalUsers - leaderboardPosition + 1) / totalUsers) * 100)
        }
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data'
    });
  }
};

// @desc    Get user's garbage reports
// @route   GET /api/dashboard/reports
// @access  Private
const getUserReports = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const userId = req.user.id;

    const query = { user: userId };
    if (status && status !== 'all') {
      query.status = status;
    }

    const reports = await GarbageReport.find(query)
      .populate('assignedCollector', 'name phone')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await GarbageReport.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        reports,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reports'
    });
  }
};

// @desc    Create new garbage report
// @route   POST /api/dashboard/reports
// @access  Private
const createReport = async (req, res) => {
  try {
    let { title, description, wasteType, estimatedWeight, location, scheduledDate } = req.body;

    // Handle stringified location if sent from mobile
    if (typeof location === 'string') {
      try {
        location = JSON.parse(location);
      } catch (e) {
        console.error('Location parse error:', e);
      }
    }

    // Validate and map location fields correctly to schema
    const lat = location?.latitude;
    const lng = location?.longitude;
    
    if (lat === null || lat === undefined || lng === null || lng === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Valid location coordinates (latitude & longitude) are required to submit a report'
      });
    }

    const formattedLocation = {
      address: location?.address || 'Pinned Location',
      coordinates: {
        lat: lat,
        lng: lng
      }
    };

    // Handle multiple images if uploaded
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      imageUrls = req.files.map(file => file.secure_url || file.path || file.url).filter(Boolean);
    }

    const report = await GarbageReport.create({
      user: req.user.id,
      title,
      description,
      wasteType,
      estimatedWeight,
      location: formattedLocation,
      images: imageUrls,
      scheduledDate
    });

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully',
      data: report
    });
  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating report'
    });
  }
};

// @desc    Get single report
// @route   GET /api/dashboard/reports/:id
// @access  Private
const getReport = async (req, res) => {
  try {
    const report = await GarbageReport.findOne({
      _id: req.params.id,
      user: req.user.id
    }).populate('assignedCollector', 'name phone');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching report'
    });
  }
};

// @desc    Cancel a report
// @route   PATCH /api/dashboard/reports/:id/cancel
// @access  Private
const cancelReport = async (req, res) => {
  try {
    const report = await GarbageReport.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    if (!['pending', 'assigned'].includes(report.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel report in current status'
      });
    }

    report.status = 'cancelled';
    await report.save();

    res.status(200).json({
      success: true,
      message: 'Report cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel report error:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling report'
    });
  }
};

// @desc    Get leaderboard
// @route   GET /api/dashboard/leaderboard
// @access  Private
const getLeaderboard = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const leaderboard = await User.find({ role: 'user' })
      .select('name rewardPoints avatar createdAt')
      .sort({ rewardPoints: -1 })
      .limit(parseInt(limit));

    // Add rank to each user
    const rankedLeaderboard = leaderboard.map((user, index) => ({
      rank: index + 1,
      id: user._id,
      name: user.name,
      avatar: user.avatar,
      rewardPoints: user.rewardPoints,
      memberSince: user.createdAt
    }));

    // Get current user's position
    const currentUser = await User.findById(req.user.id);
    const userPosition = await User.countDocuments({
      rewardPoints: { $gt: currentUser.rewardPoints },
      role: 'user'
    }) + 1;

    res.status(200).json({
      success: true,
      data: {
        leaderboard: rankedLeaderboard,
        currentUserRank: userPosition
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

// @desc    Update user profile
// @route   PATCH /api/dashboard/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { name, phone, avatar, address } = req.body;
    
    const user = await User.findById(req.user.id);
    
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (avatar) user.avatar = avatar;
    if (address) user.address = address;
    
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        address: user.address
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile'
    });
  }
};

module.exports = {
  getDashboardData,
  getUserReports,
  createReport,
  getReport,
  cancelReport,
  getLeaderboard,
  updateProfile
};
