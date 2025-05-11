<template>
  <div class="login">
    <div>
      <h1 style="font-size: 3em"><span style="color: #5865f2">Flopo</span>Site</h1>
      <p>Connectes-toi via <span style="color: #5865f2">Discord</span> 👇</p>
      <a :href="discordAuthUrl">
        <button class="btn-login">
          <span>Connexion</span>
          <div class="shine"></div>
        </button>
      </a>
    </div>
  </div>

  <div class="flopo-img">
    <v-img class="flopobot" src="flopobot.webp"></v-img>
  </div>

  <div class="flopo-img-sm">
    <v-img src="flopobot.webp" width="200px"></v-img>
  </div>

  <toast v-if="toastStore.show" :key="toastStore.toastKey" />
</template>

<script>
import Toast from '@/components/Toast.vue'
import { useToastStore } from '@/stores/toastStore.js'

export default {
  components: { Toast },

  setup() {
    const toastStore = useToastStore()

    return {
      toastStore: toastStore.$state,
    }
  },

  computed: {
    discordAuthUrl() {
      const clientId = import.meta.env.VITE_DISCORD_CLIENT_ID
      const redirectUri = encodeURIComponent(import.meta.env.VITE_REDIRECT_URI)
      return `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=identify`
    },
  },
}
</script>

<style>
.discord-login {
  background: #5865f2;
  color: white;
  padding: 12px 24px;
  border-radius: 10px;
  text-decoration: none;
  display: inline-block;
  margin-top: 20px;
}

.btn-login {
  box-sizing: border-box;
  position: relative;
  margin-top: 40px;
  padding: 12px 40px;
  font-size: 1em;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #ddd;
  background: #1c2526;
  border-radius: 12px;
  cursor: pointer;
  overflow: hidden !important;
  z-index: 1;
  pointer-events: all;
  transition: all 0.3s ease;
}

.btn-login::before {
  content: '';
  position: absolute;
  inset: -2px;
  background: linear-gradient(45deg, #5865f2, #7984f5);
  border-radius: 14px;
  z-index: -1;
  transition: all 0.3s ease;
}

.btn-login::after {
  content: '';
  position: absolute;
  inset: 2px;
  background: #1c2526;
  border-radius: 10px;
  z-index: -1;
}

.btn-login:hover {
  transform: scale(1.03);
}

.btn-login:hover::before {
  filter: blur(1px);
}

.btn-login:active {
  transform: scale(0.95);
}

.shine {
  box-sizing: border-box;
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(120deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transform: translateX(-100%);
  transition: transform 0.5s ease;
  z-index: 0;
}

.btn-login:hover .shine {
  transform: translateX(100%);
}

.login {
  display: flex;
  place-content: center;
  place-items: center;
  pointer-events: none;
}

.flopo-img {
  position: fixed;
  top: -50vh;
  right: -25vw;
  width: 150vw;
  height: 200vh;
  background: linear-gradient(-90deg, #5865f255, transparent);
  background-position: center;
  background-size: cover;
  border-radius: 20px;
  transform-style: preserve-3d;
  transition: transform 0.1s ease;
}

.flopobot {
  position: absolute;
  top: 50%;
  left: 65%;
  width: 300px;
  transform: translate(-50%, -50%) translateZ(175px);
}

.flopo-img-sm {
  position: absolute;
  bottom: 50px;
  right: 10px;
  display: none;
}

@media (max-width: 850px) {
  /*html {
    height: 100vh !important;
    width: 100vw !important;
    overflow: hidden !important;
  }*/
  .flopo-img {
    display: none;
    position: absolute;
    background: transparent;
    top: -10vh;
    height: 120vh;
  }

  .flopobot {
    position: absolute;
    top: 70%;
    left: 70%;
  }

  .flopo-img-sm {
    display: flex;
  }

  .login {
    margin-top: 10rem;
  }
}
</style>