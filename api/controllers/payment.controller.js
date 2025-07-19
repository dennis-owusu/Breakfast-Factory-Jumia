import Payment from '../models/payment.model.js'
import Order from '../models/order.model.js'

export const createPayment = async (req, res, next) => {
  try {
    const { referenceId, userId, orderId, amount, paymentMethod, phoneNumber, currency, payerEmail, status } = req.body;

    const newPayment = new Payment({
      referenceId: typeof referenceId === 'object' && referenceId.reference ? referenceId.reference : String(referenceId),
      userId,
      orderId,
      amount,
      phoneNumber,
      paymentMethod,
      currency,
      payerEmail,
      status,
    });

    await newPayment.save(); // <-- this was missing

    res.status(201).json({ message: "Payment recorded", payment: newPayment });
  } catch (error) {
    next(error);
    console.log(error)
  }
};

export const getOutletPayments = async (req, res, next) => {
  try {
    const orders = await Order.find({});
    const orderIds = orders.map(order => order._id);
    const payments = await Payment.find({ orderId: { $in: orderIds } }).sort({ createdAt: -1 });
    res.status(200).json(payments);
  } catch (error) {
    next(error);
  }
};
