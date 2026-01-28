<template>
  <v-layout>
    <v-main class="d-flex" style="place-items: center; place-content: center">
      <div class="menu-container">
        <h2 class="text-white mb-8" style="font-size: 3em; text-align: center">Snake</h2>

        <div class="menu-buttons">
          <v-btn
            class="game-mode-btn"
            color="#5862f2"
            size="x-large"
            rounded="xl"
            @click="$router.push('/snake/solo')"
          >
            <div class="btn-content">
              <v-icon size="30" class="mr-2">mdi-account</v-icon>
              <span class="text-h5">Mode Solo</span>
            </div>
          </v-btn>

          <v-btn
            class="game-mode-btn"
            color="#5862f2"
            size="x-large"
            rounded="xl"
            @click="$router.push('/snake/versus')"
          >
            <div class="btn-content">
              <v-icon size="30" class="mr-2">mdi-account-multiple</v-icon>
              <span class="text-h5">Mode 1v1</span>
            </div>
          </v-btn>
        </div>
      </div>
    </v-main>

    <v-btn
      class="back-btn text-none"
      text="Retour"
      variant="tonal"
      color="#ddd"
      @click="$router.push('/dashboard')"
    ></v-btn>
  </v-layout>
</template>

<script>
export default {
  name: 'SnakeMenu',

  mounted() {
    const discordId = localStorage.getItem('discordId')
    if (!discordId) this.$router.push('/')
  },
}
</script>

<style scoped>
.menu-container {
  max-width: 600px;
  padding: 2em;
}

.menu-buttons {
  display: flex;
  flex-direction: column;
  gap: 1.5em;
}

.game-mode-btn {
  width: 100%;
  height: 70px !important;
  font-weight: 600;
  text-transform: none;
  letter-spacing: normal;
}

.btn-content {
  display: flex;
  align-items: center;
  justify-content: center;
}

.info-section {
  text-align: center;
  padding: 1.5em;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
}

.info-section p {
  margin: 0.5em 0;
  font-size: 0.95em;
}

.back-btn {
  position: fixed;
  top: 20px;
  left: 20px;
  border-radius: 10px;
}
</style>
