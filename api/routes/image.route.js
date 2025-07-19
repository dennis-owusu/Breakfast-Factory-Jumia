import express from 'express';
import multer from 'multer';
import Image from '../models/image.model.js';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

// Route for uploading multiple images
router.post('/upload', upload.array('images', 10), async (req, res) => {
  try {
    const uploadPromises = req.files.map(async (file) => {
      const result = await cloudinary.uploader.upload_stream({ resource_type: 'image' }, (error, result) => {
        if (error) throw error;
        return result;
      }).end(file.buffer);
      return {
        fileName: file.originalname,
        filePath: result.secure_url
      };
    });
    const uploadedImages = await Promise.all(uploadPromises);
    const savedImages = await Image.insertMany(uploadedImages);
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