const GarbageReport = require('../models/GarbageReport.js');
const User = require('../models/User.js');
const { emitSocketEvent, sendNotification } = require('../services/notificationService.js');

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

    console.log('📥 Create report request received');
    console.log('   req.body.images:', req.body.images);
    console.log('   req.files:', req.files?.map(f => ({ filename: f.filename, secure_url: f.secure_url })));

    // Handle stringified location if sent from mobile
    if (typeof location === 'string') {
      try {
        location = JSON.parse(location);
      } catch (e) {
        console.error('Location parse error:', e);
      }
    }

    // Map location fields correctly to schema
    // Allow 0,0 as valid coordinates (user pinned location) or auto-captured GPS
    const lat = location?.latitude != null ? location.latitude : location?.lat;
    const lng = location?.longitude != null ? location.longitude : location?.lng;
    
    const formattedLocation = {
      address: location?.address || 'Pinned Location',
      coordinates: {
        lat: lat ?? 0,
        lng: lng ?? 0
      }
    };

    // Handle images from either multipart uploads (req.files) or JSON body (Cloudinary URLs)
    let imageUrls = [];

    if (req.files && req.files.length > 0) {
      console.log('📸 Found multipart file uploads:', req.files.length);
      imageUrls = req.files
        .map(file => file.path || file.secure_url || file.url || file.location)
        .filter(Boolean);
    }

    // In web flow, images may be sent as URLs in body fields
    if (imageUrls.length === 0) {
      const candidates = [req.body.images, req.body.image, req.body.imageUrls, req.body.urls, req.body.files];

      for (const candidate of candidates) {
        if (!candidate) continue;

        console.log('🔍 Checking candidate field:', typeof candidate, Array.isArray(candidate) ? `array(${candidate.length})` : '');

        if (Array.isArray(candidate)) {
          imageUrls = candidate
            .map((item) => (typeof item === 'string' ? item : item?.path || item?.secure_url || item?.url || item?.location || ''))
            .filter(Boolean);
        } else if (typeof candidate === 'string') {
          try {
            const parsed = JSON.parse(candidate);
            if (Array.isArray(parsed)) {
              imageUrls = parsed
                .map((item) => (typeof item === 'string' ? item : item?.path || item?.secure_url || item?.url || item?.location || ''))
                .filter(Boolean);
            } else if (parsed && typeof parsed === 'object') {
              imageUrls = [parsed.path || parsed.secure_url || parsed.url || parsed.location].filter(Boolean);
            }
          } catch (e) {
            imageUrls = [candidate].filter(Boolean);
          }
        } else if (typeof candidate === 'object') {
          imageUrls = [candidate.secure_url || candidate.url || candidate.path].filter(Boolean);
        }

        if (imageUrls.length > 0) {
          console.log('✅ Found images:', imageUrls.length);
          break;
        }
      }
    }

    imageUrls = [...new Set(imageUrls.filter((u) => /^https?:\/\//i.test(u)))];

    console.log('📦 Final imageUrls stored:', imageUrls);

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

    console.log('✅ Report created with images:', report.images);

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully',
      data: report
    });

    emitSocketEvent('data:update', {
      scope: 'all',
      entity: 'report',
      action: 'created',
      reportId: report._id.toString(),
      userId: req.user.id
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

    emitSocketEvent('data:update', {
      scope: 'all',
      entity: 'report',
      action: 'cancelled',
      reportId: report._id.toString(),
      userId: req.user.id
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

    emitSocketEvent('data:update', {
      scope: 'all',
      entity: 'user',
      action: 'profile-updated',
      userId: user._id.toString()
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
