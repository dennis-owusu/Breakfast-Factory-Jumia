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
        required: true
     },
     usersRole: {
        type: String,
        enum: ['outlet', 'admin', 'user'],
        required: true
     },
}, {timestamp: {new: true}})

const Users = mongoose.model('Users', usersSchema)

export default Users