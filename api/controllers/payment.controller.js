import Payment from '../models/payment.model.js'

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
    next(error); // or: res.status(500).json({ error: error.message });
    console.log(error)
  }
};
