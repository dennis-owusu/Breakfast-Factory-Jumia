import { errorHandler } from "../utils/error.js"; 
import Product from '../models/product.model.js';
  
export const newProducts = async (req, res, next) => {
    const { productId, productName, categoryId, numberOfProductsAvailable, category, productImage, productPrice} = req.body
    if(productName === '' || productPrice === '') {
        return next(errorHandler(401, 'These fields are required'))
    }
    try {
        const newProduct = new Product({
            productId,
            category,
            productName, 
            categoryId,  
            numberOfProductsAvailable,
            productImage,
            productPrice
        })   
        await newProduct.save()
        res.json(newProduct)
    } catch (error) {
        return next(error)
    }
}   


export const getProducts = async(req, res, next) =>{

    try {
        const startIndex = parseInt(req.query.startIndex) || 0;
        const sortDirection = req.query.order === 'asc' ? 1 : -1;
        const products = await Product.find({
          ...(req.query.producproductId && {productId: req.query.productId }),
          ...(req.query.categoryId && { categoryId: req.query.categoryId }),
          ...(req.query.category && { category: req.query.category }),
          ...(req.query.productName && { productName: req.query.productName }),
          ...(req.query.numberOfProductsAvailable && { numberOfProductsAvailable: req.query.numberOfProductsAvailable }),
          ...(req.query.postId && { _id: req.query.postId }),
          ...(req.query.searchTerm && {
            $or: [
              { title: { $regex: req.query.searchTerm, $options: 'i' } },
              { content: { $regex: req.query.searchTerm, $options: 'i' } },
            ],
          }), 
        })
          .sort({ updatedAt: sortDirection })
          .skip(startIndex)
    
        const totalProducts = await Product.countDocuments();
    
        const now = new Date();
    
        const oneMonthAgo = new Date(
          now.getFullYear(),
          now.getMonth() - 1,
          now.getDate()
        );
    
        const lastMonthProducts = await Product.countDocuments({
          createdAt: { $gte: oneMonthAgo },
        });
    
        res.status(200).json({
          products,
          totalProducts,
          lastMonthProducts,
        });
      } catch (error) {
        next(error);  
      }
    }; 
    
    export const deleteProduct = async (req, res, next) => {
      try {
        await Product.findByIdAndDelete(req.params.productId);
        res.status(200).json('Product has been deleted successfully');
      } catch (error) {
        next(error);  
      }
    }; 

    export const updateProduct = async (req, res, next) => {
      
      try {
        const updatedProduct = await Product.findByIdAndUpdate(
          req.params.id,
          {
            $set: { 
              productId: req.body.productId,
              category: req.body.category,
              productName: req.body.productName,
              categoryId: req.body.categoryId,
              productImage: req.body.productImage,
              productPrice: req.body.productPrice,
              numberOfProductsAvailable: req.body.numberOfProductsAvailable,
            },
          },
          { new: true }
        );
        res.status(200).json(updatedProduct);
      } catch (error) {
        next(error);
      }
    };

    export const purchaseProducts = async (req, res, next) => {
      const { quantity } = req.body;
  
      if ( !quantity || quantity <= 0) {
          return next(errorHandler(400, 'Quantity must be greater than zero.'));
      }
  
      try {
          const product = await Product.findById(req.params.id);
          
          if (!product) {
              return next(errorHandler(404, 'Product not found.'));
          }
  
          if (product.numberOfProductsAvailable < quantity) {
              return next(errorHandler(400, 'Not enough products available.'));
          }
  
          // Deduct the quantity from available stock
          product.numberOfProductsAvailable -= quantity;
  
          // Save the updated product
          await product.save();
  
          res.status(200).json({
              message: 'Purchase successful',
              product: {
                _id: product._id,
                  productId: product.productId,
                  productName: product.productName,
                  numberOfProductsAvailable: product.numberOfProductsAvailable,
              },
          });
      } catch (error) {
          next(error);
      }
  };