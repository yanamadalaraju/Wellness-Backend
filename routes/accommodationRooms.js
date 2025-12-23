// routes/accommodationRooms.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../db'); // Adjust path to your database connection

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/rooms');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// GET all active rooms for frontend
router.get('/rooms', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM accommodation_rooms WHERE is_active = TRUE ORDER BY display_order ASC'
    );
    
    // Construct full image URLs
    const roomsWithFullUrls = rows.map(room => ({
      ...room,
      image_url: room.image_path ? `${req.protocol}://${req.get('host')}${room.image_path}` : null
    }));
    
    res.json({ success: true, rooms: roomsWithFullUrls });
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ success: false, message: 'Error fetching rooms' });
  }
});

// GET single room
router.get('/rooms/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM accommodation_rooms WHERE id = ?',
      [req.params.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }
    
    const room = rows[0];
    room.image_url = room.image_path ? `${req.protocol}://${req.get('host')}${room.image_path}` : null;
    
    res.json({ success: true, room });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching room' });
  }
});

// ADMIN: Create new room
router.post('/admin/rooms', upload.single('image'), async (req, res) => {
  try {
    const { name, description, display_order, is_active } = req.body;
    
    let imagePath = null;
    if (req.file) {
      imagePath = `/uploads/rooms/${req.file.filename}`;
    }
    
    const [result] = await pool.query(
      'INSERT INTO accommodation_rooms (name, image_path, description, display_order, is_active) VALUES (?, ?, ?, ?, ?)',
      [name, imagePath, description, display_order || 0, is_active !== 'false']
    );
    
    res.json({ 
      success: true, 
      message: 'Room created successfully',
      roomId: result.insertId 
    });
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ success: false, message: 'Error creating room' });
  }
});

// ADMIN: Update room
router.put('/admin/rooms/:id', upload.single('image'), async (req, res) => {
  try {
    const { name, description, display_order, is_active } = req.body;
    
    // Get existing room data
    const [existingRows] = await pool.query(
      'SELECT image_path FROM accommodation_rooms WHERE id = ?',
      [req.params.id]
    );
    
    if (existingRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }
    
    let imagePath = existingRows[0].image_path;
    
    // If new image uploaded
    if (req.file) {
      // Delete old image if exists
      if (imagePath && fs.existsSync(path.join(__dirname, '..', imagePath))) {
        fs.unlinkSync(path.join(__dirname, '..', imagePath));
      }
      imagePath = `/uploads/rooms/${req.file.filename}`;
    }
    
    await pool.query(
      'UPDATE accommodation_rooms SET name = ?, image_path = ?, description = ?, display_order = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, imagePath, description, display_order || 0, is_active !== 'false', req.params.id]
    );
    
    res.json({ success: true, message: 'Room updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating room' });
  }
});

// ADMIN: Delete room
router.delete('/admin/rooms/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT image_path FROM accommodation_rooms WHERE id = ?',
      [req.params.id]
    );
    
    if (rows.length > 0 && rows[0].image_path) {
      const imagePath = path.join(__dirname, '..', rows[0].image_path);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    await pool.query('DELETE FROM accommodation_rooms WHERE id = ?', [req.params.id]);
    
    res.json({ success: true, message: 'Room deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting room' });
  }
});

// ADMIN: Get all rooms (including inactive)
router.get('/admin/rooms', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM accommodation_rooms ORDER BY display_order ASC, created_at DESC'
    );
    
    const roomsWithFullUrls = rows.map(room => ({
      ...room,
      image_url: room.image_path ? `${req.protocol}://${req.get('host')}${room.image_path}` : null
    }));
    
    res.json({ success: true, rooms: roomsWithFullUrls });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching rooms' });
  }
});

module.exports = router;