import express from 'express';
import multer from 'multer';
import Image from '../models/image.model.js';
import path from 'path';

const router = express.Router();

// Set up storage for multer 
const storage = multer.diskStorage({
  destination: './uploads/', // Directory for uploaded files
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname); // Unique file name
    cb(null, uniqueName); // Use the unique file name
  },
});

const upload = multer({ storage });

// Route for uploading multiple images
router.post('/upload', upload.array('images', 10), async (req, res) => {
  try {
    const images = req.files.map(file => ({
      fileName: file.filename,
      filePath: `https://breakfast-factory-jumia.onrender.com/uploads/${file.filename}`, // Relative path for proper resolution
    }));
 

    const savedImages = await Image.insertMany(images);
    res.status(201).json({ success: true, images: savedImages });
  } catch (err) {
    console.error('Error uploading images:', err);
    res.status(500).json({ success: false, message: 'Image upload failed' });
  }
});

// Route for fetching all images
router.get('/', async (req, res) => {
  try {
    const images = await Image.find();
    res.status(200).json({ success: true, images });
  } catch (err) {
    console.error('Error fetching images:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch images' });
  }
});

export default router;