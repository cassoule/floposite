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
        console.log(import.meta.env.VITE_REDIRECT_URI)
        console.log(import.meta.env.VITE_FLAPI_URL)
        console.log(import.meta.env.FLAPI_URL)
        const response = await axios.get(fetchUrl)
        console.log('flAPI users :')
        console.log(response)
      } catch (e) {
        console.error('flAPI error:', e)
      }
    }
  }
}
</script>