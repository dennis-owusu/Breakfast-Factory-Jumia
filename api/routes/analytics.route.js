import express from 'express';
import { getAnalytics, getSales, getAdminSalesReport } from '../controllers/analytics.controller.js';
import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

router.get('/analytics', getAnalytics);
router.get('/sales', getSales);
router.get('/admin/sales-report', verifyToken, getAdminSalesReport);

export default router;