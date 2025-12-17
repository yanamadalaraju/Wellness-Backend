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
    cb(null, 'gallery-' + uniqueSuffix + path.extname(file.originalname));
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
    
    // Check if table exists, create if not
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS gallery_images (
        id INT AUTO_INCREMENT PRIMARY KEY,
        image_url VARCHAR(500) NOT NULL,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        category VARCHAR(50) NOT NULL,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_category (category)
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
    
    // Create gallery_images table if it doesn't exist
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS gallery_images (
        id INT AUTO_INCREMENT PRIMARY KEY,
        image_url VARCHAR(500) NOT NULL,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        category VARCHAR(50) NOT NULL,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_category (category)
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
      error: error.message,
      details: 'Table structure issue. Please check database.'
    });
  }
});

// POST new gallery image
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
    
    // Ensure tables exist
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS gallery_images (
        id INT AUTO_INCREMENT PRIMARY KEY,
        image_url VARCHAR(500) NOT NULL,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        category VARCHAR(50) NOT NULL,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_category (category)
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

// TEST endpoint to check database structure
router.get('/gallery-test', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    // Check gallery_images table structure
    const [imagesDesc] = await connection.execute('DESCRIBE gallery_images');
    
    // Check gallery_categories table structure
    const [categoriesDesc] = await connection.execute('DESCRIBE gallery_categories');
    
    // Get sample data
    const [images] = await connection.execute('SELECT * FROM gallery_images LIMIT 5');
    const [categories] = await connection.execute('SELECT * FROM gallery_categories');
    
    connection.release();
    
    res.json({
      success: true,
      data: {
        gallery_images_structure: imagesDesc,
        gallery_categories_structure: categoriesDesc,
        images_count: images.length,
        categories_count: categories.length,
        sample_images: images,
        categories: categories
      }
    });
    
  } catch (error) {
    if (connection) connection.release();
    res.json({
      success: false,
      message: 'Database test failed',
      error: error.message
    });
  }
});

module.exports = router;