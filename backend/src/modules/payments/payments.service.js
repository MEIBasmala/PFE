const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const paymentsRepo = require('./payments.repository');
const sendEmail = require('../../config/email');
const { createNotification } = require('../notifications/notifications.service');

//  Create Payment Intent 
const createPaymentIntent = async (userId, { packageId }) => {
  const patient = await paymentsRepo.getPatientByUserId(userId);
  if (!patient) throw new Error('Patient profile not found');

  const existing = await paymentsRepo.getActiveSubscription(patient.id);
  if (existing) throw new Error('You already have an active subscription');

  const pkg = await require('../subscriptions/subscriptions.repository').getPackageById(packageId);
  if (!pkg) throw new Error('Package not found');

  const amountInDZD = pkg.isSeasonal ? pkg.price : pkg.priceMonthly;
  if (!amountInDZD || amountInDZD <= 0) {
    throw new Error('This plan is free – no payment required');
  }

  // Convert DZD to USD (example rate: 1 USD = 135 DZD)
  const USD_RATE = 135;
  let amountUSD = Math.round((amountInDZD / USD_RATE) * 100); // cents
  if (amountUSD < 50) amountUSD = 50; // enforce Stripe minimum $0.50

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountUSD,      // ✅ fixed
    currency: 'usd',
    metadata: {
      userId: userId.toString(),
      patientId: patient.id.toString(),
      packageId: packageId.toString(),
      originalAmountDZD: amountInDZD.toString(),
    },
  });

  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    amount: amountUSD / 100,
    originalAmountDZD: amountInDZD,
    package: pkg,
  };
};
//  Handle Stripe Webhook 
const handleWebhook = async (payload, signature) => {
  console.log('🔔 Webhook endpoint hit');

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    console.log('✅ Event constructed:', event.type);
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);

    throw new Error(`Webhook signature verification failed: ${err.message}`);
  }

  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentSuccess(event.data.object);
      break;
    case 'payment_intent.payment_failed':
      await handlePaymentFailed(event.data.object);
      break;
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return { received: true };
};

//  Handle Payment Success 
const handlePaymentSuccess = async (paymentIntent) => {
  console.log('💰 Payment success webhook received for intent:', paymentIntent.id);
  console.log('Metadata:', paymentIntent.metadata);

  const { userId, patientId, packageId } = paymentIntent.metadata;
  if (!userId || !patientId || !packageId) return;
  // Guard: don't process the same intent twice
  const alreadyProcessed = await paymentsRepo.getPaymentByIntentId(paymentIntent.id);
  if (alreadyProcessed) return;
  console.log('Looking for packageId:', packageId);

  const pkg = await require('../subscriptions/subscriptions.repository')
    .getPackageById(parseInt(packageId));
  if (!pkg) return;

  const startDate = new Date();
  const endDate = new Date();

  if (pkg.isSeasonal && pkg.duration) {
    // Parse "30 days", "8 weeks", "12 weeks", "4 weeks"
    const [num, unit] = pkg.duration.split(' ');
    const n = parseInt(num);
    if (unit.startsWith('day')) endDate.setDate(endDate.getDate() + n);
    if (unit.startsWith('week')) endDate.setDate(endDate.getDate() + n * 7);
  } else {
    // Standard monthly plan
    endDate.setMonth(endDate.getMonth() + 1);
  }
  const subscription = await paymentsRepo.createSubscriptionAfterPayment({
    patientId: parseInt(patientId),
    packageId: parseInt(packageId),
    startDate,
    endDate,
    status: 'ACTIVE',
    stripeSubscriptionId: paymentIntent.id,
  });

  await paymentsRepo.createPayment({
    subscriptionId: subscription.id,
    amount: paymentIntent.amount,   // DZD zero-decimal, no division
    status: 'SUCCESS',
    stripePaymentIntentId: paymentIntent.id,
  });
  // --- NOTIFY THE PATIENT ---
  try {
    const userId = parseInt(paymentIntent.metadata.userId);
    await createNotification(
      userId,
      'PAYMENT',
      `Your payment for ${pkg.name} was successful. Your subscription is active until ${endDate.toLocaleDateString()}.`
    );
  } catch (err) {
    console.error('Failed to send payment notification:', err.message);
  }
  try {
    const user = await require('../users/users.repository').findById(parseInt(userId));
    await sendEmail({
      to: user.email,
      subject: 'KhabirLens — Payment Confirmed 🎉',
      html: `<h2>Payment Successful!</h2>
             <p>Your ${pkg.name} subscription is now active.</p>
             <p>Valid until: ${endDate.toLocaleDateString()}</p>`,
    });
  } catch (emailError) {
    console.log('Email failed:', emailError.message);
  }
};

//  Handle Payment Failed 
const handlePaymentFailed = async (paymentIntent) => {
  const existing = await paymentsRepo.getPaymentByIntentId(paymentIntent.id);
  if (existing) {
    await paymentsRepo.updatePaymentStatus(existing.id, 'FAILED');
  }
  const { userId } = paymentIntent.metadata;
  if (userId) {
    await createNotification(parseInt(userId), 'PAYMENT', 'Your payment failed. Please try again or contact support.');
  }
};

//  Get Payment History 
const getPaymentHistory = async (userId) => {
  const patient = await paymentsRepo.getPatientByUserId(userId);
  if (!patient) throw new Error('Patient profile not found');

  return await paymentsRepo.getPatientPayments(patient.id);
};

module.exports = {
  createPaymentIntent,
  handleWebhook,
  getPaymentHistory,
};