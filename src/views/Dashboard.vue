<template>
  <div>
    <h1>Welcome, User {{ discordId }}</h1>
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
  mounted() {
    this.discordId = localStorage.getItem('discordId');
    if (!this.discordId) this.$router.push('/');
  },
  methods: {
    logout() {
      localStorage.removeItem('discordId');
      this.$router.push('/');
    }
  }
}
</script>