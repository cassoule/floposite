<template>
  <div v-if="users">
    <h1>Salut @{{ user?.globalName }} :)</h1>
    <p>Coins : {{ user?.coins }}</p>
    <p>Warns : {{ user?.allTimeWarns }}</p>
    <img :src="getAvatar(discordId)" alt="avatar" />
    <!-- Add your user-specific content here -->
    <button @click="logout">Logout</button>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  computed: {
    user() {
      return this.users?.filter(u => u.id === this.discordId)[0]
    }
  },
  data() {
    return {
      discordId: null,
      users: null,
      avatar: null,
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
    async getAvatar(id) {
      const fetchUrl = import.meta.env.VITE_FLAPI_URL + '/user/' + id + '/avatar'
      try {
        console.log(fetchUrl)
        const response = await axios.get(fetchUrl, {
          headers: {
            'ngrok-skip-browser-warning': 'true',
            'Content-Type': 'application/json'
          },
          withCredentials: false
        })
        console.log(response.data)
        this.avatar = response.data
      } catch (e) {
        console.error('flAPI error:', e)
      }
    }
  }
}
</script>