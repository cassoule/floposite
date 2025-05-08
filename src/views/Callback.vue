<script>
import axios from 'axios'

export default {
  async mounted() {
    try {
      const code = this.$route.query.code;

      const DEV = import.meta.env.VITE_DEV_ENV ?? false;
      console.log('DEV_ENV:', import.meta.env.VITE_DEV_ENV)
      const endpoint = DEV ? 'http://localhost:3001/auth' : '/.netlify/functions/auth'

      const response = await axios.get(endpoint, {
        params: { code },
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('Auth response:', response.data);

      if (!response.data.discordId) {
        throw new Error('No Discord ID in response');
      }

      localStorage.setItem('discordId', response.data.discordId);
      this.$router.push('/dashboard');
    } catch (error) {
      console.error('Authentication failed:', error.response?.data || error.message);
      this.$router.push('/');
    }
  }
}
</script>

<template>
  <div class="callback">
    <p>Connexion...</p>
  </div>
</template>
