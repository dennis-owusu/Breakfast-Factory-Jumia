import mongoose from 'mongoose';

const restockSchema = mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    outlet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    requestedQuantity: {
        type: Number,
        required: true,
        min: 1
    },
    currentQuantity: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    reason: {
        type: String,
        required: true
    },
    adminNote: {
        type: String,
        default: ''
    },
    processedAt: {
        type: Date
    },
    processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {timestamps: true});

const RestockRequest = mongoose.model('RestockRequest', restockSchema);

export default RestockRequest;