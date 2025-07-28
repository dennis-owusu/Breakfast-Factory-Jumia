import express from 'express';
import { verifyToken, verifyAdmin, verifyOutlet } from '../utils/verifyUser.js';
import { createRestockRequest, getRestockRequests, getOutletRestockRequests, processRestockRequest } from '../controllers/restock.controller.js';

const router = express.Router();

// Outlet routes (requires outlet role)
router.post('/request', createRestockRequest);
router.get('/outlet-requests', getOutletRestockRequests);

// Admin routes (requires admin role)
router.get('/all', getRestockRequests);
router.put('/process/:requestId', processRestockRequest);

export default router;