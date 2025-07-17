import mongoose from 'mongoose';

const productSchema = mongoose.Schema({
    productId: {
        type: Number,
        required: false
    },
    productName: {
        type: String,
        required: true,
    },
   categoryId: {
    type: Number,  
    required: false, 
   },
   category: {
    type: String,
    required: true
   },
   productImage:{
    type: String,
    required: true,
   },
   productPrice: {
    type: Number,
    required: true,
   },
   numberOfProductsAvailable: {
    type: Number,
    default: 0,
   },
   description: {
    type: String,
    required: false,
   },
   specifications: {
    type: String,
    required: false,
   },
   featured: {
    type: Boolean,
    default: false,
   },
   discountPrice: {
    type: Number,
    required: false,
   },
   outlet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
   },
}, {timestamps:true})

const Product = mongoose.model('Product', productSchema)

export default Product