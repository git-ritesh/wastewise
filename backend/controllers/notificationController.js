const Notification = require('../models/Notification.js');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20); // Limit to last 20 for now

    const unreadCount = await Notification.countDocuments({ 
      recipient: req.user.id, 
      isRead: false 
    });

    res.status(200).json({
      success: true,
      data: {
        notifications,
        unreadCount
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications'
    });
  }
};

// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating notification'
    });
  }
};

// @desc    Mark all as read
// @route   PATCH /api/notifications/read-all
// @access  Private
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, isRead: false },
      { isRead: true }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating notifications'
    });
  }
};

// @desc    Clear all notifications
// @route   DELETE /api/notifications/clear-all
// @access  Private
const clearAllNotifications = async (req, res) => {
  try {
    const result = await Notification.deleteMany({ recipient: req.user.id });

    res.status(200).json({
      success: true,
      message: 'All notifications cleared',
      data: {
        deletedCount: result.deletedCount
      }
    });
  } catch (error) {
    console.error('Clear notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Error clearing notifications'
    });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  clearAllNotifications
};
