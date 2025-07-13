import mongoose from 'mongoose';


const usersSchema = new mongoose.Schema({
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
}, {timestamp: {new: true}})

const Users = mongoose.model('Users', usersSchema)

export default Users