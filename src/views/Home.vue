<template>
  <div class="login">
    <h1 style="font-size: 3em"><span style="color: #5865F2">Flopo</span>Site</h1>
    <p>Connectes-toi via <span style="color: #5865F2">Discord</span> 👇</p>
    <a :href="discordAuthUrl" class="discord-login">
      Connexion
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
</style>