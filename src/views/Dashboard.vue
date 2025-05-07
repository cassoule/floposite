<template>
  <div v-if="user" style="width: fit-content; margin-top: 5rem; margin-bottom: 3rem">
    <div style="margin-top: 1rem">
      <v-img :src="avatar" width="70" style="border-radius: 50%;" />
      <h1 class="mb-3">Salut <span style="color: #5865F2">@{{ user?.globalName }}</span> ^_^</h1>
      <p>Coins : {{ user?.coins }}</p>
      <p>Warns : {{ user?.allTimeWarns }}</p>
    </div>

    <div class="mt-5">
      <v-dialog transition="dialog-bottom-transition" max-width="800">
        <template #activator="{ props: activatorProps }">
          <v-btn v-bind="activatorProps" text="Fonctions" color="primary" variant="flat"></v-btn>
        </template>
        <template #default="{ isActive }">
          <v-card class="text-text" color="dark" variant="flat" style=" border: 1px solid #5865f222" rounded="lg">
            <v-card-title style="background: radial-gradient(circle at -200% -300%,#5865f2,#181818 100%);">
              Fonctions
            </v-card-title>
            <v-card-item>
              Coucou
            </v-card-item>
            <v-card-actions>
              <v-btn text="Fermer" @click="isActive.value = false"></v-btn>
            </v-card-actions>
          </v-card>
        </template>
      </v-dialog>
    </div>

    <button class="discord-logout" @click="logout">Déconnexion</button>
  </div>

  <div v-else-if="users" style="width: fit-content; margin-top: 5rem; margin-bottom: 3rem">
    <div>
      <v-img :src="avatar" width="70" style="border-radius: 50%;" />
      <h1 class="mb-3">Salut <span style="color: #5865F2">{{ discordId }}</span> (⊙_⊙)？</h1>
      <p>Je crois qu'on ne se connait pas...</p>
    </div>

    <button class="discord-logout" @click="logout">Déconnexion</button>
  </div>

  <div v-if="users" class="leaderboard-container">
    <h2 style="display: flex; place-content: space-between">Classement</h2>
    <div class="leaderboard">
      <div v-for="akhy in users" :key="akhy.id" style="border-radius: 10px;" :style="akhy.id === discordId ? 'background: radial-gradient(circle at -100% -300%,#5865f2,#181818 100%)' : ''">
        <div style="display: flex; place-content: space-between; min-width: 300px; width: 100%; padding: .5em 1em"><span style="color: #ddd">@{{ akhy?.globalName }}</span> {{ akhy.coins }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import { io } from 'socket.io-client';

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
      socket: null,
    }
  },

  async mounted() {
    this.discordId = localStorage.getItem('discordId');
    if (!this.discordId) this.$router.push('/');

    await this.getUsers()
    await this.getAvatar()
    if (!this.users) this.$router.push('/');

    this.initSocket();
  },

  methods: {
    initSocket() {
      // Connect to your bot's Socket.IO server
      this.socket = io(import.meta.env.VITE_FLAPI_URL, {
        withCredentials: false,
        extraHeaders: {
          'ngrok-skip-browser-warning': 'true'
        }
      });

      // Handle connection events
      this.socket.on('connect', () => {
        console.log('Connected to WebSocket server');
      });

      // Listen for data updates
      this.socket.on('data-updated', (data) => {
        console.log('Database updated:', data);
        this.getUsers(); // Refresh data when updates occur
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from WebSocket server');
      });
    },

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
  },

  beforeUnmount() {
    // Clean up socket connection when component is destroyed
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}
</script>

<style>
.discord-logout {
  position: fixed;
  top: 2em;
  right: 2em;
  background: #A12829;
  color: white;
  padding: 7px 17px;
  border-radius: 10px;
  border: none;
  text-decoration: none;
  display: inline-block;
  cursor: pointer;
  transition: 0.2s;
}
.discord-logout:hover {
  background: #aa3e3e;
}
.leaderboard-container {
  width: fit-content;
  margin-top: 5rem
}
.leaderboard {
  float: right;
  border: 2px solid #dee0fc88;
  border-radius: 15px;
  padding: 6px 5px;
  max-height: 600px;
  overflow-y: scroll;
}
@media (max-width: 850px) {
  .leaderboard {
    width: 100%;
  }
  .leaderboard-container {
    width: 100%;
    margin-top: 0;
  }
}
</style>