// const express = require('express');
// const router = express.Router();
// const pool = require('../db');
// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');

// // Create gallery uploads directory
// const galleryDir = path.join(__dirname, '../uploads/gallery');
// if (!fs.existsSync(galleryDir)) {
//   fs.mkdirSync(galleryDir, { recursive: true });
// }

// // Multer configuration for gallery images
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'uploads/gallery/');
//   },
//   filename: (req, file, cb) => {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     cb(null, 'gallery-' + uniqueSuffix + path.extname(file.originalname));
//   }
// });

// const upload = multer({
//   storage: storage,
//   limits: {
//     fileSize: 10 * 1024 * 1024, // 10MB limit
//   },
//   fileFilter: (req, file, cb) => {
//     if (file.mimetype.startsWith('image/')) {
//       cb(null, true);
//     } else {
//       cb(new Error('Only image files are allowed!'), false);
//     }
//   }
// });

// // Get all gallery images
// router.get('/gallery-images', async (req, res) => {
//   try {
//     const [rows] = await pool.query(`
//       SELECT * FROM gallery_images 
//       WHERE is_active = true 
//       ORDER BY display_order ASC, created_at DESC
//     `);
//     res.json(rows);
//   } catch (error) {
//     console.error('Error fetching gallery images:', error);
//     res.status(500).json({ error: 'Failed to fetch gallery images' });
//   }
// });

// // Add new gallery image
// router.post('/gallery-images', upload.single('image'), async (req, res) => {
//   try {
//     const { title, description, display_order } = req.body;
    
//     if (!req.file) {
//       return res.status(400).json({ error: 'Image file is required' });
//     }

//     const imageUrl = `/uploads/gallery/${req.file.filename}`;

//     const [result] = await pool.query(
//       'INSERT INTO gallery_images (image_url, title, description, display_order) VALUES (?, ?, ?, ?)',
//       [imageUrl, title, description, display_order || 0]
//     );

//     res.status(201).json({
//       message: 'Gallery image added successfully',
//       id: result.insertId,
//       imageUrl
//     });
//   } catch (error) {
//     console.error('Error adding gallery image:', error);
//     res.status(500).json({ error: 'Failed to add gallery image' });
//   }
// });

// // Update gallery image
// router.put('/gallery-images/:id', upload.single('image'), async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { title, description, display_order, is_active } = req.body;

//     if (!id) {
//       return res.status(400).json({ error: 'ID parameter is required' });
//     }

//     let updateFields = [];
//     let queryParams = [];

//     if (title !== undefined) {
//       updateFields.push('title = ?');
//       queryParams.push(title);
//     }
//     if (description !== undefined) {
//       updateFields.push('description = ?');
//       queryParams.push(description);
//     }
//     if (display_order !== undefined) {
//       updateFields.push('display_order = ?');
//       queryParams.push(display_order);
//     }
//     if (is_active !== undefined) {
//       updateFields.push('is_active = ?');
//       queryParams.push(is_active);
//     }

//     if (req.file) {
//       const imageUrl = `/uploads/gallery/${req.file.filename}`;
//       updateFields.push('image_url = ?');
//       queryParams.push(imageUrl);
//     }

//     if (updateFields.length === 0) {
//       return res.status(400).json({ error: 'No fields to update' });
//     }

//     queryParams.push(id);

//     const updateQuery = `UPDATE gallery_images SET ${updateFields.join(', ')} WHERE id = ?`;

//     const [result] = await pool.query(updateQuery, queryParams);

//     if (result.affectedRows === 0) {
//       return res.status(404).json({ error: 'Gallery image not found' });
//     }
    
//     res.json({ 
//       message: 'Gallery image updated successfully',
//       updated: true,
//       imageUpdated: !!req.file
//     });
//   } catch (error) {
//     console.error('Error updating gallery image:', error);
//     res.status(500).json({ error: 'Failed to update gallery image' });
//   }
// });

// // Delete gallery image
// router.delete('/gallery-images/:id', async (req, res) => {
//   try {
//     const { id } = req.params;

//     if (!id) {
//       return res.status(400).json({ error: 'ID parameter is required' });
//     }

//     const [result] = await pool.query('DELETE FROM gallery_images WHERE id = ?', [id]);

//     if (result.affectedRows === 0) {
//       return res.status(404).json({ error: 'Gallery image not found' });
//     }

//     res.json({ message: 'Gallery image deleted successfully' });
//   } catch (error) {
//     console.error('Error deleting gallery image:', error);
//     res.status(500).json({ error: 'Failed to delete gallery image' });
//   }
// });

// module.exports = router;




const express = require('express');
const router = express.Router();
const pool = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads/gallery');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const originalName = path.parse(file.originalname).name.replace(/[^a-zA-Z0-9]/g, '-');
    cb(null, `gallery-${originalName}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
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

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 10MB'
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

// GET all gallery images
router.get('/gallery-images', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    // Check if table exists, create if not (WITHOUT display_order)
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS gallery_images (
        id INT AUTO_INCREMENT PRIMARY KEY,
        image_url VARCHAR(500) NOT NULL,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        category VARCHAR(50) NOT NULL,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    const [rows] = await connection.execute(`
      SELECT gi.*, gc.color 
      FROM gallery_images gi
      LEFT JOIN gallery_categories gc ON gi.category = gc.name
      ORDER BY gi.uploaded_at DESC
    `);
    
    connection.release();
    
    const images = rows.map(image => ({
      id: image.id,
      src: image.image_url.startsWith('/uploads/') 
        ? `http://localhost:5000${image.image_url}`
        : image.image_url,
      category: image.category,
      title: image.title,
      description: image.description || '',
      uploadedAt: image.uploaded_at
    }));
    
    res.json({
      success: true,
      data: images
    });
    
  } catch (error) {
    if (connection) connection.release();
    console.error('Error fetching gallery images:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// GET all categories with image counts
router.get('/gallery-categories', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    // Create gallery_categories table if it doesn't exist
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS gallery_categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        color VARCHAR(50) DEFAULT 'bg-emerald-500',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create gallery_images table WITHOUT display_order
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS gallery_images (
        id INT AUTO_INCREMENT PRIMARY KEY,
        image_url VARCHAR(500) NOT NULL,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        category VARCHAR(50) NOT NULL,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Insert default categories if they don't exist
    await connection.execute(`
      INSERT IGNORE INTO gallery_categories (name, color) VALUES 
        ('Weddings', 'bg-pink-500'),
        ('Events', 'bg-blue-500'),
        ('Decor', 'bg-purple-500'),
        ('Catering', 'bg-amber-500')
    `);
    
    // Now fetch categories with image counts
    const [categories] = await connection.execute(`
      SELECT 
        gc.*, 
        COUNT(gi.id) as imageCount
      FROM gallery_categories gc
      LEFT JOIN gallery_images gi ON gc.name = gi.category
      GROUP BY gc.id, gc.name, gc.color
      ORDER BY gc.name
    `);
    
    connection.release();
    
    res.json({
      success: true,
      data: categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        color: cat.color || 'bg-emerald-500',
        imageCount: parseInt(cat.imageCount) || 0
      }))
    });
    
  } catch (error) {
    if (connection) connection.release();
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// POST new gallery image - CORRECTED (NO display_order)
router.post('/gallery-images', upload.single('image'), handleMulterError, async (req, res) => {
  let connection;
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file uploaded'
      });
    }

    const { title, description, category } = req.body;
    
    if (!title || !category) {
      return res.status(400).json({
        success: false,
        message: 'Title and category are required'
      });
    }

    connection = await pool.getConnection();
    
    // Ensure tables exist (WITHOUT display_order)
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS gallery_images (
        id INT AUTO_INCREMENT PRIMARY KEY,
        image_url VARCHAR(500) NOT NULL,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        category VARCHAR(50) NOT NULL,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS gallery_categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        color VARCHAR(50) DEFAULT 'bg-emerald-500',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    const imageUrl = `/uploads/gallery/${req.file.filename}`;
    
    // CORRECTED INSERT STATEMENT - NO display_order
    await connection.execute(
      `INSERT INTO gallery_images 
        (image_url, title, description, category) 
       VALUES (?, ?, ?, ?)`,
      [imageUrl, title, description || '', category]
    );
    
    connection.release();
    
    res.json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        imageUrl: `http://localhost:5000${imageUrl}`
      }
    });
    
  } catch (error) {
    if (connection) connection.release();
    console.error('Error uploading gallery image:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading image',
      error: error.message
    });
  }
});

// DELETE multiple images
router.delete('/gallery-images/bulk', async (req, res) => {
  let connection;
  try {
    const { imageIds } = req.body;
    
    if (!imageIds || !Array.isArray(imageIds) || imageIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No images selected for deletion'
      });
    }

    connection = await pool.getConnection();
    
    // First get image URLs to delete files
    const placeholders = imageIds.map(() => '?').join(',');
    const [images] = await connection.execute(
      `SELECT image_url FROM gallery_images WHERE id IN (${placeholders})`,
      imageIds
    );
    
    // Delete from database
    await connection.execute(
      `DELETE FROM gallery_images WHERE id IN (${placeholders})`,
      imageIds
    );
    
    connection.release();
    
    // Delete files from server
    images.forEach(image => {
      if (image.image_url.startsWith('/uploads/')) {
        const filePath = path.join(__dirname, '..', image.image_url);
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch (fileError) {
            console.error('Error deleting file:', fileError);
          }
        }
      }
    });
    
    res.json({
      success: true,
      message: `${imageIds.length} image(s) deleted successfully`
    });
    
  } catch (error) {
    if (connection) connection.release();
    console.error('Error deleting images:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting images',
      error: error.message
    });
  }
});

// POST new category
router.post('/gallery-categories', async (req, res) => {
  let connection;
  try {
    const { name, color } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      });
    }

    connection = await pool.getConnection();
    
    // Create table if it doesn't exist
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS gallery_categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        color VARCHAR(50) DEFAULT 'bg-emerald-500',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Check if category already exists
    const [existing] = await connection.execute(
      'SELECT * FROM gallery_categories WHERE LOWER(name) = LOWER(?)',
      [name]
    );
    
    if (existing.length > 0) {
      connection.release();
      return res.status(400).json({
        success: false,
        message: 'Category already exists'
      });
    }
    
    await connection.execute(
      'INSERT INTO gallery_categories (name, color) VALUES (?, ?)',
      [name, color || 'bg-emerald-500']
    );
    
    connection.release();
    
    res.json({
      success: true,
      message: 'Category added successfully'
    });
    
  } catch (error) {
    if (connection) connection.release();
    console.error('Error adding category:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding category',
      error: error.message
    });
  }
});

// DELETE category
router.delete('/gallery-categories/:id', async (req, res) => {
  let connection;
  try {
    const { id } = req.params;

    connection = await pool.getConnection();
    
    await connection.execute(
      'DELETE FROM gallery_categories WHERE id = ?',
      [id]
    );
    
    connection.release();
    
    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
    
  } catch (error) {
    if (connection) connection.release();
    console.error('Error deleting category:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting category',
      error: error.message
    });
  }
});

module.exports = router;