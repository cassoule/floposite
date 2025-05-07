<template>
  <div v-if="user">
    <h1>Salut @{{ user?.globalName }} :)</h1>
    <p>Coins : {{ user?.coins }}</p>
    <p>Warns : {{ user?.allTimeWarns }}</p>
    <img :src="getAvatar" alt="avatar" />
    <!-- Add your user-specific content here -->
    <button @click="logout">Logout</button>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  computed: {
    user() {
      const filtered = this.users?.filter(u => u.id === this.discordId)
      if (filtered.length < 1) return null
      return this.users?.filter(u => u.id === this.discordId)[0]
    },
    getAvatar() {
      const fetchUrl = import.meta.env.VITE_FLAPI_URL + '/user/' + this.discordId + '/avatar'
      try {
        console.log(fetchUrl)
        const response = axios.get(fetchUrl, {
          headers: {
            'ngrok-skip-browser-warning': 'true',
            'Content-Type': 'application/json'
          },
          withCredentials: false
        }).then((response) => {
          console.log(response.data.avatarUrl)
          return response.data.avatarUrl
        })
      } catch (e) {
        console.error('flAPI error:', e)
      }
    }
  },
  data() {
    return {
      discordId: null,
      users: null,
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
            'ngrok-skip-browser-warning': 'true',
            'Content-Type': 'application/json'
          },
          withCredentials: false
        })
        this.users = response.data
      } catch (e) {
        console.error('flAPI error:', e)
      }
    },
  }
}
</script>