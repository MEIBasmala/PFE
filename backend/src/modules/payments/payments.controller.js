const paymentsService = require('./payments.service');

//  Create Payment Intent 
const createPaymentIntent = async (req, res) => {
  try {
    const { packageId } = req.body;
    const data = await paymentsService.createPaymentIntent(req.user.id, { packageId });
    res.status(200).json(data);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

//  Handle Webhook 
const handleWebhook = async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'];
    const result = await paymentsService.handleWebhook(req.body, signature);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get Payment History 
const getPaymentHistory = async (req, res) => {
  try {
    const payments = await paymentsService.getPaymentHistory(req.user.id);
    res.status(200).json(payments);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};


module.exports = {
  createPaymentIntent,
  handleWebhook,
  getPaymentHistory,
  
};