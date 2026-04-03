const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/auth.js');
const { upload, handleMulterError } = require('../middleware/uploadCloudinary.js');

// @desc    Upload images
// @route   POST /api/upload
// @access  Private
router.post('/', protect, upload.array('images', 5), handleMulterError, (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    console.log('📥 Upload request received');
    console.log('   Files count:', req.files.length);
    console.log('   First file object keys:', Object.keys(req.files[0]));
    console.log('   First file object:', JSON.stringify(req.files[0], null, 2));

    // Generate URLs for uploaded files
    // multer-storage-cloudinary stores the Cloudinary URL in the 'path' property
    const fileUrls = req.files.map(file => {
      // Extract URL from path property (where multer-storage-cloudinary puts it)
      const url = file.path || file.secure_url || file.url || file.location;
      console.log(`   ✅ Extracted URL from file: ${file.filename} => ${url}`);
      
      return {
        filename: file.filename,
        url: url,
        public_id: file.public_id,
        size: file.size,
        mimetype: file.mimetype
      };
    });

    console.log('✅ File URLs extracted:', fileUrls.map(f => f.url));

    res.status(200).json({
      success: true,
      message: `${req.files.length} file(s) uploaded successfully`,
      data: {
        files: fileUrls,
        urls: fileUrls.map(f => f.url)
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading files'
    });
  }
});

// @desc    Upload single image
// @route   POST /api/upload/single
// @access  Private
router.post('/single', protect, upload.single('image'), handleMulterError, (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Use Cloudinary secure URL
    const fileUrl = req.file.secure_url;

    res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        filename: req.file.filename,
        url: fileUrl,
        public_id: req.file.public_id,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading file'
    });
  }
});

module.exports = router;
