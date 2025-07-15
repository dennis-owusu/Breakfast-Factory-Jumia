import express from 'express';
import { getAnalytics, getSales } from '../controllers/analytics.controller.js';
import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

router.get('/analytics', getAnalytics);
router.get('/sales', getSales);

export default router;