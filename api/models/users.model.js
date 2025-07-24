import mongoose from 'mongoose';


const usersSchema = new mongoose.Schema({
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active',
        required: true
    },
    lastLogin: {
        type: Date,
        default: null
    },
    name: {
        type: String,
        required: true
    }, 
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: Number,
        required: false
    },
    profilePicture: { 
        type: String,
        required: false
     },
     usersRole: {
        type: String,
        enum: ['outlet', 'admin', 'user'],
        required: true
     },
     description: {
        type: String,
        required: false
     },
     storeName: {
        type: String,
        required: false
     },
}, {
    timestamps: true
})

const Users = mongoose.model('Users', usersSchema)

export default Users