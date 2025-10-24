const express = require('express');
const router = express.Router();
const pool = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create gallery uploads directory
const galleryDir = path.join(__dirname, '../uploads/gallery');
if (!fs.existsSync(galleryDir)) {
  fs.mkdirSync(galleryDir, { recursive: true });
}

// Multer configuration for gallery images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/gallery/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'gallery-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Get all gallery images
router.get('/gallery-images', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT * FROM gallery_images 
      WHERE is_active = true 
      ORDER BY display_order ASC, created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching gallery images:', error);
    res.status(500).json({ error: 'Failed to fetch gallery images' });
  }
});

// Add new gallery image
router.post('/gallery-images', upload.single('image'), async (req, res) => {
  try {
    const { title, description, display_order } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required' });
    }

    const imageUrl = `/uploads/gallery/${req.file.filename}`;

    const [result] = await pool.query(
      'INSERT INTO gallery_images (image_url, title, description, display_order) VALUES (?, ?, ?, ?)',
      [imageUrl, title, description, display_order || 0]
    );

    res.status(201).json({
      message: 'Gallery image added successfully',
      id: result.insertId,
      imageUrl
    });
  } catch (error) {
    console.error('Error adding gallery image:', error);
    res.status(500).json({ error: 'Failed to add gallery image' });
  }
});

// Update gallery image
router.put('/gallery-images/:id', upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, display_order, is_active } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'ID parameter is required' });
    }

    let updateFields = [];
    let queryParams = [];

    if (title !== undefined) {
      updateFields.push('title = ?');
      queryParams.push(title);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      queryParams.push(description);
    }
    if (display_order !== undefined) {
      updateFields.push('display_order = ?');
      queryParams.push(display_order);
    }
    if (is_active !== undefined) {
      updateFields.push('is_active = ?');
      queryParams.push(is_active);
    }

    if (req.file) {
      const imageUrl = `/uploads/gallery/${req.file.filename}`;
      updateFields.push('image_url = ?');
      queryParams.push(imageUrl);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    queryParams.push(id);

    const updateQuery = `UPDATE gallery_images SET ${updateFields.join(', ')} WHERE id = ?`;

    const [result] = await pool.query(updateQuery, queryParams);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Gallery image not found' });
    }
    
    res.json({ 
      message: 'Gallery image updated successfully',
      updated: true,
      imageUpdated: !!req.file
    });
  } catch (error) {
    console.error('Error updating gallery image:', error);
    res.status(500).json({ error: 'Failed to update gallery image' });
  }
});

// Delete gallery image
router.delete('/gallery-images/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'ID parameter is required' });
    }

    const [result] = await pool.query('DELETE FROM gallery_images WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Gallery image not found' });
    }

    res.json({ message: 'Gallery image deleted successfully' });
  } catch (error) {
    console.error('Error deleting gallery image:', error);
    res.status(500).json({ error: 'Failed to delete gallery image' });
  }
});

module.exports = router;