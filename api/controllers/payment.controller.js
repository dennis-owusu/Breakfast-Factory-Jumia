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
    const { outletId } = req.query;
    
    // Find orders associated with the outlet
    let orders;
    if (outletId) {
      // If outletId is provided, filter orders by outlet
      orders = await Order.find({ 'products.product.outlet': outletId });
    } else {
      // If no outletId, get all orders
      orders = await Order.find({});
    }
    
    const orderIds = orders.map(order => order._id);
    
    // Find payments associated with these orders
    const payments = await Payment.find({ orderId: { $in: orderIds } }).sort({ createdAt: -1 });
    
    res.status(200).json({ payments });
  } catch (error) {
    next(error);
    console.error('Error fetching payments:', error);
  }
};
