const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 5000;

// Import routes
const alertImagesRoutes = require('./routes/alertImages');
const careersRoutes = require('./routes/careers');
const authRoutes = require('./routes/auth');
const contactsRoutes = require('./routes/contacts');
const heroRoutes = require('./routes/heroRoutes');
const galleryImagesRoutes = require('./routes/galleryImages');

// Create uploads directory
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));
app.use('/uploads', express.static('uploads'));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use('/api', heroRoutes);
// Routes
app.use('/api', alertImagesRoutes);
app.use('/api', careersRoutes);
app.use('/api', authRoutes);
app.use('/api', contactsRoutes);
// Add this route
app.use('/api', galleryImagesRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
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