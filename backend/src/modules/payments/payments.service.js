const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const paymentsRepo = require('./payments.repository');
const sendEmail = require('../../config/email');
const { createNotification } = require('../notifications/notifications.service');
const subsRepo = require('../subscriptions/subscriptions.repository');
const usersRepo = require('../users/users.repository');

//  Create Payment Intent
const createPaymentIntent = async (userId, { packageId }) => {
  const patient = await paymentsRepo.getPatientByUserId(userId);
  if (!patient) throw new Error('Patient profile not found');

  const existing = await paymentsRepo.getActiveSubscription(patient.id);
  if (existing) throw new Error('You already have an active subscription');

  const pkg = await subsRepo.getPackageById(packageId);
  if (!pkg) throw new Error('Package not found');

  const amountInDZD = pkg.isSeasonal ? pkg.price : pkg.priceMonthly;
  if (!amountInDZD || amountInDZD <= 0) {
    throw new Error('This plan is free – no payment required');
  }

  // Convert DZD to USD cents (rate: 1 USD ≈ 135 DZD)
  // NOTE: This is a fixed rate used only for Stripe processing.
  // The actual DZD amount is stored in metadata for reference.
  const USD_RATE = 135;
  let amountUSD = Math.round((amountInDZD / USD_RATE) * 100); // in cents
  if (amountUSD < 50) amountUSD = 50; // Stripe minimum $0.50

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountUSD,
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
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('[Payment] Webhook signature verification failed:', err.message);
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
      // Unhandled event types are silently ignored — this is expected Stripe behavior
      break;
  }

  return { received: true };
};

//  Handle Payment Success
const handlePaymentSuccess = async (paymentIntent) => {
  const { userId, patientId, packageId } = paymentIntent.metadata;
  if (!userId || !patientId || !packageId) return;

  // Guard: don't process the same intent twice
  const alreadyProcessed = await paymentsRepo.getPaymentByIntentId(paymentIntent.id);
  if (alreadyProcessed) return;

  const pkg = await subsRepo.getPackageById(parseInt(packageId));
  if (!pkg) return;

  const startDate = new Date();
  const endDate = new Date();

  if (pkg.isSeasonal && pkg.duration) {
    const [num, unit] = pkg.duration.split(' ');
    const n = parseInt(num);
    if (unit.startsWith('day')) endDate.setDate(endDate.getDate() + n);
    if (unit.startsWith('week')) endDate.setDate(endDate.getDate() + n * 7);
  } else {
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
    amount: paymentIntent.amount,
    status: 'SUCCESS',
    stripePaymentIntentId: paymentIntent.id,
  });

  // Notify the patient — non-blocking
  setImmediate(async () => {
    try {
      await createNotification(
        parseInt(userId),
        'PAYMENT',
        `Your payment for ${pkg.name} Plan was successful. Your subscription is active until ${endDate.toLocaleDateString()}.`
      );
    } catch (err) {
      console.error('[Payment] Failed to send payment notification:', err.message);
    }

    try {
      const user = await usersRepo.findById(parseInt(userId));
      if (user) {
        await sendEmail({
          to: user.email,
          subject: 'KhabirLens — Payment Confirmed',
          html: `<h2>Payment Successful!</h2>
                 <p>Your ${pkg.name} subscription is now active.</p>
                 <p>Valid until: ${endDate.toLocaleDateString()}</p>`,
        });
      }
    } catch (emailError) {
      console.error('[Payment] Email failed:', emailError.message);
    }
  });
};

//  Handle Payment Failed
const handlePaymentFailed = async (paymentIntent) => {
  const existing = await paymentsRepo.getPaymentByIntentId(paymentIntent.id);
  if (existing) {
    await paymentsRepo.updatePaymentStatus(existing.id, 'FAILED');
  }

  const { userId } = paymentIntent.metadata;
  if (userId) {
    setImmediate(async () => {
      try {
        await createNotification(
          parseInt(userId),
          'PAYMENT',
          'Your payment failed. Please try again or contact support.'
        );
      } catch (err) {
        console.error('[Payment] Failed notification error:', err.message);
      }
    });
  }
};

//  Get Payment History
const getPaymentHistory = async (userId) => {
  const patient = await paymentsRepo.getPatientByUserId(userId);
  if (!patient) throw new Error('Patient profile not found');
  const payments = await paymentsRepo.getPatientPayments(patient.id);

  // Convert amounts from USD cents (Stripe) back to DZD for patient display
  const USD_RATE = 135;
  return payments.map((p) => ({
    ...p,
    amount: Math.round((p.amount * USD_RATE) / 100),
  }));
};

module.exports = {
  createPaymentIntent,
  handleWebhook,
  getPaymentHistory,
};