


const express = require('express');
const router = express.Router();
const pool = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer
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
    cb(null, 'newgallery-' + uniqueSuffix + path.extname(file.originalname));
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

// GET all active images for public (from newgallery_images table ONLY)
router.get('/new-gallery-images', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    // Create newgallery_images table if not exists
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS newgallery_images (
        id INT AUTO_INCREMENT PRIMARY KEY,
        image_url VARCHAR(500) NOT NULL,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        display_order INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    const [rows] = await connection.execute(`
      SELECT * FROM newgallery_images 
      WHERE is_active = TRUE
      ORDER BY display_order ASC, uploaded_at DESC
    `);
    
    connection.release();
    
    const images = rows.map(image => ({
      id: image.id,
      image_url: image.image_url.startsWith('/uploads/') 
        ? `http://localhost:5000${image.image_url}`
        : image.image_url,
      title: image.title,
      description: image.description || '',
      display_order: image.display_order || 0,
      is_active: image.is_active,
      uploaded_at: image.uploaded_at
    }));
    
    res.json({ success: true, data: images });
    
  } catch (error) {
    if (connection) connection.release();
    console.error('Error fetching new gallery images:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// GET all images for admin (from newgallery_images table ONLY)
router.get('/admin/new-gallery-images', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const [rows] = await connection.execute(`
      SELECT * FROM newgallery_images 
      ORDER BY display_order ASC, uploaded_at DESC
    `);
    
    connection.release();
    
    const images = rows.map(image => ({
      id: image.id,
      image_url: image.image_url.startsWith('/uploads/') 
        ? `http://localhost:5000${image.image_url}`
        : image.image_url,
      title: image.title,
      description: image.description || '',
      display_order: image.display_order || 0,
      is_active: image.is_active,
      uploaded_at: image.uploaded_at
    }));
    
    res.json({ success: true, data: images });
    
  } catch (error) {
    if (connection) connection.release();
    console.error('Error fetching admin new gallery images:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// POST new image (to newgallery_images table ONLY)
router.post('/new-gallery-images', upload.single('image'), async (req, res) => {
  let connection;
  try {
    console.log('========== NEW GALLERY UPLOAD ==========');
    console.log('File received:', req.file);
    console.log('Body received:', req.body);
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded' });
    }

    const { title, description, display_order } = req.body;
    
    if (!title || title.trim() === '') {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }

    connection = await pool.getConnection();
    
    // Force create newgallery_images table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS newgallery_images (
        id INT AUTO_INCREMENT PRIMARY KEY,
        image_url VARCHAR(500) NOT NULL,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        display_order INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    const imageUrl = `/uploads/gallery/${req.file.filename}`;
    const displayOrder = parseInt(display_order) || 0;
    
    // INSERT INTO newgallery_images table
    const [result] = await connection.execute(
      `INSERT INTO newgallery_images (image_url, title, description, display_order) 
       VALUES (?, ?, ?, ?)`,
      [imageUrl, title, description || '', displayOrder]
    );
    
    console.log('✅ Inserted into newgallery_images table. ID:', result.insertId);
    console.log('Table used: newgallery_images');
    
    connection.release();
    
    res.json({
      success: true,
      message: 'Image uploaded successfully to NEW gallery table',
      data: { 
        id: result.insertId,
        imageUrl: `http://localhost:5000${imageUrl}` 
      }
    });
    
  } catch (error) {
    if (connection) connection.release();
    console.error('❌ Error uploading to new gallery:', error);
    res.status(500).json({ success: false, message: 'Error uploading image', error: error.message });
  }
});

// UPDATE image (in newgallery_images table ONLY)
router.put('/new-gallery-images/:id', upload.single('image'), async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { title, description, display_order, is_active } = req.body;
    
    if (!title || title.trim() === '') {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }

    connection = await pool.getConnection();
    
    const [existing] = await connection.execute('SELECT * FROM newgallery_images WHERE id = ?', [id]);
    if (existing.length === 0) {
      connection.release();
      return res.status(404).json({ success: false, message: 'Image not found in NEW gallery table' });
    }
    
    console.log('Updating image in newgallery_images table, ID:', id);
    
    if (req.file) {
      const imageUrl = `/uploads/gallery/${req.file.filename}`;
      const displayOrder = parseInt(display_order) || 0;
      const activeStatus = is_active === 'false' ? false : true;
      
      await connection.execute(
        `UPDATE newgallery_images 
         SET image_url = ?, title = ?, description = ?, display_order = ?, is_active = ? 
         WHERE id = ?`,
        [imageUrl, title, description || '', displayOrder, activeStatus, id]
      );
    } else {
      const displayOrder = parseInt(display_order) || 0;
      const activeStatus = is_active === 'false' ? false : true;
      
      await connection.execute(
        `UPDATE newgallery_images 
         SET title = ?, description = ?, display_order = ?, is_active = ? 
         WHERE id = ?`,
        [title, description || '', displayOrder, activeStatus, id]
      );
    }
    
    connection.release();
    res.json({ success: true, message: 'Image updated successfully in NEW gallery table' });
    
  } catch (error) {
    if (connection) connection.release();
    console.error('Error updating image in new gallery:', error);
    res.status(500).json({ success: false, message: 'Error updating image', error: error.message });
  }
});

// DELETE image (from newgallery_images table ONLY)
router.delete('/new-gallery-images/:id', async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    connection = await pool.getConnection();
    
    const [images] = await connection.execute('SELECT image_url FROM newgallery_images WHERE id = ?', [id]);
    if (images.length === 0) {
      connection.release();
      return res.status(404).json({ success: false, message: 'Image not found in NEW gallery table' });
    }
    
    console.log('Deleting from newgallery_images table, ID:', id);
    
    await connection.execute('DELETE FROM newgallery_images WHERE id = ?', [id]);
    connection.release();
    
    const image = images[0];
    if (image.image_url.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '..', image.image_url);
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (e) { console.error('Error deleting file:', e); }
      }
    }
    
    res.json({ success: true, message: 'Image deleted successfully from NEW gallery table' });
    
  } catch (error) {
    if (connection) connection.release();
    console.error('Error deleting image from new gallery:', error);
    res.status(500).json({ success: false, message: 'Error deleting image', error: error.message });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({ success: true, message: 'NEW Gallery API is healthy' });
});

module.exports = router;