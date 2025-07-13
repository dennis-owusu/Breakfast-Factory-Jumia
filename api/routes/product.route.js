import express from 'express'; 
import { newProducts, getProducts, deleteProduct, updateProduct, purchaseProducts, } from '../controllers/product.controller.js';
import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router()
router.post('/products', newProducts)
router.get('/allproducts', getProducts)
router.put('/update/:id', updateProduct);
router.put('/purchase/:id', purchaseProducts);
router.delete('/delete/:productId', verifyToken, deleteProduct)
 
export default router