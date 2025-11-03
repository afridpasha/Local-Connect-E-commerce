const express = require('express');
const router = express.Router();

// Load environment variables
require('dotenv').config({ path: '../.env' });

// Initialize Stripe with API key
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Log for debugging
console.log('Stripe initialization with key:', process.env.STRIPE_SECRET_KEY ? 'Key exists' : 'Key missing');
const { Order } = require('../db');

// Create a checkout session
router.post('/create-checkout-session', async (req, res) => {
  try {
    const { line_items, metadata, order_id, success_url, cancel_url } = req.body;

    if (!line_items || !line_items.length) {
      return res.status(400).json({ error: 'No line items provided' });
    }

    // Create the checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: success_url || `${req.headers.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancel_url || `${req.headers.origin}/cart`,
      metadata: {
        ...metadata,
        order_id
      }
    });

    // Update the order with the Stripe session ID
    if (order_id) {
      await Order.findByIdAndUpdate(order_id, {
        stripeSessionId: session.id,
        paymentStatus: 'pending'
      });
    }

    res.json({ id: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Webhook to handle Stripe events
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      
      // Update order status in database
      if (session.metadata && session.metadata.order_id) {
        await Order.findByIdAndUpdate(session.metadata.order_id, {
          paymentStatus: 'paid',
          orderStatus: 'processing'
        });
      }
      break;
      
    case 'payment_intent.payment_failed':
      const paymentIntent = event.data.object;
      
      // Update order status in database
      if (paymentIntent.metadata && paymentIntent.metadata.order_id) {
        await Order.findByIdAndUpdate(paymentIntent.metadata.order_id, {
          paymentStatus: 'failed'
        });
      }
      break;
      
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  res.send();
});

module.exports = router;