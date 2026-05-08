import { errorHandler } from "../utils/error.js"; 
import mongoose from 'mongoose';
import Product from '../models/product.model.js';
import Categories from '../models/categories.model.js';

export const newProducts = async (req, res, next) => {
    const { productId, productName, category, numberOfProductsAvailable, productPrice, productImage, description, outlet, specifications, featured, discountPrice, author } = req.body;

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
            productImage, // Use the productImage from req.body
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
        const limit = parseInt(req.query.limit) || 10;
        const sortDirection = req.query.order === 'asc' ? 1 : -1;
        const allowedSortFields = ['updatedAt', 'productPrice', 'productName', 'category', 'numberOfProductsAvailable', 'createdAt'];
        const sortField = allowedSortFields.includes(req.query.sort) ? req.query.sort : 'updatedAt';
        const filters = {
            ...(req.query.productId && { productId: req.query.productId }),
            ...(req.query.productName && { productName: req.query.productName }),
            ...(req.query.numberOfProductsAvailable && { numberOfProductsAvailable: req.query.numberOfProductsAvailable }),
            ...(req.query.postId && { _id: req.query.postId }),
            ...(req.query.searchTerm && {
                $or: [
                    { productName: { $regex: req.query.searchTerm, $options: 'i' } },
                    { description: { $regex: req.query.searchTerm, $options: 'i' } },
                ],
            }),
        };

        if (req.query.category) {
            if (mongoose.isValidObjectId(req.query.category)) {
                filters.category = req.query.category;
            } else {
                const matchingCategories = await Categories.find({
                    categoryName: { $regex: `^${req.query.category}$`, $options: 'i' },
                }).select('_id').lean();

                filters.category = {
                    $in: matchingCategories.map((category) => category._id),
                };
            }
        }

        const products = await Product.find(filters)
            .sort({ [sortField]: sortDirection, updatedAt: -1 })
            .skip(startIndex)
            .limit(limit)
            .lean();

        const categoryIds = [...new Set(
            products
                .map((product) => product.category)
                .filter((categoryId) => mongoose.isValidObjectId(categoryId))
                .map((categoryId) => categoryId.toString())
        )];

        const categories = await Categories.find({ _id: { $in: categoryIds } })
            .select('_id categoryName')
            .lean();

        const categoryMap = new Map(
            categories.map((category) => [category._id.toString(), category])
        );

        const normalizedProducts = products.map((product) => {
            if (mongoose.isValidObjectId(product.category)) {
                const populatedCategory = categoryMap.get(product.category.toString());

                return {
                    ...product,
                    category: populatedCategory || product.category,
                };
            }

            return product;
        });

        const totalProducts = await Product.countDocuments(filters);

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
            products: normalizedProducts,
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
        const updateData = {
            productId: req.body.productId,
            category: req.body.category,
            productName: req.body.productName,
            productPrice: req.body.productPrice,
            numberOfProductsAvailable: req.body.numberOfProductsAvailable,
            productImage: req.body.productImage,
            description: req.body.description,
            specifications: req.body.specifications,
            featured: req.body.featured,
            discountPrice: req.body.discountPrice,
            author: req.body.author
        };

        if (req.file) {
            updateData.productImage = `/uploads/${req.file.filename}`;
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
