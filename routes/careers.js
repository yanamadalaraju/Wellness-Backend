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

// Submit career application
router.post('/careers', upload.single('resume'), async (req, res) => {
  try {
    const { name, email, phone, designation, message } = req.body;
    const resumePath = req.file ? `/uploads/${req.file.filename}` : null;

    const [result] = await pool.query(
      'INSERT INTO careers (name, email, phone, designation, message, resume_path) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, phone, designation, message, resumePath]
    );

    res.json({ message: 'Application submitted', id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all career applications
router.get('/careers', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM careers ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete career application
router.delete('/careers/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM careers WHERE id = ?', [req.params.id]);
    res.json({ message: 'Application deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Download resume
router.get('/careers/:id/resume', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [results] = await pool.query('SELECT * FROM careers WHERE id = ?', [id]);
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const application = results[0];
    
    if (!application.resume_path) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    // Remove the /uploads prefix if it exists in the path
    let filePath = application.resume_path;
    if (filePath.startsWith('/uploads/')) {
      filePath = filePath.replace('/uploads/', '');
    }

    const fullPath = path.join(uploadsDir, filePath);
    
    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'Resume file not found on server' });
    }

    // Set appropriate headers for download
    const filename = path.basename(application.resume_path);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    
    // Stream the file
    res.sendFile(fullPath);
  } catch (error) {
    console.error('Error serving resume:', error);
    res.status(500).json({ error: 'Failed to download resume' });
  }
});

module.exports = router;