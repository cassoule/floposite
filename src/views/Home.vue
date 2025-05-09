<template>
  <div class="login">
    <h1 style="font-size: 3em"><span style="color: #5865F2">Flopo</span>Site</h1>
    <p>Connectes-toi via <span style="color: #5865F2">Discord</span> 👇</p>
<!--    <a :href="discordAuthUrl" class="discord-login">
      Connexion
    </a>-->
    <a :href="discordAuthUrl">
      <button class="btn-login">
        <span>Connexion</span>
        <div class="shine"></div>
      </button>
    </a>
  </div>
</template>

<script>
export default {
  computed: {
    discordAuthUrl() {
      const clientId = import.meta.env.VITE_DISCORD_CLIENT_ID
      const redirectUri = encodeURIComponent(import.meta.env.VITE_REDIRECT_URI)
      return `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=identify`
    }
  }
}
</script>

<style>
.discord-login {
  background: #5865F2;
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
  transition: all .3s ease;
}

.btn-login::before {
  content: '';
  position: absolute;
  inset: -2px;
  background: linear-gradient(45deg, #5865f2, #7984f5);
  border-radius: 14px;
  z-index: -1;
  transition: all .3s ease;
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
  transform: scale(.95);
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
  transition: transform .5s ease;
  z-index: 0;
}

.btn-login:hover .shine {
  transform: translateX(100%);
}


</style>