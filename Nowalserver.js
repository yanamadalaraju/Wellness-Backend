const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcrypt');
const fs = require('fs');

const app = express();
const port = 5000;

// Create uploads directory
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware - SIMPLE CORS configuration
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

// Database connection
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'wellness',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection
pool.getConnection()
  .then(conn => {
    console.log('✅ MySQL Connected');
    conn.release();
  })
  .catch(err => {
    console.error('❌ MySQL Connection Failed:', err);
  });

// Simple multer configuration
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

// ===== ROUTES =====

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Alert Images Routes
app.get('/api/alert-image', async (req, res) => {
  try {
    const [results] = await pool.query(
      'SELECT * FROM alert_images WHERE is_active = true ORDER BY created_at DESC LIMIT 1'
    );
    res.json(results[0] || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/alert-images', async (req, res) => {
  try {
    const [results] = await pool.query('SELECT * FROM alert_images ORDER BY created_at DESC');
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/alert-image', upload.single('image'), async (req, res) => {
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

app.put('/api/alert-image/:id/status', async (req, res) => {
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

app.delete('/api/alert-image/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM alert_images WHERE id = ?', [id]);
    res.json({ message: 'Image deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Careers Routes
app.post('/api/careers', upload.single('resume'), async (req, res) => {
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

app.get('/api/careers', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM careers ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/careers/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM careers WHERE id = ?', [req.params.id]);
    res.json({ message: 'Application deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add this route after your existing careers routes
app.get('/api/careers/:id/resume', async (req, res) => {
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
// Auth Routes
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [result] = await pool.query(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );
    
    res.json({ message: 'User registered' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    
    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = users[0];
    const valid = await bcrypt.compare(password, user.password);
    
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json({ message: 'Login successful', user: userWithoutPassword });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Contact Routes
app.post('/api/contacts', async (req, res) => {
  try {
    const { name, email, phone, medicalConditions, applyingFrom, message } = req.body;
    
    const [result] = await pool.query(
      'INSERT INTO contactss (name, email, phone, medical_conditions, applying_from, message) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, phone, medicalConditions, applyingFrom, message]
    );

    res.json({ message: 'Contact submitted', id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/contacts', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM contactss ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/contacts/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM contactss WHERE id = ?', [req.params.id]);
    res.json({ message: 'Contact deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Nowal Nature Care API',
    version: '1.0.0'
  });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});