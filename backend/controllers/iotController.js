const Dustbin = require('../models/Dustbin.js');
const { sendNotification, emitSocketEvent } = require('../services/notificationService.js');

// @desc    Receive IoT Sensor Data
// @route   POST /api/iot/data
// @access  Public (or API Key protected in future)
const updateBinData = async (req, res) => {
  try {
    const { binId, fillLevel, latitude, longitude } = req.body;

    let bin = await Dustbin.findOne({ binId });

    if (!bin) {
      // Auto-register new bin if it doesn't exist
      bin = new Dustbin({
        binId,
        location: { 
          latitude: latitude || 0, 
          longitude: longitude || 0, 
          address: 'Smart Sensor Node' 
        }
      });
    }

    const previousFillLevel = bin.fillLevel;
    bin.fillLevel = fillLevel;
    bin.lastUpdated = Date.now();
    if (latitude) bin.location.latitude = latitude;
    if (longitude) bin.location.longitude = longitude;

    await bin.save();

    // Emit real-time update to dashboard
    emitSocketEvent('bin_update', bin);

    // Check Threshold (e.g., > 90%)
    if (fillLevel >= 90 && previousFillLevel < 90) {
      // Find admins to notify (simulated by finding users with role='admin')
      const User = require('../models/User');
      const admins = await User.find({ role: 'admin' });
      
      for (const admin of admins) {
        await sendNotification({
          recipientId: admin._id,
          title: 'Critical Fill Level Alert',
          message: `Dustbin ${bin.binId} is ${fillLevel}% full! Location: ${bin.location.address || 'Unknown'}`,
          type: 'error',
          link: '/admin/iot'
        });
      }
    }
    
    res.status(200).json({ success: true, message: 'Data received' });
  } catch (error) {
    console.error('IoT Data Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get all bins
// @route   GET /api/iot/bins
// @access  Private
const getAllBins = async (req, res) => {
  try {
    const bins = await Dustbin.find().sort({ fillLevel: -1 });
    res.status(200).json({ success: true, data: bins });
  } catch (error) {
    console.error('Get Bins Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  updateBinData,
  getAllBins
};
