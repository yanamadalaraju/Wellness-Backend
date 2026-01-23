const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Your API token
const API_TOKEN = '6148523063484d364c7939756233646862473568644856795a574e68636d557559586c3163326874595735685a3256794c6d4e766253383d';
const BASE_URL = 'https://nowalnaturecare.ayushmanager.com/api';

// Proxy endpoint to get all inquiries
app.get('/api/inquiries', async (req, res) => {
  try {
    const response = await axios.get(`${BASE_URL}/inquiry`, {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Accept': 'application/json',
      },
      timeout: 30000,
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Proxy error:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data || error.message
    });
  }
});

// Proxy endpoint to get single inquiry
app.get('/api/inquiries/:id', async (req, res) => {
  try {
    const response = await axios.get(`${BASE_URL}/inquiry/${req.params.id}`, {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Accept': 'application/json',
      },
      timeout: 30000,
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Proxy error:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data || error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});