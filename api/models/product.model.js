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
   
}, {timestamp:true})

const Product = mongoose.model('Product', productSchema)

export default Product