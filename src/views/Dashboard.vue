<template>
  <div>
    <h1>Salut {{ discordId }} :)</h1>
    <!-- Add your user-specific content here -->
    <button @click="logout">Logout</button>
  </div>
</template>

<script>
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
      const fetchUrl = process.env.FLAPI_URL + '/users'
      const response = await fetch(fetchUrl)
        .then(response => {
          if (!response.ok) {
            throw new Error('Error fetching flAPI users')
          }
          return response.json()
        })
        .catch(err => {
          console.error('Error with flAPI:', err)
        })
      console.log('flAPI users :')
      console.log(response)
    }
  }
}
</script>