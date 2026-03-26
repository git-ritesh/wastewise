const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  clearAllNotifications
} = require('../controllers/notificationController.js');
const { protect } = require('../middleware/auth.js');

router.use(protect);

router.get('/', getNotifications);
router.patch('/:id/read', markAsRead);
router.patch('/read-all', markAllAsRead);
router.delete('/clear-all', clearAllNotifications);

module.exports = router;
