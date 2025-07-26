import express from 'express';
import { getDashboardStats, getOutletDailySalesReport } from '../controllers/dashboard.controller.js';


const router = express.Router();

router.get('/stats', getDashboardStats);
router.get('/outlet/:outletId/daily-report', getOutletDailySalesReport);

export default router;   