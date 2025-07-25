import mongoose from 'mongoose';

const categorySchema = mongoose.Schema({
    categoryName: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        required: false,
        unique: false
    },
    outlet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Categories',
        required: false
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    featured: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });
const Categories = mongoose.model('Categories', categorySchema)
export default Categories