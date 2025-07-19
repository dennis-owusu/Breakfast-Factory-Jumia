import { errorHandler } from "../utils/error.js"; 
import Product from '../models/product.model.js';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export const newProducts = async (req, res, next) => {
    const { productId, productName, category, numberOfProductsAvailable, productPrice, description, outlet, specifications, featured, discountPrice, author } = req.body;
    let imageUrl = '';
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path);
      imageUrl = result.secure_url;
    } else if (productImage) {
      imageUrl = productImage;
    }

    if (!productName || !productPrice || !productImage) {
        return next(errorHandler(400, 'Product name, price, and image are required'));
    }

    try {
        const newProduct = new Product({
            productId,
            productName,
            category,
            numberOfProductsAvailable,
            productPrice,
            productImage: imageUrl,
            description,
            specifications,   
            featured,
            discountPrice,
            author,
            outlet
        });

        await newProduct.save();
        res.status(200).json({ success: true, product: newProduct });
    } catch (error) {
        next(error);
    }
};

export const oneProduct = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return next(errorHandler(404, 'Product not found'));
        }
        res.status(200).json({ success: true, product });
    } catch (error) {
        next(error);
    }
};
export const getProducts = async (req, res, next) => {
    try {
        const startIndex = parseInt(req.query.startIndex) || 0;
        const sortDirection = req.query.order === 'asc' ? 1 : -1;
        const products = await Product.find({
            ...(req.query.productId && { productId: req.query.productId }),
            ...(req.query.category && { category: req.query.category }),
            ...(req.query.productName && { productName: req.query.productName }),
            ...(req.query.numberOfProductsAvailable && { numberOfProductsAvailable: req.query.numberOfProductsAvailable }),
            ...(req.query.postId && { _id: req.query.postId }),
            ...(req.query.searchTerm && {
                $or: [
                    { productName: { $regex: req.query.searchTerm, $options: 'i' } },
                    { description: { $regex: req.query.searchTerm, $options: 'i' } },
                ],
            }),
        })
            .sort({ updatedAt: sortDirection })
            .skip(startIndex);

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
            success: true,
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
        res.status(200).json({ success: true, message: 'Product has been deleted successfully' });
    } catch (error) {
        next(error);
    }
};

export const updateProduct = async (req, res, next) => {
    try {
        let updateData = { ...req.body };
        if (req.file) {
          const result = await cloudinary.uploader.upload(req.file.path);
          updateData.productImage = result.secure_url;
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true }
        );

        if (!updatedProduct) {
            return next(errorHandler(404, 'Product not found'));
        }

        res.status(200).json({ success: true, product: updatedProduct });
    } catch (error) {
        next(error);
    }
};

export const purchaseProducts = async (req, res, next) => {
    const { quantity } = req.body;

    if (!quantity || quantity <= 0) {
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

        product.numberOfProductsAvailable -= quantity;
        await product.save();

        res.status(200).json({
            success: true,
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