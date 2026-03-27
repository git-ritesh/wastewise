const User = require('../models/User.js');
const CollectorProfile = require('../models/CollectorProfile.js');
const GarbageReport = require('../models/GarbageReport.js');
const { sendNotification } = require('../services/notificationService.js');

// @desc    Get all collectors with profiles
// @route   GET /api/admin/collectors/manage
// @access  Admin only
const getCollectorsWithProfiles = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    
    // First get collector users
    let userQuery = { role: 'collector' };
    if (search) {
      userQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const collectors = await User.find(userQuery)
      .select('name email phone isVerified createdAt')
      .sort({ createdAt: -1 });

    // Get profiles for these collectors
    const collectorIds = collectors.map(c => c._id);
    const profiles = await CollectorProfile.find({ user: { $in: collectorIds } });
    
    const profileMap = {};
    profiles.forEach(p => {
      profileMap[p.user.toString()] = p;
    });

    // Combine user and profile data
    let result = collectors.map(c => ({
      id: c._id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      isVerified: c.isVerified,
      registeredAt: c.createdAt,
      profile: profileMap[c._id.toString()] || null
    }));

    // Filter by profile status if specified
    if (status && status !== 'all') {
      result = result.filter(c => c.profile?.status === status);
    }

    // Pagination
    const total = result.length;
    const start = (page - 1) * limit;
    result = result.slice(start, start + parseInt(limit));

    // Get stats summary
    const activeCount = profiles.filter(p => p.status === 'active').length;
    const inactiveCount = profiles.filter(p => p.status === 'inactive').length;
    const onLeaveCount = profiles.filter(p => p.status === 'on_leave').length;

    res.status(200).json({
      success: true,
      data: {
        collectors: result,
        stats: {
          total: collectors.length,
          active: activeCount,
          inactive: inactiveCount,
          onLeave: onLeaveCount,
          withoutProfile: collectors.length - profiles.length
        },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get collectors error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching collectors'
    });
  }
};

// @desc    Create or update collector profile
// @route   POST /api/admin/collectors
// @access  Admin only
const createCollector = async (req, res) => {
  try {
    const { name, email, phone, serviceAreas, vehicleInfo, workingHours } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    
    if (user) {
      if (user.role !== 'collector') {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists with a different role'
        });
      }
      return res.status(400).json({
        success: false,
        message: 'A collector with this email already exists'
      });
    }

    // Generate a secure random password
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    const specials = '@#$&!';
    let generatedPassword = '';
    for (let i = 0; i < 8; i++) {
      generatedPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // Add 2 special characters for strength
    generatedPassword += specials.charAt(Math.floor(Math.random() * specials.length));
    generatedPassword += specials.charAt(Math.floor(Math.random() * specials.length));

    // Create new collector user
    user = new User({
      name,
      email,
      phone,
      password: generatedPassword,
      role: 'collector',
      isVerified: true // Admin-created collectors are pre-verified
    });
    await user.save();

    // Create collector profile
    const profile = new CollectorProfile({
      user: user._id,
      serviceAreas: serviceAreas || [],
      vehicleInfo: vehicleInfo || {},
      workingHours: workingHours || {}
    });
    await profile.save();

    // Send credentials email to the collector
    const { sendCollectorCredentialsEmail } = require('../utils/emailService.js');
    await sendCollectorCredentialsEmail(email, name, generatedPassword);

    res.status(201).json({
      success: true,
      message: 'Collector created successfully. Login credentials have been sent to their email.',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone
        },
        profile,
        generatedPassword // Include for admin reference (shown once)
      }
    });
  } catch (error) {
    console.error('Create collector error:', error);
    res.status(500).json({
      success: false,
      message: error.code === 11000 ? 'Email or phone already exists' : 'Error creating collector'
    });
  }
};

// @desc    Update collector profile
// @route   PUT /api/admin/collectors/manage/:id
// @access  Admin only
const updateCollector = async (req, res) => {
  try {
    const { name, phone, status, serviceAreas, vehicleInfo, workingHours } = req.body;
    
    // Update user info
    const user = await User.findById(req.params.id);
    if (!user || user.role !== 'collector') {
      return res.status(404).json({
        success: false,
        message: 'Collector not found'
      });
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    await user.save();

    // Update or create profile
    let profile = await CollectorProfile.findOne({ user: user._id });
    
    if (!profile) {
      profile = new CollectorProfile({ user: user._id });
    }

    if (status) profile.status = status;
    if (serviceAreas) profile.serviceAreas = serviceAreas;
    if (vehicleInfo) profile.vehicleInfo = vehicleInfo;
    if (workingHours) profile.workingHours = workingHours;
    
    await profile.save();

    res.status(200).json({
      success: true,
      message: 'Collector updated successfully',
      data: { user, profile }
    });
  } catch (error) {
    console.error('Update collector error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating collector'
    });
  }
};

// @desc    Get collector details with tasks
// @route   GET /api/admin/collectors/manage/:id
// @access  Admin only
const getCollectorDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user || user.role !== 'collector') {
      return res.status(404).json({
        success: false,
        message: 'Collector not found'
      });
    }

    const profile = await CollectorProfile.findOne({ user: user._id });

    // Get recent tasks
    const recentTasks = await GarbageReport.find({ assignedCollector: user._id })
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .limit(10)
      .select('title status wasteType createdAt completedAt rewardPointsEarned');

    // Get task statistics
    const taskStats = await GarbageReport.aggregate([
      { $match: { assignedCollector: user._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const stats = { assigned: 0, in_progress: 0, completed: 0, cancelled: 0 };
    taskStats.forEach(s => { stats[s._id] = s.count; });

    res.status(200).json({
      success: true,
      data: {
        user,
        profile,
        recentTasks,
        taskStats: stats
      }
    });
  } catch (error) {
    console.error('Get collector details error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching collector details'
    });
  }
};

// @desc    Delete/Deactivate collector
// @route   DELETE /api/admin/collectors/manage/:id
// @access  Admin only
const deleteCollector = async (req, res) => {
  try {
    const { permanent } = req.query;
    
    const user = await User.findById(req.params.id);
    if (!user || user.role !== 'collector') {
      return res.status(404).json({
        success: false,
        message: 'Collector not found'
      });
    }

    // Check for active tasks
    const activeTasks = await GarbageReport.countDocuments({
      assignedCollector: user._id,
      status: { $in: ['assigned', 'in_progress'] }
    });

    if (activeTasks > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete collector with ${activeTasks} active task(s). Please reassign first.`
      });
    }

    if (permanent === 'true') {
      // Permanent delete
      await CollectorProfile.deleteOne({ user: user._id });
      await User.deleteOne({ _id: user._id });
      
      res.status(200).json({
        success: true,
        message: 'Collector permanently deleted'
      });
    } else {
      // Soft delete - just deactivate
      const profile = await CollectorProfile.findOne({ user: user._id });
      if (profile) {
        profile.status = 'inactive';
        await profile.save();
      }
      
      res.status(200).json({
        success: true,
        message: 'Collector deactivated'
      });
    }
  } catch (error) {
    console.error('Delete collector error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting collector'
    });
  }
};

// @desc    Update collector status
// @route   PATCH /api/admin/collectors/manage/:id/status
// @access  Admin only
const updateCollectorStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['active', 'inactive', 'on_leave', 'suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    let profile = await CollectorProfile.findOne({ user: req.params.id });
    
    if (!profile) {
      // Create profile if it doesn't exist
      profile = new CollectorProfile({ user: req.params.id, status });
    } else {
      profile.status = status;
    }
    
    await profile.save();

    res.status(200).json({
      success: true,
      message: `Collector status updated to ${status}`,
      data: profile
    });
  } catch (error) {
    console.error('Update collector status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating collector status'
    });
  }
};

// @desc    Get tasks assigned to logged-in collector
// @route   GET /api/collector/tasks
// @access  Private (Collector)
const getCollectorTasks = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    const query = { assignedCollector: req.user.id };
    
    if (status && status !== 'all') {
      query.status = status;
    } else if (!status) {
      // Default: show assigned and in_progress
      query.status = { $in: ['assigned', 'in_progress'] };
    }

    let tasks = await GarbageReport.find(query)
      .populate('user', 'name phone')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Ensure all tasks have location data (for backward compatibility)
    tasks = tasks.map(task => {
      if (!task.location) {
        task.location = { address: 'No address provided', coordinates: { lat: 0, lng: 0 } };
      }
      if (!task.location.coordinates) {
        task.location.coordinates = { lat: 0, lng: 0 };
      }
      return task;
    });

    const total = await GarbageReport.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        tasks,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get collector tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tasks'
    });
  }
};

// @desc    Mark task as completed with proof
// @route   POST /api/collector/tasks/:id/complete
// @access  Private (Collector)
const completeTask = async (req, res) => {
  try {
    const { note } = req.body;
    const task = await GarbageReport.findOne({
      _id: req.params.id,
      assignedCollector: req.user.id
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or not assigned to you'
      });
    }

    if (task.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Task is already completed'
      });
    }

    // Handle file upload (Cloudinary URL)
    if (req.file) {
      task.completionProof = req.file.secure_url || req.file.path || req.file.url;
    }

    task.status = 'completed';
    task.completedAt = new Date();
    task.completionNote = note;
    
    // Calculate rewards
    const points = task.calculateRewardPoints();
    task.rewardPointsEarned = points;

    await task.save();

    // Update user points
    await User.findByIdAndUpdate(task.user, {
      $inc: { rewardPoints: points }
    });

    // Create reward transaction for history
    const RewardTransaction = require('../models/RewardTransaction.js');
    await RewardTransaction.create({
      user: task.user,
      amount: points,
      type: 'earned',
      description: `Points earned for: ${task.title}`,
      relatedReport: task._id,
      status: 'completed'
    });

    // Update collector stats
    const profile = await CollectorProfile.findOne({ user: req.user.id });
    if (profile) {
      await profile.updateTaskStats('completed');
    }

    // Notify User
    await sendNotification({
      recipientId: task.user,
      title: 'Cleanup Completed',
      message: `Great news! Your waste pickup request "${task.title}" has been completed by ${req.user.name}. View the proof in your dashboard.`,
      type: 'success',
      relatedId: task._id,
      sendEmailAlert: true
    });

    res.status(200).json({
      success: true,
      message: 'Task marked as completed',
      data: task
    });
  } catch (error) {
    console.error('Complete task error:', error);
    res.status(500).json({
      success: false,
      message: 'Error completing task'
    });
  }
};

module.exports = {
  getCollectorsWithProfiles,
  createCollector,
  updateCollector,
  getCollectorDetails,
  deleteCollector,
  updateCollectorStatus,
  getCollectorTasks,
  completeTask
};
