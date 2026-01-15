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
    const [rooms] = await pool.query(
      'SELECT * FROM accommodation_rooms WHERE is_active = TRUE ORDER BY display_order ASC'
    );

    for (const room of rooms) {
      const [images] = await pool.query(
        'SELECT image_path FROM accommodation_room_images WHERE room_id = ?',
        [room.id]
      );

      room.images = images.map(img =>
        `${req.protocol}://${req.get('host')}${img.image_path}`
      );
    }

    res.json({ success: true, rooms });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error fetching rooms' });
  }
});

// GET single room
router.get('/admin/rooms', async (req, res) => {
  try {
    const [rooms] = await pool.query(
      `SELECT * FROM accommodation_rooms ORDER BY display_order ASC`
    );

    for (const room of rooms) {
      const [images] = await pool.query(
        `SELECT image_path FROM accommodation_room_images WHERE room_id = ?`,
        [room.id]
      );

      room.images = images.map(img =>
        `${req.protocol}://${req.get('host')}${img.image_path}`
      );
    }

    res.json({ success: true, rooms });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching rooms' });
  }
});

// ADMIN: Create new room
router.post('/admin/rooms', upload.array('images', 10), async (req, res) => {
  try {
    const { name, description, display_order, is_active } = req.body;

    // 1️⃣ Insert room first
    const [roomResult] = await pool.query(
      `INSERT INTO accommodation_rooms 
       (name, description, display_order, is_active) 
       VALUES (?, ?, ?, ?)`,
      [name, description, display_order || 0, is_active !== 'false']
    );

    const roomId = roomResult.insertId;

    // 2️⃣ Insert images
    if (req.files && req.files.length > 0) {
      const imageValues = req.files.map(file => ([
        roomId,
        `/uploads/rooms/${file.filename}`
      ]));

      await pool.query(
        `INSERT INTO accommodation_room_images (room_id, image_path) VALUES ?`,
        [imageValues]
      );
    }

    res.json({
      success: true,
      message: 'Room created successfully',
      roomId
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error creating room' });
  }
});


// ADMIN: Update room
router.put('/admin/rooms/:id', upload.array('images', 10), async (req, res) => {
  try {
    const { name, description, display_order, is_active } = req.body;
    const roomId = req.params.id;

    // 1️⃣ Check room exists
    const [roomRows] = await pool.query(
      'SELECT id FROM accommodation_rooms WHERE id = ?',
      [roomId]
    );

    if (roomRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // 2️⃣ Update room basic info
    await pool.query(
      `UPDATE accommodation_rooms 
       SET name = ?, description = ?, display_order = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [name, description, display_order || 0, is_active !== 'false', roomId]
    );

    // 3️⃣ Insert new images (append, don’t replace)
    if (req.files && req.files.length > 0) {
      const imageValues = req.files.map(file => ([
        roomId,
        `/uploads/rooms/${file.filename}`
      ]));

      await pool.query(
        `INSERT INTO accommodation_room_images (room_id, image_path)
         VALUES ?`,
        [imageValues]
      );
    }

    res.json({
      success: true,
      message: 'Room updated successfully'
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error updating room'
    });
  }
});


// ADMIN: Delete room (with all images)
router.delete('/admin/rooms/:id', async (req, res) => {
  try {
    const roomId = req.params.id;

    // 1️⃣ Fetch all images for this room
    const [images] = await pool.query(
      'SELECT image_path FROM accommodation_room_images WHERE room_id = ?',
      [roomId]
    );

    // 2️⃣ Delete image files from disk
    for (const img of images) {
      const filePath = path.join(__dirname, '..', img.image_path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // 3️⃣ Delete image records
    await pool.query(
      'DELETE FROM accommodation_room_images WHERE room_id = ?',
      [roomId]
    );

    // 4️⃣ Delete room
    const [result] = await pool.query(
      'DELETE FROM accommodation_rooms WHERE id = ?',
      [roomId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    res.json({
      success: true,
      message: 'Room and all images deleted successfully'
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error deleting room'
    });
  }
});



// ADMIN: Get all rooms (including inactive) with images
router.get('/admin/rooms', async (req, res) => {
  try {
    const [rooms] = await pool.query(
      'SELECT * FROM accommodation_rooms ORDER BY display_order ASC, created_at DESC'
    );

    for (const room of rooms) {
      const [images] = await pool.query(
        'SELECT image_path FROM accommodation_room_images WHERE room_id = ?',
        [room.id]
      );

      room.images = images.map(img =>
        `${req.protocol}://${req.get('host')}${img.image_path}`
      );
    }

    res.json({
      success: true,
      rooms
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error fetching rooms'
    });
  }
});


module.exports = router;