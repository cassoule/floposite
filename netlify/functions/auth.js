// netlify/functions/auth.js
import axios from 'axios'

export const handler = async (event) => {
  const code = event.queryStringParameters?.code

  if (!code) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing authorization code' })
    }
  }

  try {
    const params = new URLSearchParams()
    params.append('client_id', process.env.DISCORD_CLIENT_ID)
    params.append('client_secret', process.env.DISCORD_CLIENT_SECRET)
    params.append('grant_type', 'authorization_code')
    params.append('code', code)
    params.append('redirect_uri', process.env.REDIRECT_URI)
    params.append('scope', 'identify')

    const tokenResponse = await axios.post(
      'https://discord.com/api/oauth2/token',
      params,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    )

    const userResponse = await axios.get('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` }
    })

    console.log(userResponse.data)

    return {
      statusCode: 200,
      body: JSON.stringify({
        discordId: userResponse.data.id,
        username: userResponse.data.username
      })
    }
  } catch (error) {
    console.error('Full error:', error.response?.data || error.message)
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: 'Discord authentication failed',
        discordError: error.response?.data || error.message
      })
    }
  }
}