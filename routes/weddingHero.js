// const express = require('express');
// const router = express.Router();
// const pool = require('../db');
// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');

// // Configure multer for image upload
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     const uploadPath = path.join(__dirname, '../uploads/wedding-hero');
//     if (!fs.existsSync(uploadPath)) {
//       fs.mkdirSync(uploadPath, { recursive: true });
//     }
//     cb(null, uploadPath);
//   },
//   filename: function (req, file, cb) {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     cb(null, 'hero-' + uniqueSuffix + path.extname(file.originalname));
//   }
// });

// const upload = multer({
//   storage: storage,
//   limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
//   fileFilter: function (req, file, cb) {
//     const filetypes = /jpeg|jpg|png|gif|webp/;
//     const mimetype = filetypes.test(file.mimetype);
//     const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

//     if (mimetype && extname) {
//       return cb(null, true);
//     }
//     cb(new Error('Only image files are allowed!'));
//   }
// });

// // Error handling middleware for multer
// const handleMulterError = (err, req, res, next) => {
//   if (err instanceof multer.MulterError) {
//     if (err.code === 'LIMIT_FILE_SIZE') {
//       return res.status(400).json({
//         success: false,
//         message: 'File size too large. Maximum size is 5MB'
//       });
//     }
//   } else if (err) {
//     return res.status(400).json({
//       success: false,
//       message: err.message
//     });
//   }
//   next();
// };

// // GET hero section data
// router.get('/wedding-hero', async (req, res) => {
//   try {
//     const connection = await pool.getConnection();
    
//     // Get hero data
//     const [heroRows] = await connection.execute(
//       'SELECT * FROM wedding_hero ORDER BY created_at DESC LIMIT 1'
//     );
    
//     if (heroRows.length === 0) {
//       connection.release();
//       return res.json({
//         success: true,
//         data: null
//       });
//     }
    
//     const heroData = heroRows[0];
    
//     // Get stats
//     const [statsRows] = await connection.execute(
//       'SELECT * FROM wedding_stats WHERE hero_id = ? ORDER BY id',
//       [heroData.id]
//     );
    
//     connection.release();
    
//     const stats = statsRows.map(stat => ({
//       number: stat.stat_number,
//       label: stat.stat_label
//     }));
    
//     res.json({
//       success: true,
//       data: {
//         backgroundImage: heroData.background_image,
//         titleLine1: heroData.title_line1,
//         titleLine2: heroData.title_line2,
//         subtitle: heroData.subtitle,
//         buttonText: heroData.button_text,
//         stats: stats,
//         floatingIcons: Boolean(heroData.floating_icons),
//         animatedElements: Boolean(heroData.animated_elements)
//       }
//     });
    
//   } catch (error) {
//     console.error('Error fetching wedding hero:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message
//     });
//   }
// });

// // UPDATE hero section data
// router.put('/wedding-hero', upload.single('backgroundImage'), handleMulterError, async (req, res) => {
//   let connection;
//   try {
//     connection = await pool.getConnection();
//     await connection.beginTransaction();
    
//     const {
//       titleLine1,
//       titleLine2,
//       subtitle,
//       buttonText,
//       floatingIcons,
//       animatedElements,
//       stats
//     } = req.body;
    
//     let backgroundImageUrl = req.body.backgroundImage;
    
//     // Handle file upload - if file is uploaded, use its URL
//     if (req.file) {
//       backgroundImageUrl = `/uploads/wedding-hero/${req.file.filename}`;
//     }
    
//     // Check if hero data exists
//     const [existingRows] = await connection.execute(
//       'SELECT * FROM wedding_hero ORDER BY created_at DESC LIMIT 1'
//     );
    
//     let heroId;
    
//     if (existingRows.length > 0) {
//       // Update existing record
//       await connection.execute(
//         `UPDATE wedding_hero SET 
//           background_image = COALESCE(?, background_image),
//           title_line1 = ?,
//           title_line2 = ?,
//           subtitle = ?,
//           button_text = ?,
//           floating_icons = ?,
//           animated_elements = ?,
//           updated_at = CURRENT_TIMESTAMP
//         WHERE id = ?`,
//         [
//           backgroundImageUrl || null,
//           titleLine1,
//           titleLine2,
//           subtitle,
//           buttonText,
//           floatingIcons === 'true',
//           animatedElements === 'true',
//           existingRows[0].id
//         ]
//       );
      
//       heroId = existingRows[0].id;
      
//       // Delete existing stats
//       await connection.execute(
//         'DELETE FROM wedding_stats WHERE hero_id = ?',
//         [heroId]
//       );
      
//     } else {
//       // Insert new record
//       const [insertResult] = await connection.execute(
//         `INSERT INTO wedding_hero 
//           (background_image, title_line1, title_line2, subtitle, button_text, floating_icons, animated_elements) 
//          VALUES (?, ?, ?, ?, ?, ?, ?)`,
//         [
//           backgroundImageUrl,
//           titleLine1,
//           titleLine2,
//           subtitle,
//           buttonText,
//           floatingIcons === 'true',
//           animatedElements === 'true'
//         ]
//       );
      
//       heroId = insertResult.insertId;
//     }
    
//     // Insert new stats
//     if (stats) {
//       try {
//         const statsArray = JSON.parse(stats);
//         for (const stat of statsArray) {
//           if (stat.number && stat.label) {
//             await connection.execute(
//               'INSERT INTO wedding_stats (hero_id, stat_number, stat_label) VALUES (?, ?, ?)',
//               [heroId, stat.number, stat.label]
//             );
//           }
//         }
//       } catch (parseError) {
//         console.error('Error parsing stats:', parseError);
//         // Continue without stats if parsing fails
//       }
//     }
    
//     await connection.commit();
//     connection.release();
    
//     res.json({
//       success: true,
//       message: 'Wedding hero section updated successfully'
//     });
    
//   } catch (error) {
//     if (connection) {
//       await connection.rollback();
//       connection.release();
//     }
    
//     console.error('Error updating wedding hero:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error updating wedding hero section',
//       error: error.message
//     });
//   }
// });

// // RESET to default
// router.post('/wedding-hero/reset', async (req, res) => {
//   let connection;
//   try {
//     connection = await pool.getConnection();
//     await connection.beginTransaction();
    
//     // Delete existing data
//     await connection.execute('DELETE FROM wedding_stats');
//     await connection.execute('DELETE FROM wedding_hero');
    
//     // Insert default data
//     const [heroResult] = await connection.execute(
//       `INSERT INTO wedding_hero 
//         (background_image, title_line1, title_line2, subtitle, button_text, floating_icons, animated_elements) 
//        VALUES (?, ?, ?, ?, ?, ?, ?)`,
//       [
//         'https://i.pinimg.com/1200x/a2/53/fc/a253fc965d6bcff7b014d412770e7ab8.jpg',
//         'Forever',
//         'Starts Here',
//         'Crafting unforgettable moments and timeless memories for your perfect day',
//         'View Gallery',
//         true,
//         true
//       ]
//     );
    
//     const heroId = heroResult.insertId;
    
//     // Insert default stats
//     const defaultStats = [
//       { number: '500+', label: 'Weddings' },
//       { number: '98%', label: 'Satisfaction' },
//       { number: '50+', label: 'Awards' },
//       { number: '24/7', label: 'Support' }
//     ];
    
//     for (const stat of defaultStats) {
//       await connection.execute(
//         'INSERT INTO wedding_stats (hero_id, stat_number, stat_label) VALUES (?, ?, ?)',
//         [heroId, stat.number, stat.label]
//       );
//     }
    
//     await connection.commit();
//     connection.release();
    
//     res.json({
//       success: true,
//       message: 'Wedding hero section reset to default'
//     });
    
//   } catch (error) {
//     if (connection) {
//       await connection.rollback();
//       connection.release();
//     }
    
//     console.error('Error resetting wedding hero:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error resetting wedding hero section',
//       error: error.message
//     });
//   }
// });

// module.exports = router;





// // routes/weddingHero.js - BACKEND ONLY
// const express = require('express');
// const router = express.Router();
// const pool = require('../db');
// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');

// // Configure multer for image upload
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     const uploadPath = path.join(__dirname, '../uploads/wedding-hero');
//     if (!fs.existsSync(uploadPath)) {
//       fs.mkdirSync(uploadPath, { recursive: true });
//     }
//     cb(null, uploadPath);
//   },
//   filename: function (req, file, cb) {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     cb(null, 'hero-' + uniqueSuffix + path.extname(file.originalname));
//   }
// });

// const upload = multer({
//   storage: storage,
//   limits: { fileSize: 5 * 1024 * 1024 },
//   fileFilter: function (req, file, cb) {
//     const filetypes = /jpeg|jpg|png|gif|webp/;
//     const mimetype = filetypes.test(file.mimetype);
//     const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

//     if (mimetype && extname) {
//       return cb(null, true);
//     }
//     cb(new Error('Only image files are allowed!'));
//   }
// });

// // Error handling middleware for multer
// const handleMulterError = (err, req, res, next) => {
//   if (err instanceof multer.MulterError) {
//     if (err.code === 'LIMIT_FILE_SIZE') {
//       return res.status(400).json({
//         success: false,
//         message: 'File size too large. Maximum size is 5MB'
//       });
//     }
//   } else if (err) {
//     return res.status(400).json({
//       success: false,
//       message: err.message
//     });
//   }
//   next();
// };

// // GET wedding hero section data
// router.get('/wedding-hero', async (req, res) => {
//   try {
//     const connection = await pool.getConnection();
    
//     const [heroRows] = await connection.execute(
//       'SELECT * FROM wedding_hero ORDER BY created_at DESC LIMIT 1'
//     );
    
//     if (heroRows.length === 0) {
//       connection.release();
//       return res.json({
//         success: true,
//         data: null
//       });
//     }
    
//     const heroData = heroRows[0];
    
//     const [statsRows] = await connection.execute(
//       'SELECT * FROM wedding_stats WHERE hero_id = ? ORDER BY id',
//       [heroData.id]
//     );
    
//     connection.release();
    
//     const stats = statsRows.map(stat => ({
//       number: stat.stat_number,
//       label: stat.stat_label
//     }));
    
//     res.json({
//       success: true,
//       data: {
//         backgroundImage: heroData.background_image,
//         titleLine1: heroData.title_line1,
//         titleLine2: heroData.title_line2,
//         subtitle: heroData.subtitle,
//         buttonText: heroData.button_text,
//         stats: stats,
//         floatingIcons: Boolean(heroData.floating_icons),
//         animatedElements: Boolean(heroData.animated_elements)
//       }
//     });
    
//   } catch (error) {
//     console.error('Error fetching wedding hero:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message
//     });
//   }
// });

// // UPDATE wedding hero section
// router.put('/wedding-hero', upload.single('backgroundImage'), handleMulterError, async (req, res) => {
//   let connection;
//   try {
//     connection = await pool.getConnection();
//     await connection.beginTransaction();
    
//     const {
//       titleLine1,
//       titleLine2,
//       subtitle,
//       buttonText,
//       floatingIcons,
//       animatedElements,
//       stats
//     } = req.body;
    
//     let backgroundImageUrl = req.body.backgroundImage;
    
//     if (req.file) {
//       backgroundImageUrl = `/uploads/wedding-hero/${req.file.filename}`;
//     }
    
//     const [existingRows] = await connection.execute(
//       'SELECT * FROM wedding_hero ORDER BY created_at DESC LIMIT 1'
//     );
    
//     let heroId;
    
//     if (existingRows.length > 0) {
//       await connection.execute(
//         `UPDATE wedding_hero SET 
//           background_image = COALESCE(?, background_image),
//           title_line1 = ?,
//           title_line2 = ?,
//           subtitle = ?,
//           button_text = ?,
//           floating_icons = ?,
//           animated_elements = ?,
//           updated_at = CURRENT_TIMESTAMP
//         WHERE id = ?`,
//         [
//           backgroundImageUrl || null,
//           titleLine1,
//           titleLine2,
//           subtitle,
//           buttonText,
//           floatingIcons === 'true',
//           animatedElements === 'true',
//           existingRows[0].id
//         ]
//       );
      
//       heroId = existingRows[0].id;
      
//       await connection.execute(
//         'DELETE FROM wedding_stats WHERE hero_id = ?',
//         [heroId]
//       );
      
//     } else {
//       const [insertResult] = await connection.execute(
//         `INSERT INTO wedding_hero 
//           (background_image, title_line1, title_line2, subtitle, button_text, floating_icons, animated_elements) 
//          VALUES (?, ?, ?, ?, ?, ?, ?)`,
//         [
//           backgroundImageUrl,
//           titleLine1,
//           titleLine2,
//           subtitle,
//           buttonText,
//           floatingIcons === 'true',
//           animatedElements === 'true'
//         ]
//       );
      
//       heroId = insertResult.insertId;
//     }
    
//     if (stats) {
//       try {
//         const statsArray = JSON.parse(stats);
//         for (const stat of statsArray) {
//           if (stat.number && stat.label) {
//             await connection.execute(
//               'INSERT INTO wedding_stats (hero_id, stat_number, stat_label) VALUES (?, ?, ?)',
//               [heroId, stat.number, stat.label]
//             );
//           }
//         }
//       } catch (parseError) {
//         console.error('Error parsing stats:', parseError);
//       }
//     }
    
//     await connection.commit();
//     connection.release();
    
//     res.json({
//       success: true,
//       message: 'Wedding hero section updated successfully'
//     });
    
//   } catch (error) {
//     if (connection) {
//       await connection.rollback();
//       connection.release();
//     }
    
//     console.error('Error updating wedding hero:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error updating wedding hero section',
//       error: error.message
//     });
//   }
// });

// // RESET wedding hero to default
// router.post('/wedding-hero/reset', async (req, res) => {
//   let connection;
//   try {
//     connection = await pool.getConnection();
//     await connection.beginTransaction();
    
//     await connection.execute('DELETE FROM wedding_stats');
//     await connection.execute('DELETE FROM wedding_hero');
    
//     const [heroResult] = await connection.execute(
//       `INSERT INTO wedding_hero 
//         (background_image, title_line1, title_line2, subtitle, button_text, floating_icons, animated_elements) 
//        VALUES (?, ?, ?, ?, ?, ?, ?)`,
//       [
//         'https://i.pinimg.com/1200x/a2/53/fc/a253fc965d6bcff7b014d412770e7ab8.jpg',
//         'Forever',
//         'Starts Here',
//         'Crafting unforgettable moments and timeless memories for your perfect day',
//         'View Gallery',
//         true,
//         true
//       ]
//     );
    
//     const heroId = heroResult.insertId;
    
//     const defaultStats = [
//       { number: '500+', label: 'Weddings' },
//       { number: '98%', label: 'Satisfaction' },
//       { number: '50+', label: 'Awards' },
//       { number: '24/7', label: 'Support' }
//     ];
    
//     for (const stat of defaultStats) {
//       await connection.execute(
//         'INSERT INTO wedding_stats (hero_id, stat_number, stat_label) VALUES (?, ?, ?)',
//         [heroId, stat.number, stat.label]
//       );
//     }
    
//     await connection.commit();
//     connection.release();
    
//     res.json({
//       success: true,
//       message: 'Wedding hero section reset to default'
//     });
    
//   } catch (error) {
//     if (connection) {
//       await connection.rollback();
//       connection.release();
//     }
    
//     console.error('Error resetting wedding hero:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error resetting wedding hero section',
//       error: error.message
//     });
//   }
// });

// module.exports = router;





// routes/weddingHero.js - Updated

const express = require('express');
const router = express.Router();
const pool = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads/wedding-hero');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'hero-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
  }
});

// Error handling middleware
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 5MB'
      });
    }
  } else if (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  next();
};

// GET hero section - FIXED with proper URL construction
router.get('/wedding-hero', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    const [heroRows] = await connection.execute(
      'SELECT * FROM wedding_hero ORDER BY created_at DESC LIMIT 1'
    );
    
    let heroData = null;
    if (heroRows.length > 0) {
      const [statsRows] = await connection.execute(
        'SELECT * FROM wedding_stats WHERE hero_id = ? ORDER BY id',
        [heroRows[0].id]
      );
      
      const stats = statsRows.map(stat => ({
        number: stat.stat_number,
        label: stat.stat_label
      }));
      
      // Construct proper URL for the image
      let backgroundImageUrl = heroRows[0].background_image;
      
      // If it's a local upload, prepend with the correct URL
      if (backgroundImageUrl && backgroundImageUrl.startsWith('/uploads/')) {
        backgroundImageUrl = `http://localhost:5000${backgroundImageUrl}`;
      }
      
      // Ensure we always have a valid image URL
      if (!backgroundImageUrl || backgroundImageUrl === '') {
        backgroundImageUrl = 'https://i.pinimg.com/1200x/a2/53/fc/a253fc965d6bcff7b014d412770e7ab8.jpg';
      }
      
      heroData = {
        backgroundImage: backgroundImageUrl,
        titleLine1: heroRows[0].title_line1 || 'Forever',
        titleLine2: heroRows[0].title_line2 || 'Starts Here',
        subtitle: heroRows[0].subtitle || 'Crafting unforgettable moments and timeless memories for your perfect day',
        buttonText: heroRows[0].button_text || 'View Gallery',
        stats: stats.length > 0 ? stats : defaultHeroContent.stats,
        floatingIcons: Boolean(heroRows[0].floating_icons),
        animatedElements: Boolean(heroRows[0].animated_elements)
      };
    }
    
    connection.release();
    
    res.json({
      success: true,
      data: heroData
    });
    
  } catch (error) {
    console.error('Error fetching wedding hero content:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Default hero content for fallback
const defaultHeroContent = {
  backgroundImage: "https://i.pinimg.com/1200x/a2/53/fc/a253fc965d6bcff7b014d412770e7ab8.jpg",
  titleLine1: "Forever",
  titleLine2: "Starts Here",
  subtitle: "Crafting unforgettable moments and timeless memories for your perfect day",
  buttonText: "View Gallery",
  stats: [
    { number: "500+", label: "Weddings" },
    { number: "98%", label: "Satisfaction" },
    { number: "50+", label: "Awards" },
    { number: "24/7", label: "Support" }
  ],
  floatingIcons: true,
  animatedElements: true
};

// UPDATE hero section
router.put('/wedding-hero', upload.single('backgroundImage'), handleMulterError, async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    const {
      titleLine1,
      titleLine2,
      subtitle,
      buttonText,
      stats,
      floatingIcons,
      animatedElements,
      backgroundImage // This might be a URL if no new file uploaded
    } = req.body;
    
    const [existingHeroRows] = await connection.execute(
      'SELECT * FROM wedding_hero ORDER BY created_at DESC LIMIT 1'
    );
    
    let heroId;
    let backgroundImageUrl;
    
    // Handle image upload
    if (req.file) {
      // New file uploaded
      backgroundImageUrl = `/uploads/wedding-hero/${req.file.filename}`;
    } else if (backgroundImage && (backgroundImage.startsWith('http') || backgroundImage.startsWith('/uploads/'))) {
      // Keep existing URL from request body
      backgroundImageUrl = backgroundImage;
    } else if (existingHeroRows.length > 0) {
      // Keep existing image from database
      backgroundImageUrl = existingHeroRows[0].background_image;
    } else {
      // Use default image
      backgroundImageUrl = 'https://i.pinimg.com/1200x/a2/53/fc/a253fc965d6bcff7b014d412770e7ab8.jpg';
    }
    
    if (existingHeroRows.length > 0) {
      heroId = existingHeroRows[0].id;
      
      await connection.execute(
        `UPDATE wedding_hero SET 
          background_image = ?,
          title_line1 = ?,
          title_line2 = ?,
          subtitle = ?,
          button_text = ?,
          floating_icons = ?,
          animated_elements = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
        [
          backgroundImageUrl,
          titleLine1 || 'Forever',
          titleLine2 || 'Starts Here',
          subtitle || 'Crafting unforgettable moments and timeless memories for your perfect day',
          buttonText || 'View Gallery',
          floatingIcons === 'true',
          animatedElements === 'true',
          heroId
        ]
      );
    } else {
      const [heroResult] = await connection.execute(
        `INSERT INTO wedding_hero 
          (background_image, title_line1, title_line2, subtitle, button_text, floating_icons, animated_elements) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          backgroundImageUrl,
          titleLine1 || 'Forever',
          titleLine2 || 'Starts Here',
          subtitle || 'Crafting unforgettable moments and timeless memories for your perfect day',
          buttonText || 'View Gallery',
          floatingIcons === 'true',
          animatedElements === 'true'
        ]
      );
      
      heroId = heroResult.insertId;
    }
    
    // Update stats
    await connection.execute('DELETE FROM wedding_stats WHERE hero_id = ?', [heroId]);
    
    if (stats) {
      let statsArray;
      try {
        statsArray = JSON.parse(stats);
      } catch (e) {
        statsArray = defaultHeroContent.stats;
      }
      
      for (const stat of statsArray) {
        if (stat.number && stat.label) {
          await connection.execute(
            'INSERT INTO wedding_stats (hero_id, stat_number, stat_label) VALUES (?, ?, ?)',
            [heroId, stat.number, stat.label]
          );
        }
      }
    }
    
    await connection.commit();
    connection.release();
    
    res.json({
      success: true,
      message: 'Hero section updated successfully',
      data: {
        backgroundImage: backgroundImageUrl.startsWith('/uploads/') 
          ? `http://localhost:5000${backgroundImageUrl}`
          : backgroundImageUrl,
        titleLine1,
        titleLine2,
        subtitle,
        buttonText
      }
    });
    
  } catch (error) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    
    console.error('Error updating hero section:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating hero section',
      error: error.message
    });
  }
});

// RESET hero section to default
router.post('/wedding-hero/reset', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    await connection.execute('DELETE FROM wedding_stats');
    await connection.execute('DELETE FROM wedding_hero');
    
    const [heroResult] = await connection.execute(
      `INSERT INTO wedding_hero 
        (background_image, title_line1, title_line2, subtitle, button_text, floating_icons, animated_elements) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        'https://i.pinimg.com/1200x/a2/53/fc/a253fc965d6bcff7b014d412770e7ab8.jpg',
        'Forever',
        'Starts Here',
        'Crafting unforgettable moments and timeless memories for your perfect day',
        'View Gallery',
        true,
        true
      ]
    );
    
    const heroId = heroResult.insertId;
    
    const defaultStats = [
      { number: '500+', label: 'Weddings' },
      { number: '98%', label: 'Satisfaction' },
      { number: '50+', label: 'Awards' },
      { number: '24/7', label: 'Support' }
    ];
    
    for (const stat of defaultStats) {
      await connection.execute(
        'INSERT INTO wedding_stats (hero_id, stat_number, stat_label) VALUES (?, ?, ?)',
        [heroId, stat.number, stat.label]
      );
    }
    
    await connection.commit();
    connection.release();
    
    res.json({
      success: true,
      message: 'Hero section reset to default successfully',
      data: defaultHeroContent
    });
    
  } catch (error) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    
    console.error('Error resetting hero section:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting hero section',
      error: error.message
    });
  }
});

module.exports = router;