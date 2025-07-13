import express from 'express';
import { allClients, google, logout, updateClient, createUser, login } from '../controllers/users.controller.js';


const router = express.Router();

router.post('/create/google', google)
router.put('/update/:id', updateClient)
router.post('/logout', logout)
router.post('/create', createUser)
router.post('/login', login)

router.get('/get-all-users', allClients)

 
export default router