import express from 'express';
import {
  createCreditTransaction,
  getUserCreditTransactions,
  getOutletCreditTransactions,
  getAllCreditTransactions,
  recordCreditPayment,
  updateCreditTransaction,
  updateUserCreditLimit,
  getCreditSummary
} from '../controllers/credit.controller.js';
import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

// Create a new credit transaction
router.post('/', verifyToken, createCreditTransaction);

// Get credit transactions for a specific user
router.get('/user/:userId', verifyToken, getUserCreditTransactions);

// Get credit transactions for a specific outlet
router.get('/outlet/:outletId', verifyToken, getOutletCreditTransactions);

// Get all credit transactions (admin only)
router.get('/', verifyToken, getAllCreditTransactions);

// Record a payment for a credit transaction
router.post('/:creditId/payment', verifyToken, recordCreditPayment);

// Update a credit transaction (admin only)
router.put('/:creditId', verifyToken, updateCreditTransaction);

// Update user credit limit (admin only)
router.put('/user/:userId/credit-limit', verifyToken, updateUserCreditLimit);

// Get credit summary for dashboard
router.get('/summary', verifyToken, getCreditSummary);

export default router;