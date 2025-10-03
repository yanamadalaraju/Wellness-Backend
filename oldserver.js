
// const express = require("express");
// const mysql = require("mysql2");
// const cors = require("cors");
// const bcrypt = require("bcrypt");

// const app = express();
// const port = 5000;

// app.use(cors());
// app.use(express.json());

// // MySQL connection
// const db = mysql.createConnection({
//   host: "localhost",
//   user: "root",
//   password: "",  // default for XAMPP
//   database: "wellness", // create this in phpMyAdmin
// });

// db.connect((err) => {
//   if (err) throw err;
//   console.log("MySQL Connected");
// });

// // Register endpoint
// app.post("/api/register", async (req, res) => {
//   const { username, email, password } = req.body;
//   const hashed = await bcrypt.hash(password, 10);
//   const sql = "INSERT INTO users (username, email, password) VALUES (?, ?, ?)";

//   db.query(sql, [username, email, hashed], (err, result) => {
//     if (err) return res.status(500).json({ error: err });
//     res.json({ message: "User registered successfully" });
//   });
// });

// // Login endpoint
// app.post("/api/login", (req, res) => {
//   const { email, password } = req.body;
//   const sql = "SELECT * FROM users WHERE email = ?";

//   db.query(sql, [email], async (err, results) => {
//     if (err) return res.status(500).json({ error: err });
//     if (results.length === 0) return res.status(401).json({ message: "User not found" });

//     const valid = await bcrypt.compare(password, results[0].password);
//     if (!valid) return res.status(401).json({ message: "Incorrect password" });

//     res.json({ message: "Login successful", user: results[0] });
//   });
// });

// // Add this to your server.js after your other endpoints
// app.post('/api/contacts', async (req, res) => {
//   const { name, email, phone, subject, message } = req.body;
  
//   // Basic validation
//   if (!name || !email || !subject || !message) {
//     return res.status(400).json({ error: 'Missing required fields' });
//   }

//   const sql = `
//     INSERT INTO contacts 
//     (name, email, phone, subject, message, created_at) 
//     VALUES (?, ?, ?, ?, ?, NOW())
//   `;

//   db.query(sql, [name, email, phone, subject, message], (err, result) => {
//     if (err) {
//       console.error('Error saving contact:', err);
//       return res.status(500).json({ error: 'Failed to save contact' });
//     }
//     res.json({ message: 'Contact form submitted successfully', id: result.insertId });
//   });
// });


// // Get all contacts
// app.get('/api/contacts', async (req, res) => {
//   try {
//     const [rows] = await db.promise().query('SELECT * FROM contacts ORDER BY created_at DESC');
//     res.json(rows);
//   } catch (err) {
//     console.error('Error fetching contacts:', err);
//     res.status(500).json({ error: 'Failed to fetch contacts' });
//   }
// });

// // Delete a contact
// app.delete('/api/contacts/:id', async (req, res) => {
//   try {
//     const [result] = await db.promise().query('DELETE FROM contacts WHERE id = ?', [req.params.id]);
//     if (result.affectedRows === 0) {
//       return res.status(404).json({ error: 'Contact not found' });
//     }
//     res.json({ message: 'Contact deleted successfully' });
//   } catch (err) {
//     console.error('Error deleting contact:', err);
//     res.status(500).json({ error: 'Failed to delete contact' });
//   }
// });


// app.listen(port, () => console.log(`Server running on http://localhost:${port}`));

//---------------------------------------------------------------------------------------------
// const express = require("express");
// const mysql = require("mysql2");
// const cors = require("cors");
// const bcrypt = require("bcrypt");

// const app = express();
// const port = 5000;

// app.use(cors());
// app.use(express.json());

// // MySQL connection
// const db = mysql.createConnection({
//   host: "localhost",
//   user: "root",
//   password: "",  // default for XAMPP
//   database: "wellness",
// });

// db.connect((err) => {
//   if (err) throw err;
//   console.log("MySQL Connected");
// });

// // Register endpoint
// app.post("/api/register", async (req, res) => {
//   const { username, email, password } = req.body;
//   const hashed = await bcrypt.hash(password, 10);
//   const sql = "INSERT INTO users (username, email, password) VALUES (?, ?, ?)";

//   db.query(sql, [username, email, hashed], (err, result) => {
//     if (err) return res.status(500).json({ error: err });
//     res.json({ message: "User registered successfully" });
//   });
// });

// // Login endpoint
// app.post("/api/login", (req, res) => {
//   const { email, password } = req.body;
//   const sql = "SELECT * FROM users WHERE email = ?";

//   db.query(sql, [email], async (err, results) => {
//     if (err) return res.status(500).json({ error: err });
//     if (results.length === 0) return res.status(401).json({ message: "User not found" });

//     const valid = await bcrypt.compare(password, results[0].password);
//     if (!valid) return res.status(401).json({ message: "Incorrect password" });

//     res.json({ message: "Login successful", user: results[0] });
//   });
// });

// // Contact form endpoint
// app.post('/api/contacts', async (req, res) => {
//   const { name, email, phone, medicalConditions, applyingFrom, message } = req.body;
  
//   // Basic validation
//   if (!name || !email || !medicalConditions || !applyingFrom || !message) {
//     return res.status(400).json({ error: 'Missing required fields' });
//   }

//   const sql = `
//     INSERT INTO contactss 
//     (name, email, phone, medical_conditions, applying_from, message, created_at) 
//     VALUES (?, ?, ?, ?, ?, ?, NOW())
//   `;

//   db.query(sql, 
//     [name, email, phone, medicalConditions, applyingFrom, message], 
//     (err, result) => {
//       if (err) {
//         console.error('Error saving contact:', err);
//         return res.status(500).json({ error: 'Failed to save contact' });
//       }
//       res.json({ 
//         message: 'Contact form submitted successfully', 
//         id: result.insertId 
//       });
//     }
//   );
// });

// // Get all contacts
// app.get('/api/contacts', async (req, res) => {
//   try {
//     const [rows] = await db.promise().query('SELECT * FROM contactss ORDER BY created_at DESC');
//     res.json(rows);
//   } catch (err) {
//     console.error('Error fetching contacts:', err);
//     res.status(500).json({ error: 'Failed to fetch contacts' });
//   }
// });

// // Delete a contact
// app.delete('/api/contacts/:id', async (req, res) => {
//   try {
//     const [result] = await db.promise().query('DELETE FROM contactss WHERE id = ?', [req.params.id]);
//     if (result.affectedRows === 0) {
//       return res.status(404).json({ error: 'Contact not found' });
//     }
//     res.json({ message: 'Contact deleted successfully' });
//   } catch (err) {
//     console.error('Error deleting contact:', err);
//     res.status(500).json({ error: 'Failed to delete contact' });
//   }
// });

// app.listen(port, () => console.log(`Server running on http://localhost:${port}`));

//----------------------------------------------------------------------------------------------
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
  const filetypes = /pdf|doc|docx/;
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
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'],
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
    
    if (!req.file) {
      return res.status(400).json({ error: 'Resume file is required' });
    }

    const resumeFilename = req.file.filename;

    // Validation
    if (!name || !email || !phone || !designation) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const sql = `
      INSERT INTO careers 
      (name, email, phone, designation, message, resume_path, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, NOW())
    `;

    const [result] = await pool.query(sql, [
      name, email, phone, designation, message, resumeFilename
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
    
    // Modify the response to include the full URL for each resume
    const applications = rows.map(app => ({
      ...app,
      resume_url: app.resume_path ? `${req.protocol}://${req.get('host')}/uploads/${app.resume_path}` : null
    }));
    
    res.json(applications);
  } catch (err) {
    console.error('Error fetching careers:', err);
    res.status(500).json({ error: 'Failed to fetch career applications' });
  }
});

// Download resume endpoint
app.get('/api/careers/:id/resume', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT resume_path FROM careers WHERE id = ?', [req.params.id]);
    
    if (rows.length === 0 || !rows[0].resume_path) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    const filePath = path.join(uploadsDir, rows[0].resume_path);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Resume file not found on server' });
    }

    // Set proper headers for file download
    res.download(filePath, rows[0].resume_path, (err) => {
      if (err) {
        console.error('Error sending file:', err);
        res.status(500).json({ error: 'Failed to download file' });
      }
    });
  } catch (err) {
    console.error('Error downloading resume:', err);
    res.status(500).json({ error: 'Failed to download resume' });
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
        const filePath = path.join(uploadsDir, result[0].resume_path);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
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

    // Validation
    if (!name || !email || !medicalConditions || !applyingFrom || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const sql = `
      INSERT INTO contacts 
      (name, email, phone, medical_conditions, applying_from, message, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, NOW())
    `;

    const [result] = await pool.query(sql, [
      name, 
      email, 
      phone || null, 
      medicalConditions, 
      applyingFrom, 
      message
    ]);

    res.status(201).json({
      success: true,
      message: 'Contact form submitted successfully',
      contactId: result.insertId
    });
  } catch (err) {
    console.error('Error submitting contact form:', err);
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Get all contacts
app.get('/api/contacts', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM contacts ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching contacts:', err);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

// Delete a contact
app.delete('/api/contacts/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM contacts WHERE id = ?', [req.params.id]);
    
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