import express from 'express';
import { getDashboardStats } from '../controllers/dashboard.controller.js';
import { protect, restrictTo } from '../middleware/auth.middleware.js';

const router = express.Router();

// Protect and restrict to admin role
router.get('/stats',   getDashboardStats);

export default router;