const express = require('express');
const router = express.Router();
const axios = require('axios');
const FormData = require('form-data');

// Third-party API configuration
const THIRD_PARTY_API_URL = 'https://nowalnaturecare.ayushmanager.com/api/inquiry';
const THIRD_PARTY_TOKEN = '6148523063484d364c7939756233646862473568644856795a574e68636d557559586c3163326874595735685a3256794c6d4e766253383d';

/**
 * @route   POST /api/inquiry/submit-inquiry
 * @desc    Submit inquiry to third-party API
 * @access  Public
 */
router.post('/submit-inquiry', async (req, res) => {
    try {
        console.log('Received inquiry submission:', {
            body: req.body,
            timestamp: new Date().toISOString()
        });

        const { 
            name, 
            email, 
            phone_no, 
            address, 
            existing_medical_condition = '', 
            message = 'Naturopathic Consultation Service' 
        } = req.body;

        // Validation
        const errors = {};
        
        if (!name || name.trim().length === 0) {
            errors.name = 'Name is required';
        }
        
        if (!email || email.trim().length === 0) {
            errors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.email = 'Please enter a valid email address';
        }
        
        if (!phone_no || phone_no.trim().length === 0) {
            errors.phone_no = 'Phone number is required';
        } else {
            const phoneDigits = phone_no.replace(/\D/g, '');
            if (phoneDigits.length !== 10) {
                errors.phone_no = 'Phone number must be 10 digits';
            }
        }
        
        if (!address || address.trim().length === 0) {
            errors.address = 'Address is required';
        }

        if (Object.keys(errors).length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors
            });
        }

        // Prepare form data for third-party API
        const formData = new FormData();
        formData.append('name', name.trim());
        formData.append('email', email.trim());
        formData.append('phone_no', phone_no.trim().replace(/\D/g, '').slice(0, 10));
        formData.append('address', address.trim());
        formData.append('existing_medical_condition', existing_medical_condition.trim());
        formData.append('message', message.trim());

        console.log('Sending to third-party API:', {
            name: name.trim(),
            email: email.trim(),
            phone_no: phone_no.trim(),
            timestamp: new Date().toISOString()
        });

        // Call third-party API
        const response = await axios.post(THIRD_PARTY_API_URL, formData, {
            headers: {
                'Authorization': `Bearer ${THIRD_PARTY_TOKEN}`,
                ...formData.getHeaders()
            },
            timeout: 30000 // 30 seconds timeout
        });

        console.log('Third-party API response:', {
            status: response.status,
            data: response.data,
            timestamp: new Date().toISOString()
        });

        // Return success response
        res.status(200).json({
            success: true,
            message: 'Inquiry submitted successfully',
            data: response.data,
            statusCode: response.status,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error in inquiry submission:', {
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });

        let statusCode = 500;
        let errorMessage = 'Failed to submit inquiry';
        let errorDetails = {};
        
        if (error.response) {
            // Third-party API returned an error
            statusCode = 502; // Bad Gateway
            errorMessage = 'Third-party API error';
            errorDetails = {
                status: error.response.status,
                data: error.response.data,
                headers: error.response.headers
            };
        } else if (error.request) {
            // No response received from third-party API
            statusCode = 503; // Service Unavailable
            errorMessage = 'Third-party service is not responding';
            errorDetails = {
                request: error.request._currentUrl || error.request._currentRequest?.path
            };
        } else {
            // Setup error
            errorMessage = 'Server configuration error';
            errorDetails = { message: error.message };
        }

        res.status(statusCode).json({
            success: false,
            message: errorMessage,
            error: error.message,
            details: errorDetails,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * @route   GET /api/inquiry/test-connection
 * @desc    Test connection to third-party API
 * @access  Public
 */
router.get('/test-connection', async (req, res) => {
    try {
        const response = await axios.get('https://nowalnaturecare.ayushmanager.com', {
            timeout: 10000
        });
        
        res.json({
            success: true,
            message: 'Third-party API is accessible',
            status: response.status,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Third-party connection test failed:', error.message);
        
        res.status(503).json({
            success: false,
            message: 'Third-party API is not accessible',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * @route   GET /api/inquiry/test
 * @desc    Test inquiry endpoint (for development)
 * @access  Public
 */
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Inquiry API is working',
        endpoints: {
            submitInquiry: {
                method: 'POST',
                url: '/api/inquiry/submit-inquiry',
                description: 'Submit inquiry to third-party service'
            },
            testConnection: {
                method: 'GET',
                url: '/api/inquiry/test-connection',
                description: 'Test connection to third-party API'
            }
        },
        timestamp: new Date().toISOString()
    });
});

module.exports = router;