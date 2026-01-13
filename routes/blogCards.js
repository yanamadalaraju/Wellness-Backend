const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const pool = require("../db");


// === FILE UPLOAD CONFIG ===
const storage = multer.diskStorage({
    destination: "./uploads/blogs",
    filename: (req, file, cb) => {
        cb(
            null,
            Date.now() + "-" + Math.round(Math.random() * 1e9) + path.extname(file.originalname)
        );
    },
});

const upload = multer({ storage });

// === CREATE BLOG CARD ===
router.post("/blog-cards", upload.single("image"), async (req, res) => {
    try {
        const { title, description } = req.body;

        const image_url = `/uploads/blogs/${req.file.filename}`;

        await pool.query(
            "INSERT INTO blog_cards (title, description, image_url) VALUES (?, ?, ?)",
            [title, description, image_url]
        );

        res.json({ success: true, message: "Card saved" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// === GET BLOG CARDS ===
router.get("/blog-cards", async (req, res) => {
    const [rows] = await pool.query("SELECT * FROM blog_cards ORDER BY id DESC");
    res.json(rows);
});

// === UPDATE BLOG CARD ===
router.put("/blog-cards/:id", upload.single("image"), async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description } = req.body;

        let query = "";
        let params = [];

        if (req.file) {
            // if new image uploaded
            const image_url = `/uploads/blogs/${req.file.filename}`;
            query = "UPDATE blog_cards SET title=?, description=?, image_url=? WHERE id=?";
            params = [title, description, image_url, id];
        } else {
            // without image update
            query = "UPDATE blog_cards SET title=?, description=? WHERE id=?";
            params = [title, description, id];
        }

        await pool.query(query, params);

        res.json({ success: true, message: "Blog card updated successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// === DELETE BLOG CARD ===
router.delete("/blog-cards/:id", async (req, res) => {
    try {
        const { id } = req.params;

        await pool.query("DELETE FROM blog_cards WHERE id=?", [id]);

        res.json({ success: true, message: "Blog card deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
