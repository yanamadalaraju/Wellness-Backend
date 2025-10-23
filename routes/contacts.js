// const express = require('express');
// const router = express.Router();
// const pool = require('../db');

// // Submit contact form
// router.post('/contacts', async (req, res) => {
//   try {
//     const { name, email, phone, medicalConditions, applyingFrom, message } = req.body;
    
//     const [result] = await pool.query(
//       'INSERT INTO contactss (name, email, phone, medical_conditions, applying_from, message) VALUES (?, ?, ?, ?, ?, ?)',
//       [name, email, phone, medicalConditions, applyingFrom, message]
//     );

//     res.json({ message: 'Contact submitted', id: result.insertId });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// // Get all contacts
// router.get('/contacts', async (req, res) => {
//   try {
//     const [rows] = await pool.query('SELECT * FROM contactss ORDER BY created_at DESC');
//     res.json(rows);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// // Delete contact
// router.delete('/contacts/:id', async (req, res) => {
//   try {
//     await pool.query('DELETE FROM contactss WHERE id = ?', [req.params.id]);
//     res.json({ message: 'Contact deleted' });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// module.exports = router;


const express = require('express');
const router = express.Router();
const pool = require('../db');

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'OK', database: 'Connected' });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ status: 'Error', database: 'Disconnected', error: error.message });
  }
});

// Submit contact form
router.post('/contacts', async (req, res) => {
  console.log('📨 Received contact form submission:', req.body);
  
  try {
    const { name, email, phone } = req.body;
    
    // Validation
    if (!name || !email || !phone) {
      console.log('❌ Validation failed - missing fields');
      return res.status(400).json({ 
        error: 'All fields are required',
        received: { name, email, phone }
      });
    }

    console.log('💾 Attempting to insert into database...');
    
    // Check if the table has the old structure or new structure
    try {
      // Try inserting with only the three fields (if table has been altered)
      const [result] = await pool.query(
        'INSERT INTO contacts (name, email, phone) VALUES (?, ?, ?)',
        [name, email, phone]
      );
      
      console.log('✅ Database insert successful, ID:', result.insertId);
      res.status(201).json({ 
        message: 'Contact form submitted successfully', 
        id: result.insertId 
      });
      
    } catch (dbError) {
      // If that fails, try with the old structure
      if (dbError.code === 'ER_BAD_FIELD_ERROR') {
        console.log('🔄 Using old table structure with additional columns');
        const [result] = await pool.query(
          'INSERT INTO contacts (name, email, phone, medical_conditions, applying_from, message) VALUES (?, ?, ?, ?, ?, ?)',
          [name, email, phone, '', '', '']
        );
        
        console.log('✅ Database insert successful, ID:', result.insertId);
        res.status(201).json({ 
          message: 'Contact form submitted successfully', 
          id: result.insertId 
        });
      } else {
        throw dbError;
      }
    }
    
  } catch (error) {
    console.error('💥 Database error:', error);
    res.status(500).json({ 
      error: 'Failed to submit contact form',
      details: error.message 
    });
  }
});

// Get all contacts
router.get('/contacts', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name, email, phone, created_at FROM contacts ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

// Delete contact
router.delete('/contacts/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM contacts WHERE id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    
    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Failed to delete contact' });
  }
});

module.exports = router;