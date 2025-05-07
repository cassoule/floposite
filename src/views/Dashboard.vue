<template>
  <div>
    <h1>Salut {{ discordId }} :)</h1>
    <!-- Add your user-specific content here -->
    <button @click="logout">Logout</button>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  data() {
    return {
      discordId: null
    }
  },
  async mounted() {
    this.discordId = localStorage.getItem('discordId');
    if (!this.discordId) this.$router.push('/');
    await this.getUsers()
  },
  methods: {
    logout() {
      localStorage.removeItem('discordId');
      this.$router.push('/');
    },
    async getUsers() {
      const fetchUrl = import.meta.env.VITE_FLAPI_URL + '/users'
      try {
        console.log(fetchUrl)
        const response = await axios.get(fetchUrl, {
          headers: {
            'Access-Control-Allow-Origin': 'https://floposite.netlify.app',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, ngrok-skip-browser-warning',
            'ngrok-skip-browser-warning': 'true',
            'Content-Type': 'application/json'
          },
          withCredentials: false
        })
        console.log('flAPI users :')
        console.log(response.data)
      } catch (e) {
        console.error('flAPI error:', e)
      }
    }
  }
}
</script>