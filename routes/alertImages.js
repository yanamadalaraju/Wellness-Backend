const express = require('express');
const router = express.Router();
const pool = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Get active alert image
router.get('/alert-image', async (req, res) => {
  try {
    const [results] = await pool.query(
      'SELECT * FROM alert_images WHERE is_active = true ORDER BY created_at DESC LIMIT 1'
    );
    res.json(results[0] || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all alert images
router.get('/alert-images', async (req, res) => {
  try {
    const [results] = await pool.query('SELECT * FROM alert_images ORDER BY created_at DESC');
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new alert image
router.post('/alert-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const { title, description } = req.body;
    const image_url = `/uploads/${req.file.filename}`;

    // Deactivate all images
    await pool.query('UPDATE alert_images SET is_active = false');
    
    // Insert new active image
    const [result] = await pool.query(
      'INSERT INTO alert_images (image_url, title, description, is_active) VALUES (?, ?, ?, true)',
      [image_url, title, description]
    );

    res.json({ 
      message: 'Image uploaded successfully',
      id: result.insertId,
      image_url 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update alert image status
router.put('/alert-image/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    if (is_active) {
      await pool.query('UPDATE alert_images SET is_active = false');
      await pool.query('UPDATE alert_images SET is_active = true WHERE id = ?', [id]);
      res.json({ message: 'Image activated' });
    } else {
      await pool.query('UPDATE alert_images SET is_active = false WHERE id = ?', [id]);
      res.json({ message: 'Image deactivated' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete alert image
router.delete('/alert-image/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM alert_images WHERE id = ?', [id]);
    res.json({ message: 'Image deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;