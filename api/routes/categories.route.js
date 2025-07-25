import express from 'express';
import { category, deleteCategory, fetchCategory, updateCategory, getCategoryById } from '../controllers/categories.controller.js';


const router = express.Router()
router.post('/categories', category)
router.put('/update-categories/:id', updateCategory)
router.get('/allcategories', fetchCategory)
router.get('/categories/:id', getCategoryById)
router.delete('/category/delete/:id', deleteCategory)

export default router