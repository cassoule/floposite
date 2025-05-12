// server/auth-server.js
import express from 'express';
import axios from 'axios';
import { URLSearchParams } from 'url';
import cors from 'cors';
import dotenv from 'dotenv';
import Stripe from 'stripe';

dotenv.config({ path: '.env' });

const app = express();
const stripe = new Stripe(process.env.VITE_STRIPE_SECRET_KEY)
const port = 3001;

// Enable CORS for all routes
app.use(cors({
  origin: 'http://localhost:5173', // Frontend origin
  credentials: false
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/auth', async (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.status(400).json({ error: 'Missing authorization code' });
  }

  try {
    const tokenResponse = await axios.post(
      'https://discord.com/api/oauth2/token',
      new URLSearchParams({
        client_id: process.env.VITE_DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: process.env.VITE_REDIRECT_URI
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const userResponse = await axios.get('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${tokenResponse.data.access_token}`
      }
    });

    res.json({
      discordId: userResponse.data.id,
    });
  } catch (error) {
    console.error('FULL ERROR OBJECT:', error);
    console.error('ERROR RESPONSE DATA:', error.response?.data);
    console.error('ERROR CONFIG:', error.config);
    res.status(500).json({
      error: 'Authentication failed',
      details: error.response?.data || error.message,
    });
  }
});

app.get('/test-env', (req, res) => {
  res.json({
    clientId: !!process.env.VITE_DISCORD_CLIENT_ID,
    clientSecret: !!process.env.DISCORD_CLIENT_SECRET,
    redirectUri: !!process.env.VITE_REDIRECT_URI
  });
});

app.post('/create-payment-intent', async (req, res) => {
  console.log(req.body)
  try {
    const { amount } = req.body;


    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'eur',
      payment_method_types: ['card'],
      capture_method: 'automatic',
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.log(err)
    res.status(500).json({ error: err.message });
  }
})

app.listen(port, () => {
  console.log(`Auth server running on http://localhost:${port}`);
});