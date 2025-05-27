// server/auth-server.js
import express from 'express';
import axios from 'axios';
import { URLSearchParams } from 'url';
import cors from 'cors';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import { createServer } from 'http';
import { Server } from 'socket.io';

dotenv.config({ path: '.env' });

const app = express();
const stripe = new Stripe(process.env.VITE_STRIPE_SECRET_KEY)
const port = 3001;

const httpServer = createServer(app);
const io = new Server(httpServer, { // Changed from app to httpServer
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

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


const players = {};
const randomInt = (min, max) => Math.floor(Math.random() * (max - min)) + min;

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Automatically create player on connection (don't wait for 'newplayer' event)
  players[socket.id] = {
    x: randomInt(100, 400),
    y: randomInt(100, 400)
  };

  // 1. Send the new player their own info immediately
  socket.emit('yourplayer', {
    id: socket.id,
    ...players[socket.id]
  });

  // 2. Send all existing players (except self) to the new client
  const otherPlayers = Object.keys(players)
    .filter(id => id !== socket.id)
    .map(id => ({ id, ...players[id] }));
  socket.emit('allplayers', otherPlayers);

  // 3. Tell everyone else about the new player
  socket.broadcast.emit('newplayer', {
    id: socket.id,
    ...players[socket.id]
  });

  socket.on('playermove', (data) => {
    if (players[socket.id]) {
      players[socket.id].x = data.x;
      players[socket.id].y = data.y;
      socket.broadcast.emit('playermoved', {
        id: socket.id,
        x: data.x,
        y: data.y
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    delete players[socket.id];
    io.emit('removeplayer', socket.id);
  });
});

httpServer.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});