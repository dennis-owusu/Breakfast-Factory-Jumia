import express from 'express';
import { allClients, google, logout, updateClient } from '../controllers/users.controller.js';

const router = express.Router();

router.post('/create/google', google)
router.put('/update/:id', updateClient)
router.post('/logout', logout)

router.get('/get-all-users', allClients)

 
export default router