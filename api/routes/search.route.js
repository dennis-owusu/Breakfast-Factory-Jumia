import express from 'express';
import { verifyToken } from '../utils/verifyUser.js';
import { searchDashboard, getSearchSuggestions } from '../controllers/search.controller.js';

const router = express.Router();

// GET /api/route/search?query=...&category=...&limit=10
router.get('/search', verifyToken, searchDashboard);

// GET /api/route/search/suggestions
router.get('/search/suggestions', verifyToken, getSearchSuggestions);

export default router;