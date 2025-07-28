import mongoose from 'mongoose';

const restockSchema = mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    outlet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
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
        default: 'approved'
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
        ref: 'Users'
    }
}, {timestamps: true});

const RestockRequest = mongoose.model('RestockRequest', restockSchema);

export default RestockRequest;