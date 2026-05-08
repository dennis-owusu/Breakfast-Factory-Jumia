import express from 'express';
import { askAI } from '../controllers/ai.controller.js';
import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

router.post('/ask', verifyToken, askAI);

export default router;