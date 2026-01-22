const express = require("express");
const axios = require("axios");

const router = express.Router();

router.post("/send-inquiry", async (req, res) => {
    try {
        const response = await axios.post(
            "https://nowalnaturecare.ayushmanager.com/api/inquiry",
            req.body,
            {
                headers: {
                    Authorization:
                        "Bearer 6148523063484d364c7939756233646862473568644856795a574e68636d557559586c3163326874595735685a3256794c6d4e766253383d",
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                timeout: 30000,
            }
        );

        res.json(response.data);
    } catch (error) {
        console.error("Inquiry API Error:", error.response?.data || error.message);
        res.status(500).json({
            message: "Failed to submit inquiry",
        });
    }
});

module.exports = router;
