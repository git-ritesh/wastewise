const GarbageReport = require('../models/GarbageReport.js');
const User = require('../models/User.js');
const { sendNotification } = require('../services/notificationService.js');

// @desc    Get all reports (admin view)
// @route   GET /api/admin/reports
// @access  Admin only
const getAllReports = async (req, res) => {
  try {
    const { status, page = 1, limit = 20, search, wasteType, sortBy = 'createdAt', order = 'desc' } = req.query;

    const query = {};
    
    // Filter by status
    if (status && status !== 'all') {
      query.status = status;
    }

    // Filter by waste type
    if (wasteType && wasteType !== 'all') {
      query.wasteType = wasteType;
    }

    // Search in title or description
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'location.address': { $regex: search, $options: 'i' } }
      ];
    }

    // Sort configuration
    const sortConfig = {};
    sortConfig[sortBy] = order === 'asc' ? 1 : -1;

    const reports = await GarbageReport.find(query)
      .populate('user', 'name email phone')
      .populate('assignedCollector', 'name phone')
      .sort(sortConfig)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await GarbageReport.countDocuments(query);

    // Get status counts
    const statusCounts = await GarbageReport.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const statusStats = {
      total: 0,
      pending: 0,
      assigned: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0
    };

    statusCounts.forEach(s => {
      statusStats[s._id] = s.count;
      statusStats.total += s.count;
    });

    res.status(200).json({
      success: true,
      data: {
        reports,
        stats: statusStats,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Admin get reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reports'
    });
  }
};

// @desc    Get single report details
// @route   GET /api/admin/reports/:id
// @access  Admin only
const getReportDetails = async (req, res) => {
  try {
    const report = await GarbageReport.findById(req.params.id)
      .populate('user', 'name email phone address')
      .populate('assignedCollector', 'name phone email');

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
    console.error('Get report details error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching report details'
    });
  }
};

// @desc    Get all collectors
// @route   GET /api/admin/collectors
// @access  Admin only
const getCollectors = async (req, res) => {
  try {
    const collectors = await User.find({ role: 'collector', isVerified: true })
      .select('name email phone createdAt')
      .sort({ name: 1 });

    // Get active assignment counts for each collector
    const assignmentCounts = await GarbageReport.aggregate([
      { $match: { assignedCollector: { $ne: null }, status: { $in: ['assigned', 'in_progress'] } } },
      { $group: { _id: '$assignedCollector', count: { $sum: 1 } } }
    ]);

    const countMap = {};
    assignmentCounts.forEach(a => {
      countMap[a._id.toString()] = a.count;
    });

    const collectorsWithCounts = collectors.map(c => ({
      id: c._id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      activeAssignments: countMap[c._id.toString()] || 0
    }));

    res.status(200).json({
      success: true,
      data: collectorsWithCounts
    });
  } catch (error) {
    console.error('Get collectors error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching collectors'
    });
  }
};

// @desc    Update report status (approve/assign)
// @route   PATCH /api/admin/reports/:id/status
// @access  Admin only
const updateReportStatus = async (req, res) => {
  try {
    const { status, collectorId } = req.body;
    const report = await GarbageReport.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Validate status transition
    const validTransitions = {
      pending: ['assigned', 'cancelled'],
      assigned: ['in_progress', 'cancelled', 'pending'],
      in_progress: ['completed', 'cancelled'],
      completed: [],
      cancelled: ['pending']
    };

    if (status && !validTransitions[report.status]?.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot transition from ${report.status} to ${status}`
      });
    }

    // If assigning to collector
    if (status === 'assigned') {
      if (!collectorId) {
        return res.status(400).json({
          success: false,
          message: 'Collector ID is required for assignment'
        });
      }

      const collector = await User.findOne({ _id: collectorId, role: 'collector' });
      if (!collector) {
        return res.status(400).json({
          success: false,
          message: 'Invalid collector'
        });
      }

      report.assignedCollector = collectorId;
      
      // Notify Collector
      await sendNotification({
        recipientId: collectorId,
        title: 'New Pickup Assigned',
        message: `You have been assigned a new pickup: ${report.title}`,
        type: 'info',
        relatedId: report._id
      });
    }

    // If completing report, calculate and award points
    if (status === 'completed' && report.status !== 'completed') {
      const points = report.calculateRewardPoints();
      report.rewardPointsEarned = points;
      report.completedAt = new Date();

      // Award points to user
      await User.findByIdAndUpdate(report.user, {
        $inc: { rewardPoints: points }
      });

      // Create reward transaction for history
      const RewardTransaction = require('../models/RewardTransaction.js');
      await RewardTransaction.create({
        user: report.user,
        amount: points,
        type: 'earned',
        description: `Points earned for: ${report.title}`,
        relatedReport: report._id,
        status: 'completed'
      });

      // Notify User
      await sendNotification({
        recipientId: report.user,
        title: 'Report Completed',
        message: `Your report "${report.title}" has been completed! You earned ${points} points.`,
        type: 'success',
        relatedId: report._id,
        sendEmailAlert: true
      });
    }

    if (status) {
      report.status = status;
    }

    await report.save();

    // Populate for response
    const updatedReport = await GarbageReport.findById(report._id)
      .populate('user', 'name email phone')
      .populate('assignedCollector', 'name phone');

    res.status(200).json({
      success: true,
      message: `Report ${status === 'assigned' ? 'assigned to collector' : `status updated to ${status}`}`,
      data: updatedReport
    });
  } catch (error) {
    console.error('Update report status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating report'
    });
  }
};

// @desc    Reject/Cancel report
// @route   PATCH /api/admin/reports/:id/reject
// @access  Admin only
const rejectReport = async (req, res) => {
  try {
    const { reason } = req.body;
    const report = await GarbageReport.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    if (report.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot reject a completed report'
      });
    }

    report.status = 'cancelled';
    report.rejectionReason = reason || 'Rejected by admin';
    await report.save();

    // Notify User
    await sendNotification({
      recipientId: report.user,
      title: 'Report Rejected',
      message: `Your report "${report.title}" was rejected. Reason: ${reason || 'Admin decision'}.`,
      type: 'error',
      relatedId: report._id
    });

    res.status(200).json({
      success: true,
      message: 'Report rejected successfully'
    });
  } catch (error) {
    console.error('Reject report error:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting report'
    });
  }
};

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
// @access  Admin only
const getAdminStats = async (req, res) => {
  try {
    // Get report stats
    const reportStats = await GarbageReport.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const stats = {
      reports: { pending: 0, assigned: 0, in_progress: 0, completed: 0, cancelled: 0, total: 0 },
      users: { total: 0, verified: 0 },
      collectors: { total: 0, active: 0 },
      rewardsDistributed: 0
    };

    reportStats.forEach(s => {
      stats.reports[s._id] = s.count;
      stats.reports.total += s.count;
    });

    // Get user stats
    stats.users.total = await User.countDocuments({ role: 'user' });
    stats.users.verified = await User.countDocuments({ role: 'user', isVerified: true });

    // Get collector stats
    stats.collectors.total = await User.countDocuments({ role: 'collector' });
    stats.collectors.active = await User.countDocuments({ role: 'collector', isVerified: true });

    // Get total rewards distributed
    const rewardsResult = await GarbageReport.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$rewardPointsEarned' } } }
    ]);
    stats.rewardsDistributed = rewardsResult[0]?.total || 0;

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching admin stats'
    });
  }
};

module.exports = {
  getAllReports,
  getReportDetails,
  getCollectors,
  updateReportStatus,
  rejectReport,
  getAdminStats
};
