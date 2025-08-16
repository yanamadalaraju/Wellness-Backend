const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const bcrypt = require("bcrypt");
const fs = require("fs");

const app = express();
const port = 5000;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const filetypes = /pdf|doc|docx|octet-stream/;
  const mimetype = filetypes.test(file.mimetype);
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  
  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Only PDF, DOC, and DOCX files are allowed'));
};

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter
});

// Middleware
// Update your CORS middleware to this:
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

// MySQL connection pool
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "wellness",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test database connection
pool.getConnection()
  .then(connection => {
    console.log("MySQL Connected");
    connection.release();
  })
  .catch(err => {
    console.error('Error connecting to MySQL:', err);
  });

// Careers endpoint with file upload
app.post('/api/careers', upload.single('resume'), async (req, res) => {
  try {
    const { name, email, phone, designation, message } = req.body;
    const resumePath = req.file ? req.file.path : null;

    // Validation
    if (!name || !email || !phone || !designation) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const sql = `
      INSERT INTO careers 
      (name, email, phone, designation, message, resume_path, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, NOW())
    `;

    const [result] = await pool.query(sql, [
      name, email, phone, designation, message, resumePath
    ]);

    res.json({ 
      message: 'Application submitted successfully', 
      id: result.insertId 
    });
  } catch (error) {
    console.error('Error saving career application:', error);
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: error.message || 'Failed to save application' });
  }
});

// Get all career applications
app.get('/api/careers', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM careers ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching careers:', err);
    res.status(500).json({ error: 'Failed to fetch career applications' });
  }
});

// Delete a career application
app.delete('/api/careers/:id', async (req, res) => {
  try {
    // First get the resume path to delete the file
    const [result] = await pool.query('SELECT resume_path FROM careers WHERE id = ?', [req.params.id]);
    
    if (result.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Delete the file if it exists
    if (result[0].resume_path) {
      try {
        fs.unlinkSync(path.join(__dirname, result[0].resume_path));
      } catch (err) {
        console.warn('Could not delete file:', err);
      }
    }

    // Delete from database
    const [deleteResult] = await pool.query('DELETE FROM careers WHERE id = ?', [req.params.id]);
    
    if (deleteResult.affectedRows === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    res.json({ message: 'Application deleted successfully' });
  } catch (err) {
    console.error('Error deleting application:', err);
    res.status(500).json({ error: 'Failed to delete application' });
  }
});

// Register endpoint
app.post("/api/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const sql = "INSERT INTO users (username, email, password) VALUES (?, ?, ?)";

    const [result] = await pool.query(sql, [username, email, hashed]);
    res.json({ message: "User registered successfully" });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: err.message || 'Registration failed' });
  }
});

// Login endpoint
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const sql = "SELECT * FROM users WHERE email = ?";
    const [results] = await pool.query(sql, [email]);
    
    if (results.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, results[0].password);
    if (!valid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Remove password from response
    const user = { ...results[0] };
    delete user.password;

    res.json({ message: "Login successful", user });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message || 'Login failed' });
  }
});

// Contact form endpoint
app.post('/api/contacts', async (req, res) => {
  try {
    const { name, email, phone, medicalConditions, applyingFrom, message } = req.body;
    
    if (!name || !email || !medicalConditions || !applyingFrom || !message) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const sql = `
      INSERT INTO contactss 
      (name, email, phone, medical_conditions, applying_from, message, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, NOW())
    `;

    const [result] = await pool.query(sql, 
      [name, email, phone, medicalConditions, applyingFrom, message]
    );

    res.json({ 
      message: 'Contact form submitted successfully', 
      id: result.insertId 
    });
  } catch (err) {
    console.error('Error saving contact:', err);
    res.status(500).json({ error: err.message || 'Failed to save contact' });
  }
});

// Get all contacts
app.get('/api/contacts', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM contactss ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching contacts:', err);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

// Delete a contact
app.delete('/api/contacts/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM contactss WHERE id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    
    res.json({ message: 'Contact deleted successfully' });
  } catch (err) {
    console.error('Error deleting contact:', err);
    res.status(500).json({ error: 'Failed to delete contact' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});