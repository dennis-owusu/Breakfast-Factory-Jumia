import express from 'express'; 
import { newProducts, getProducts, deleteProduct, updateProduct, purchaseProducts, } from '../controllers/product.controller.js';
import { verifyToken } from '../utils/verifyUser.js';
import { upload } from '../utils/multer.js';

const router = express.Router()

// Route for creating a new product with image upload
router.post('/products', newProducts)

// Route for updating a product with image upload
router.put('/update/:id', updateProduct);

// Other routes
router.get('/allproducts', getProducts)
router.put('/purchase/:id', purchaseProducts);
router.delete('/delete/:productId', deleteProduct)
 
export default router