const express = require("express");
const router = express.Router();
const upload = require("../controllers/uploadController");
const path = require("path");

// POST /api/upload - handle file upload
router.post("/", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  // Return the file path (relative to /uploads)
  res.json({
    filename: req.file.filename,
    url: `/uploads/${req.file.filename}`,
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
  });
});

// GET /api/upload/:filename - serve uploaded files
router.get("/:filename", (req, res) => {
  const filePath = path.join(__dirname, "../uploads/", req.params.filename);
  res.sendFile(filePath);
});

module.exports = router;
