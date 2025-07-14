import mongoose from 'mongoose';
import {v4 as uuidv4} from 'uuid';

const categorySchema = mongoose.Schema({
    categoryId: {
        type: String,
        unique: true,
        default: uuidv4(),
        required: false 
    },
    categoryName: {
        type: String,
        required: true,
    }, 
})

const Categories = mongoose.model('Categories', categorySchema)

export default Categories