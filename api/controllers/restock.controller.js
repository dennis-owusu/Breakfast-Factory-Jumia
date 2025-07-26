import { errorHandler } from '../utils/error.js';
import RestockRequest from '../models/restock.model.js';
import Product from '../models/product.model.js';

// Create a restock request
export const createRestockRequest = async (req, res, next) => {
    try {
        const { productId, requestedQuantity } = req.body;

        // Validate inputs
        if (!productId || !requestedQuantity) {
            return next(errorHandler(400, 'Product ID and requested quantity are required'));
        }

        // Find the product and verify ownership
        const product = await Product.findById(productId);
        if (!product) {
            return next(errorHandler(404, 'Product not found'));
        }

        // Create restock request
        const restockRequest = new RestockRequest({
            product: productId,
            requestedQuantity,
            currentQuantity: product.numberOfProductsAvailable,
            reason: 'Stock replenishment'
        });

        await restockRequest.save();

        res.status(201).json({
            success: true,
            message: 'Restock request created successfully',
            request: restockRequest
        });
    } catch (error) {
        next(error);
    }
};

// Get all restock requests (admin only)
export const getRestockRequests = async (req, res, next) => {
    try {
        const requests = await RestockRequest.find()
            .populate('product', 'productName numberOfProductsAvailable')
            .populate('outlet', 'username email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            requests
        });
    } catch (error) {
        next(error);
    }
};

// Get outlet's restock requests
export const getOutletRestockRequests = async (req, res, next) => {
    try {
        const requests = await RestockRequest.find()
            .populate('product', 'productName numberOfProductsAvailable')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            requests
        });
    } catch (error) {
        next(error);
    }
};

// Process restock request (admin only)
export const processRestockRequest = async (req, res, next) => {
    try {
        const { requestId } = req.params;
        const { status, adminNote } = req.body;
        const adminId = req.user._id;

        if (!['approved', 'rejected'].includes(status)) {
            return next(errorHandler(400, 'Invalid status'));
        }

        const request = await RestockRequest.findById(requestId);
        if (!request) {
            return next(errorHandler(404, 'Restock request not found'));
        }

        if (request.status !== 'pending') {
            return next(errorHandler(400, 'This request has already been processed'));
        }

        // Update request status
        request.status = status;
        request.adminNote = adminNote;
        request.processedAt = new Date();
        request.processedBy = adminId;

        // If approved, update product quantity
        if (status === 'approved') {
            const product = await Product.findById(request.product);
            if (!product) {
                return next(errorHandler(404, 'Product not found'));
            }

            product.numberOfProductsAvailable += request.requestedQuantity;
            await product.save();
        }

        await request.save();

        res.status(200).json({
            success: true,
            message: `Restock request ${status}`,
            request
        });
    } catch (error) {
        next(error);
    }
};