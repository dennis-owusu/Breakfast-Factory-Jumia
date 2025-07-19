import express from 'express'
import {createPayment, getOutletPayments} from '../controllers/payment.controller.js'


const router = express.Router()

router.post('/payment', createPayment)
router.get('/payments', getOutletPayments)


export default router