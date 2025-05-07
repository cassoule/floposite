<template>
  <div v-if="user" style="width: fit-content; margin-bottom: 3rem">
    <div>
      <img :src="avatar" alt="avatar" width="70" style="border-radius: 50%;" />
      <h1>Salut <span style="color: #5865F2">@{{ user?.globalName }}</span> ^_^</h1>
      <p>Coins : {{ user?.coins }}</p>
      <p>Warns : {{ user?.allTimeWarns }}</p>
    </div>

    <button class="discord-logout my-3" @click="logout">Déconnexion</button>
  </div>
  <div v-else-if="users" style="width: fit-content; margin-bottom: 3rem">
    <div>
      <img :src="avatar" alt="avatar" width="70" style="border-radius: 50%;" />
      <h1>Salut <span style="color: #5865F2">{{ discordId }}</span> (⊙_⊙)？</h1>
      <p>Je crois qu'on ne se connait pas...</p>
    </div>

    <button class="discord-logout my-3" @click="logout">Déconnexion</button>
  </div>

  <div v-if="users" style="width: fit-content">
    <h2 style="display: flex; place-content: space-between">Classement <button style="border: none; background: transparent; text-decoration: none; cursor: pointer" @click="getUsers">🔄️</button></h2>
    <div style="float: right; border: 2px solid #dee0fc88; border-radius: 10px; padding: 5px; max-height: 600px; overflow-y: scroll;">
      <div v-for="akhy in users" :key="akhy.id" style="border-radius: 5px; border: 1px solid transparent" :style="akhy.id === discordId ? 'border: 2px solid #5865F2' : ''">
        <div style="display: flex; place-content: space-between; width: 250px; padding: .5em 1em"><span style="color: #ddd">@{{ akhy?.globalName }}</span> {{ akhy.coins }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  computed: {
    user() {
      const filtered = this.users?.filter(u => u.id === this.discordId)
      if (filtered?.length < 1) return null
      return this.users?.filter(u => u.id === this.discordId)[0]
    },
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
    await this.getAvatar()
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
    async getAvatar() {
      const fetchUrl = import.meta.env.VITE_FLAPI_URL + '/user/' + this.discordId + '/avatar'
      try {
        console.log(fetchUrl)
        const response = await axios.get(fetchUrl, {
          headers: {
            'ngrok-skip-browser-warning': 'true',
            'Content-Type': 'application/json'
          },
          withCredentials: false
        })
        this.avatar = response.data.avatarUrl
      } catch (e) {
        console.error('flAPI error:', e)
      }
    }
  }
}
</script>

<style>
.discord-logout {
  background: #A12829;
  color: white;
  padding: 12px 24px;
  border-radius: 4px;
  border: none;
  text-decoration: none;
  display: inline-block;
  margin-top: 20px;
  cursor: pointer;
  transition: 0.2s;
}
.discord-logout:hover {
  background: #aa3e3e;
}
</style>