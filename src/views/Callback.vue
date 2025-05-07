<script>
import axios from 'axios'

export default {
  async mounted() {
    try {
      const code = this.$route.query.code;
      const response = await axios.get('/.netlify/functions/auth', { // Note the corrected path
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
