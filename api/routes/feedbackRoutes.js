 import express from 'express';
import Feedback from '../models/feedback.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Middleware to verify JWT and extract userId
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Expecting "Bearer <token>"
  if (!token) {
    return res.status(401).json({ error: 'Authentication error: No token provided' });
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(401).json({ error: 'Authentication error: Invalid token' });
    }
    req.user = user; // Attach user to request
    next();
  });
};

// POST: Create new feedback
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { message, rating } = req.body;

    // Validate input
    if (!message || !rating) {
      return res.status(400).json({ error: 'Message and rating are required' });
    }

    const feedback = new Feedback({
      message,
      rating,
      userId: req.user.id, // Use userId from JWT
    });

    await feedback.save();
    // Emit Socket.IO event for real-time feedback submission
    req.app.get('io').emit('newFeedback', feedback);
    
    res.status(201).json({ message: 'Feedback submitted successfully', feedback });
  } catch (error) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// GET: Retrieve all feedback
router.get('/', async (req, res) => {
  try {
    const feedbacks = await Feedback.find().populate('userId', 'email').sort({ createdAt: -1 });
    res.status(200).json(feedbacks);
  } catch (error) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// GET: Retrieve single feedback by ID
router.get('/:id', async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id).populate('userId', 'email');
    if (!feedback) {
      return res.status(404).json({ error: 'Feedback not found' });
    }
    res.status(200).json(feedback);
  } catch (error) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

export default router;