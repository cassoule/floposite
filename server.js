// server.js (using ES modules)
import dotenv from 'dotenv';
import express from 'express';
import axios from 'axios';
import cors from 'cors';
import { URLSearchParams } from 'url';

dotenv.config();

const app = express();
app.use(cors());

// Discord auth endpoint
app.get('/api/auth', async (req, res) => {
  try {
    const code = req.query.code;

    // Exchange code for token
    const tokenResponse = await axios.post(
      'https://discord.com/api/oauth2/token',
      new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: process.env.REDIRECT_URI
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    // Get user data
    const userResponse = await axios.get('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${tokenResponse.data.access_token}`
      }
    });

    res.json({
      discordId: userResponse.data.id,
      username: userResponse.data.username
    });

  } catch (error) {
    console.error('Auth error:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Authentication failed',
      details: error.response?.data || error.message
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});