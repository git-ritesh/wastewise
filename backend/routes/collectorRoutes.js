const express = require('express');
const router = express.Router();
const {
  getCollectorTasks,
  completeTask
} = require('../controllers/collectorController.js');
const { protect } = require('../middleware/auth.js');
const { roleCheck } = require('../middleware/roleCheck.js');
const { upload } = require('../middleware/upload.js');

// All routes require authentication and collector role
router.use(protect);
router.use(roleCheck('collector'));

router.get('/tasks', getCollectorTasks);
router.post('/tasks/:id/complete', upload.single('proof'), completeTask);

module.exports = router;
