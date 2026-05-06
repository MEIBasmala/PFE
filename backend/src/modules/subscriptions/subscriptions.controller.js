const subsService = require('./subscriptions.service');

//  Get All Packages 
const getAllPackages = async (req, res) => {
  try {
    const packages = await subsService.getAllPackages();
    const transformed = packages.map(pkg => ({
      id: pkg.id,                              // was _id — frontend expects id
      name: pkg.name,
      tier: pkg.tier,
      priceMonthly: pkg.priceMonthly,
      priceYearly: pkg.priceYearly,
      price: pkg.price,                        // was missing — seasonal plans need this
      currency: 'DZD',
      features: pkg.features,
      aiScansPerDay: pkg.aiScansPerDay,
      consultationsPerMonth: pkg.consultationsPerMonth,
      mealPlanType: pkg.mealPlanType,          // was missing — used by getStructuredFeatures()
      highlight: pkg.highlight,
      isSeasonal: pkg.isSeasonal || false,
      duration: pkg.duration,
      chatbot: pkg.chatbot || false,
    }));
    res.status(200).json(transformed);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// Get My Subscription – return the active subscription object (or null)
const getMySubscription = async (req, res) => {
  try {
    const { active, history } = await subsService.getMySubscription(req.user.id);
    // active is the active subscription (with included package) or null
    res.status(200).json(active || null);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
//  Create Subscription 
const createSubscription = async (req, res) => {
  try {
    const subscription = await subsService.createSubscription(req.user.id, req.body);
    res.status(201).json({
      success: true,
      message: 'Subscription created successfully',
      subscription,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

//  Cancel Subscription 
const cancelSubscription = async (req, res) => {
  try {
    const subscription = await subsService.cancelSubscription(
      req.user.id,
      parseInt(req.params.id)
    );
    res.status(200).json({
      success: true,
      message: 'Subscription cancelled successfully',
      subscription,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllPackages,
  getMySubscription,
  createSubscription,
  cancelSubscription,
};