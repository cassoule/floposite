// netlify/functions/auth.js
import axios from 'axios'
import Stripe from 'stripe';

export const handler = async (event) => {
  const amount = event.queryStringParameters?.amount

  if (!amount) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing amount' })
    }
  }

  try {
    const stripe = new Stripe(process.env.VITE_STRIPE_SECRET_KEY)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'eur',
      payment_method_types: ['card'],
      capture_method: 'automatic',
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        clientSecret: paymentIntent.client_secret,
      })
    }
  } catch (err) {
    console.log(err)
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: err.message,
      })
    }
  }
}