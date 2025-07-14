import express from 'express';
import { category, deleteCategory, fetchCategory, updateCategory } from '../controllers/categories.controller.js';


const router = express.Router()
router.post('/categories', category)
router.put('/update-categories/:id', updateCategory)
router.get('/allcategories', fetchCategory)
router.delete('/delete/:id', deleteCategory)


export default router  