<template>
  <v-layout>
    <v-main class="d-flex" style="place-items: center; place-content: center">
      <div class="menu-container mt-16">
        <h2 class="text-white mb-4" style="text-align: start">Snake Game</h2>

        <v-card variant="tonal" rounded="xl">
          <v-card-text>
            <p>Gagne un FlopoCoin par pomme en solo et mesure toi à d'autres joueurs en 1v1.</p>
          </v-card-text>
          <v-card-actions class="d-flex pa-4 pt-0">
            <v-btn
              class="game-mode-btn"
              style="flex-grow: 1"
              variant="flat"
              color="#5862f2"
              rounded="lg"
              size="large"
              :disabled="isScreenTooSmall"
              @click="$router.push('/snake/solo')"
            >
              <div class="btn-content">
                <v-icon size="30" class="mr-2">mdi-account</v-icon>
                <span class="text-h5">Solo</span>
              </div>
            </v-btn>

            <v-btn
              class="game-mode-btn"
              style="flex-grow: 1"
              variant="flat"
              color="#5862f2"
              rounded="lg"
              size="large"
              :disabled="isScreenTooSmall"
              @click="$router.push('/snake/versus')"
            >
              <div class="btn-content">
                <v-icon size="30" class="mr-2">mdi-account-multiple</v-icon>
                <span class="text-h5">Versus</span>
                <v-chip class="ml-3 mt-1" color="dark" variant="flat" size="x-small">
                  Bêta v0.3
                </v-chip>
              </div>
            </v-btn>
          </v-card-actions>
        </v-card>
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

  data() {
    return {
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
    }
  },

  computed: {
    isScreenTooSmall() {
      return this.windowWidth < 800 //|| this.windowHeight < 870
    },
  },

  mounted() {
    const discordId = localStorage.getItem('discordId')
    if (!discordId) this.$router.push('/')

    window.addEventListener('resize', this.handleResize)
  },

  beforeUnmount() {
    window.removeEventListener('resize', this.handleResize)
  },

  methods: {
    handleResize() {
      this.windowWidth = window.innerWidth
      this.windowHeight = window.innerHeight
    },
  },
}
</script>

<style scoped>
.menu-container {
  padding: 2em;
}

.menu-buttons {
  display: flex;
  flex-direction: row;
  gap: 1.5em;
}

.game-mode-btn {
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
