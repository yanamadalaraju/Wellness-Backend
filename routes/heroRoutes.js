// const express = require('express');
// const router = express.Router();
// const pool = require('../db');
// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');

// // Configure multer for video uploads
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     const uploadDir = 'uploads/hero-videos';
//     if (!fs.existsSync(uploadDir)) {
//       fs.mkdirSync(uploadDir, { recursive: true });
//     }
//     cb(null, uploadDir);
//   },
//   filename: (req, file, cb) => {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     cb(null, 'hero-' + uniqueSuffix + path.extname(file.originalname));
//   }
// });

// const upload = multer({
//   storage: storage,
//   limits: {
//     fileSize: 50 * 1024 * 1024 // 50MB limit
//   },
//   fileFilter: (req, file, cb) => {
//     if (file.mimetype.startsWith('video/')) {
//       cb(null, true);
//     } else {
//       cb(new Error('Only video files are allowed!'), false);
//     }
//   }
// });

// // Get all hero content
// router.get('/hero-content', async (req, res) => {
//   try {
//     const [rows] = await pool.query(`
//       SELECT * FROM hero_content 
//       WHERE is_active = true 
//       ORDER BY display_order ASC, created_at DESC
//     `);
//     res.json(rows);
//   } catch (error) {
//     console.error('Error fetching hero content:', error);
//     res.status(500).json({ error: 'Failed to fetch hero content' });
//   }
// });

// // Add new hero content
// router.post('/hero-content', upload.single('video'), async (req, res) => {
//   try {
//     const { title, subtitle, display_order } = req.body;
    
//     if (!req.file) {
//       return res.status(400).json({ error: 'Video file is required' });
//     }

//     const videoUrl = `/uploads/hero-videos/${req.file.filename}`;

//     const [result] = await pool.query(
//       'INSERT INTO hero_content (video_url, title, subtitle, display_order) VALUES (?, ?, ?, ?)',
//       [videoUrl, title, subtitle, display_order || 0]
//     );

//     res.status(201).json({
//       message: 'Hero content added successfully',
//       id: result.insertId,
//       videoUrl
//     });
//   } catch (error) {
//     console.error('Error adding hero content:', error);
//     res.status(500).json({ error: 'Failed to add hero content' });
//   }
// });

// // Update hero content
// router.put('/hero-content/:id', upload.single('video'), async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { title, subtitle, display_order, is_active } = req.body;
    
//     let videoUrl;
//     let updateQuery = 'UPDATE hero_content SET title = ?, subtitle = ?, display_order = ?, is_active = ?';
//     let queryParams = [title, subtitle, display_order || 0, is_active];

//     if (req.file) {
//       videoUrl = `/uploads/hero-videos/${req.file.filename}`;
//       updateQuery += ', video_url = ?';
//       queryParams.push(videoUrl);
//     }

//     updateQuery += ' WHERE id = ?';
//     queryParams.push(id);

//     const [result] = await pool.query(updateQuery, queryParams);

//     if (result.affectedRows === 0) {
//       return res.status(404).json({ error: 'Hero content not found' });
//     }

//     res.json({ message: 'Hero content updated successfully' });
//   } catch (error) {
//     console.error('Error updating hero content:', error);
//     res.status(500).json({ error: 'Failed to update hero content' });
//   }
// });

// // Delete hero content
// router.delete('/hero-content/:id', async (req, res) => {
//   try {
//     const { id } = req.params;

//     const [result] = await pool.query('DELETE FROM hero_content WHERE id = ?', [id]);

//     if (result.affectedRows === 0) {
//       return res.status(404).json({ error: 'Hero content not found' });
//     }

//     res.json({ message: 'Hero content deleted successfully' });
//   } catch (error) {
//     console.error('Error deleting hero content:', error);
//     res.status(500).json({ error: 'Failed to delete hero content' });
//   }
// });

// module.exports = router;



// const express = require('express');
// const router = express.Router();
// const pool = require('../db');
// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');

// // Configure multer for video uploads
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     const uploadDir = 'uploads/hero-videos';
//     if (!fs.existsSync(uploadDir)) {
//       fs.mkdirSync(uploadDir, { recursive: true });
//     }
//     cb(null, uploadDir);
//   },
//   filename: (req, file, cb) => {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     cb(null, 'hero-' + uniqueSuffix + path.extname(file.originalname));
//   }
// });

// const upload = multer({
//   storage: storage,
//   limits: {
//     fileSize: 100 * 1024 * 1024, // Increased to 100MB limit
//     fieldSize: 100 * 1024 * 1024 // Also increase field size limit
//   },
//   fileFilter: (req, file, cb) => {
//     if (file.mimetype.startsWith('video/')) {
//       cb(null, true);
//     } else {
//       cb(new Error('Only video files are allowed!'), false);
//     }
//   }
// });

// // Error handling middleware for multer
// const handleMulterError = (error, req, res, next) => {
//   if (error instanceof multer.MulterError) {
//     if (error.code === 'LIMIT_FILE_SIZE') {
//       return res.status(400).json({ 
//         error: 'File too large. Maximum size is 100MB.' 
//       });
//     }
//     return res.status(400).json({ 
//       error: `Upload error: ${error.message}` 
//     });
//   } else if (error) {
//     return res.status(400).json({ 
//       error: error.message 
//     });
//   }
//   next();
// };

// // Get all hero content
// router.get('/hero-content', async (req, res) => {
//   try {
//     const [rows] = await pool.query(`
//       SELECT * FROM hero_content 
//       WHERE is_active = true 
//       ORDER BY display_order ASC, created_at DESC
//     `);
//     res.json(rows);
//   } catch (error) {
//     console.error('Error fetching hero content:', error);
//     res.status(500).json({ error: 'Failed to fetch hero content' });
//   }
// });

// // Add new hero content
// router.post('/hero-content', upload.single('video'), handleMulterError, async (req, res) => {
//   try {
//     const { title, subtitle, display_order } = req.body;
    
//     if (!req.file) {
//       return res.status(400).json({ error: 'Video file is required' });
//     }

//     const videoUrl = `/uploads/hero-videos/${req.file.filename}`;

//     const [result] = await pool.query(
//       'INSERT INTO hero_content (video_url, title, subtitle, display_order) VALUES (?, ?, ?, ?)',
//       [videoUrl, title, subtitle, display_order || 0]
//     );

//     res.status(201).json({
//       message: 'Hero content added successfully',
//       id: result.insertId,
//       videoUrl
//     });
//   } catch (error) {
//     console.error('Error adding hero content:', error);
//     res.status(500).json({ error: 'Failed to add hero content' });
//   }
// });

// // Update hero content
// // router.put('/hero-content/:id', upload.single('video'), handleMulterError, async (req, res) => {
// //   try {
// //     const { id } = req.params;
// //     const { title, subtitle, display_order, is_active } = req.body;
    
// //     let videoUrl;
// //     let updateQuery = 'UPDATE hero_content SET title = ?, subtitle = ?, display_order = ?, is_active = ?';
// //     let queryParams = [title, subtitle, display_order || 0, is_active];

// //     if (req.file) {
// //       videoUrl = `/uploads/hero-videos/${req.file.filename}`;
// //       updateQuery += ', video_url = ?';
// //       queryParams.push(videoUrl);
// //     }

// //     updateQuery += ' WHERE id = ?';
// //     queryParams.push(id);

// //     const [result] = await pool.query(updateQuery, queryParams);

// //     if (result.affectedRows === 0) {
// //       return res.status(404).json({ error: 'Hero content not found' });
// //     }

// //     res.json({ message: 'Hero content updated successfully' });
// //   } catch (error) {
// //     console.error('Error updating hero content:', error);
// //     res.status(500).json({ error: 'Failed to update hero content' });
// //   }
// // });


// // Update hero content
// // router.put('/hero-content/:id', upload.single('video'), handleMulterError, async (req, res) => {
// //   try {
// //     const { id } = req.params;
// //     const { title, subtitle, display_order, is_active } = req.body;
    
// //     console.log('Update request body:', req.body);
// //     console.log('Update file:', req.file);
    
// //     let updateQuery = 'UPDATE hero_content SET title = ?, subtitle = ?, display_order = ?, is_active = ?';
// //     let queryParams = [title, subtitle, display_order || 0, is_active || true];

// //     if (req.file) {
// //       const videoUrl = `/uploads/hero-videos/${req.file.filename}`;
// //       updateQuery += ', video_url = ?';
// //       queryParams.push(videoUrl);
// //       console.log('New video URL:', videoUrl);
// //     }

// //     updateQuery += ' WHERE id = ?';
// //     queryParams.push(id);

// //     console.log('Final query:', updateQuery);
// //     console.log('Query params:', queryParams);

// //     const [result] = await pool.query(updateQuery, queryParams);

// //     if (result.affectedRows === 0) {
// //       return res.status(404).json({ error: 'Hero content not found' });
// //     }

// //     res.json({ 
// //       message: 'Hero content updated successfully',
// //       updated: true 
// //     });
// //   } catch (error) {
// //     console.error('Error updating hero content:', error);
// //     res.status(500).json({ error: 'Failed to update hero content: ' + error.message });
// //   }
// // });

// // Update hero content
// router.put('/hero-content/:id', upload.single('video'), handleMulterError, async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { title, subtitle, display_order, is_active } = req.body;
    
//     console.log('🔍 UPDATE DEBUG INFO:');
//     console.log('Request headers:', req.headers['content-type']);
//     console.log('Request body:', req.body);
//     console.log('Request file:', req.file);
//     console.log('Request files:', req.files);
//     console.log('Multer processed file:', req.file);
    
//     let updateQuery = 'UPDATE hero_content SET title = ?, subtitle = ?, display_order = ?, is_active = ?';
//     let queryParams = [title, subtitle, display_order || 0, is_active || true];

//     if (req.file) {
//       const videoUrl = `/uploads/hero-videos/${req.file.filename}`;
//       updateQuery += ', video_url = ?';
//       queryParams.push(videoUrl);
//       console.log('✅ New video URL will be:', videoUrl);
//     } else {
//       console.log('ℹ️ No new video file provided, keeping existing video');
//     }

//     updateQuery += ' WHERE id = ?';
//     queryParams.push(id);

//     console.log('📝 Final query:', updateQuery);
//     console.log('🔢 Query params:', queryParams);

//     const [result] = await pool.query(updateQuery, queryParams);

//     if (result.affectedRows === 0) {
//       return res.status(404).json({ error: 'Hero content not found' });
//     }

//     res.json({ 
//       message: 'Hero content updated successfully',
//       updated: true,
//       videoUpdated: !!req.file
//     });
//   } catch (error) {
//     console.error('❌ Error updating hero content:', error);
//     res.status(500).json({ error: 'Failed to update hero content: ' + error.message });
//   }
// });

// // Delete hero content
// router.delete('/hero-content/:id', async (req, res) => {
//   try {
//     const { id } = req.params;

//     const [result] = await pool.query('DELETE FROM hero_content WHERE id = ?', [id]);

//     if (result.affectedRows === 0) {
//       return res.status(404).json({ error: 'Hero content not found' });
//     }

//     res.json({ message: 'Hero content deleted successfully' });
//   } catch (error) {
//     console.error('Error deleting hero content:', error);
//     res.status(500).json({ error: 'Failed to delete hero content' });
//   }
// });

// module.exports = router;




// const express = require('express');
// const router = express.Router();
// const pool = require('../db');
// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');

// // Configure multer for video uploads
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     const uploadDir = 'uploads/hero-videos';
//     if (!fs.existsSync(uploadDir)) {
//       fs.mkdirSync(uploadDir, { recursive: true });
//     }
//     cb(null, uploadDir);
//   },
//   filename: (req, file, cb) => {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     cb(null, 'hero-' + uniqueSuffix + path.extname(file.originalname));
//   }
// });

// const upload = multer({
//   storage: storage,
//   limits: {
//     fileSize: 100 * 1024 * 1024, // 100MB limit
//   },
//   fileFilter: (req, file, cb) => {
//     if (file.mimetype.startsWith('video/')) {
//       cb(null, true);
//     } else {
//       cb(new Error('Only video files are allowed!'), false);
//     }
//   }
// });

// // Error handling middleware for multer
// const handleMulterError = (error, req, res, next) => {
//   if (error instanceof multer.MulterError) {
//     if (error.code === 'LIMIT_FILE_SIZE') {
//       return res.status(400).json({ 
//         error: 'File too large. Maximum size is 100MB.' 
//       });
//     }
//     return res.status(400).json({ 
//       error: `Upload error: ${error.message}` 
//     });
//   } else if (error) {
//     return res.status(400).json({ 
//       error: error.message 
//     });
//   }
//   next();
// };

// // Get all hero content
// router.get('/hero-content', async (req, res) => {
//   try {
//     const [rows] = await pool.query(`
//       SELECT * FROM hero_content 
//       WHERE is_active = true 
//       ORDER BY display_order ASC, created_at DESC
//     `);
//     res.json(rows);
//   } catch (error) {
//     console.error('Error fetching hero content:', error);
//     res.status(500).json({ error: 'Failed to fetch hero content' });
//   }
// });

// // Add new hero content
// router.post('/hero-content', upload.single('video'), handleMulterError, async (req, res) => {
//   try {
//     const { title, subtitle, display_order } = req.body;
    
//     if (!req.file) {
//       return res.status(400).json({ error: 'Video file is required' });
//     }

//     const videoUrl = `/uploads/hero-videos/${req.file.filename}`;

//     const [result] = await pool.query(
//       'INSERT INTO hero_content (video_url, title, subtitle, display_order) VALUES (?, ?, ?, ?)',
//       [videoUrl, title, subtitle, display_order || 0]
//     );

//     res.status(201).json({
//       message: 'Hero content added successfully',
//       id: result.insertId,
//       videoUrl
//     });
//   } catch (error) {
//     console.error('Error adding hero content:', error);
//     res.status(500).json({ error: 'Failed to add hero content' });
//   }
// });

// // Update hero content - FIXED VERSION
// router.put('/hero-content/:id', (req, res, next) => {
//   upload.single('video')(req, res, (err) => {
//     if (err) {
//       console.log('❌ Multer error:', err);
//       return res.status(400).json({ error: err.message });
//     }

//     console.log('✅ File upload processed');
//     console.log('📁 Received file:', req.file);
//     console.log('📝 Received body:', req.body);
    
//     const { id } = req.params;
//     const { title, subtitle, display_order, is_active } = req.body;

//     if (!id) {
//       return res.status(400).json({ error: 'ID parameter is required' });
//     }

//     let updateQuery = 'UPDATE hero_content SET title = ?, subtitle = ?, display_order = ?, is_active = ?';
//     let queryParams = [title, subtitle, display_order || 0, is_active || true];

//     if (req.file) {
//       const videoUrl = `/uploads/hero-videos/${req.file.filename}`;
//       updateQuery += ', video_url = ?';
//       queryParams.push(videoUrl);
//       console.log('🎬 New video uploaded:', videoUrl);
//     } else {
//       console.log('📼 Keeping existing video');
//     }

//     updateQuery += ' WHERE id = ?';
//     queryParams.push(id);

//     console.log('📝 Final query:', updateQuery);
//     console.log('🔢 Query params:', queryParams);

//     pool.query(updateQuery, queryParams)
//       .then(([result]) => {
//         if (result.affectedRows === 0) {
//           return res.status(404).json({ error: 'Hero content not found' });
//         }
        
//         res.json({ 
//           message: 'Hero content updated successfully',
//           updated: true,
//           videoUpdated: !!req.file
//         });
//       })
//       .catch(error => {
//         console.error('❌ Database error:', error);
//         res.status(500).json({ error: 'Failed to update hero content' });
//       });
//   });
// });

// // Delete hero content
// router.delete('/hero-content/:id', async (req, res) => {
//   try {
//     const { id } = req.params;

//     if (!id) {
//       return res.status(400).json({ error: 'ID parameter is required' });
//     }

//     const [result] = await pool.query('DELETE FROM hero_content WHERE id = ?', [id]);

//     if (result.affectedRows === 0) {
//       return res.status(404).json({ error: 'Hero content not found' });
//     }

//     res.json({ message: 'Hero content deleted successfully' });
//   } catch (error) {
//     console.error('Error deleting hero content:', error);
//     res.status(500).json({ error: 'Failed to delete hero content' });
//   }
// });

// // Test upload endpoint
// router.post('/test-upload', upload.single('video'), (req, res) => {
//   console.log('🧪 TEST UPLOAD DEBUG:');
//   console.log('Headers:', req.headers['content-type']);
//   console.log('Body:', req.body);
//   console.log('File received:', req.file);
  
//   if (req.file) {
//     console.log('✅ File upload successful!');
//     console.log('File details:', {
//       originalname: req.file.originalname,
//       filename: req.file.filename,
//       size: req.file.size,
//       mimetype: req.file.mimetype
//     });
//   } else {
//     console.log('❌ No file received');
//   }
  
//   res.json({
//     success: true,
//     fileReceived: !!req.file,
//     file: req.file ? {
//       originalname: req.file.originalname,
//       filename: req.file.filename,
//       size: req.file.size,
//       mimetype: req.file.mimetype
//     } : null,
//     body: req.body
//   });
// });

// module.exports = router;




const express = require('express');
const router = express.Router();
const pool = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for video uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/hero-videos';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'hero-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Create multer instance with proper configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed!'), false);
    }
  }
});

// Get all hero content
router.get('/hero-content', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT * FROM hero_content 
      WHERE is_active = true 
      ORDER BY display_order ASC, created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching hero content:', error);
    res.status(500).json({ error: 'Failed to fetch hero content' });
  }
});

// Add new hero content
router.post('/hero-content', upload.single('video'), async (req, res) => {
  try {
    console.log('📨 POST /hero-content - File received:', req.file);
    console.log('📨 POST /hero-content - Body:', req.body);

    const { title, subtitle, display_order } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'Video file is required' });
    }

    const videoUrl = `/uploads/hero-videos/${req.file.filename}`;

    const [result] = await pool.query(
      'INSERT INTO hero_content (video_url, title, subtitle, display_order) VALUES (?, ?, ?, ?)',
      [videoUrl, title, subtitle, display_order || 0]
    );

    res.status(201).json({
      message: 'Hero content added successfully',
      id: result.insertId,
      videoUrl
    });
  } catch (error) {
    console.error('❌ Error adding hero content:', error);
    
    // Clean up uploaded file if database operation fails
    if (req.file) {
      fs.unlink(req.file.path, (unlinkErr) => {
        if (unlinkErr) console.error('Error deleting uploaded file:', unlinkErr);
      });
    }
    
    res.status(500).json({ error: 'Failed to add hero content' });
  }
});

// Update hero content - FIXED VERSION
router.put('/hero-content/:id', upload.single('video'), async (req, res) => {
  try {
    console.log('🔄 PUT /hero-content/:id');
    console.log('📁 Received file:', req.file);
    console.log('📝 Received body:', req.body);
    console.log('🎯 URL params:', req.params);

    const { id } = req.params;
    const { title, subtitle, display_order, is_active } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'ID parameter is required' });
    }

    // First, get the current video data
    const [currentRows] = await pool.query('SELECT * FROM hero_content WHERE id = ?', [id]);
    
    if (currentRows.length === 0) {
      return res.status(404).json({ error: 'Hero content not found' });
    }

    const currentVideo = currentRows[0];
    let videoUrl = currentVideo.video_url;

    // If a new file was uploaded, update the video URL
    if (req.file) {
      // Delete the old video file
      const oldVideoPath = path.join(__dirname, '..', currentVideo.video_url);
      if (fs.existsSync(oldVideoPath)) {
        fs.unlinkSync(oldVideoPath);
      }
      
      videoUrl = `/uploads/hero-videos/${req.file.filename}`;
    }

    // Update the database
    const [result] = await pool.query(
      'UPDATE hero_content SET video_url = ?, title = ?, subtitle = ?, display_order = ?, is_active = ? WHERE id = ?',
      [videoUrl, title, subtitle, display_order || 0, is_active || true, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Hero content not found' });
    }
    
    res.json({ 
      message: 'Hero content updated successfully',
      updated: true,
      videoUpdated: !!req.file
    });
  } catch (error) {
    console.error('❌ Error updating hero content:', error);
    
    // Clean up uploaded file if operation fails
    if (req.file) {
      fs.unlink(req.file.path, (unlinkErr) => {
        if (unlinkErr) console.error('Error deleting uploaded file:', unlinkErr);
      });
    }
    
    res.status(500).json({ error: 'Failed to update hero content' });
  }
});

// Delete hero content
router.delete('/hero-content/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'ID parameter is required' });
    }

    // First get the video URL to delete the file
    const [rows] = await pool.query('SELECT video_url FROM hero_content WHERE id = ?', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Hero content not found' });
    }

    const videoUrl = rows[0].video_url;
    
    // Delete the video file
    const videoPath = path.join(__dirname, '..', videoUrl);
    if (fs.existsSync(videoPath)) {
      fs.unlinkSync(videoPath);
    }

    // Delete from database
    const [result] = await pool.query('DELETE FROM hero_content WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Hero content not found' });
    }

    res.json({ message: 'Hero content deleted successfully' });
  } catch (error) {
    console.error('Error deleting hero content:', error);
    res.status(500).json({ error: 'Failed to delete hero content' });
  }
});

// Test upload endpoint
router.post('/test-upload', upload.single('video'), (req, res) => {
  console.log('🧪 TEST UPLOAD DEBUG:');
  console.log('Headers:', req.headers);
  console.log('Content-Type:', req.headers['content-type']);
  console.log('Body:', req.body);
  console.log('File received:', req.file);
  
  if (req.file) {
    console.log('✅ File upload successful!');
    console.log('File details:', {
      originalname: req.file.originalname,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
      path: req.file.path
    });
  } else {
    console.log('❌ No file received');
  }
  
  res.json({
    success: true,
    fileReceived: !!req.file,
    file: req.file ? {
      originalname: req.file.originalname,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
      path: req.file.path
    } : null,
    body: req.body
  });
});

module.exports = router;