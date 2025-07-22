<!-- Solitaire.vue -->
<template>
  <v-layout class="w-100">
    <v-main class="d-flex w-100 mb-16 pb-16 mt-16">
      <div class="w-100">
        <h1 class="text-white mb-4 d-flex w-100" style="position: relative; width: fit-content; place-items: center">
          Solitaire
          <v-spacer></v-spacer>
          <v-btn variant="flat" color="primary" rounded="lg" @click="handleRestart">Rejouer</v-btn>
        </h1>
        <div v-if="gameState" class="solitaire-board pb-16 mb-16">
          <div class="top-section">
            <div class="stock-and-waste">
              <Pile
                type="stock"
                :pile="gameState.stockPile"
                @stock-pile-clicked="handleDrawCard"
              />
              <Pile
                type="wastePile"
                :pile="gameState.wastePile"
                @drag-start-from-pile="handleDragStart"
              />
            </div>
            <div class="foundations">
              <Pile
                v-for="(pile, index) in gameState.foundationPiles"
                :key="'foundation-' + index"
                type="foundationPiles"
                :pile-index="index"
                :pile="pile"
                @drop-on-pile="handleDrop"
              />
            </div>
          </div>
          <div class="tableau-section">
            <Pile
              v-for="(pile, index) in gameState.tableauPiles"
              :key="'tableau-' + index"
              type="tableauPiles"
              :pile-index="index"
              :pile="pile"
              @drag-start-from-pile="handleDragStart"
              @drop-on-pile="handleDrop"
            />
          </div>
        </div>
        <div v-else>Chargement...</div>
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
import Pile from '../components/solitaire/Pile.vue';
import api from '../services/api'; // Adjust path if needed

export default {
  name: 'Solitaire',
  components: {
    Pile,
  },
  data() {
    return {
      gameState: null,
      draggedCardInfo: null, // Stores info about the card being dragged
      // In a real app, this would come from your auth system
      userId: null,
    };
  },
  async mounted() {
    // Fetch the initial game state when the component is created
    try {
      this.userId = localStorage.getItem('discordId')
      if (!this.userId) this.$router.push('/')

      const response = await this.fetchGameState(this.userId);
    } catch (error) {
      console.error('Failed to load game state:', error);
      if (!this.userId) this.$router.push('/')
    }
  },
  methods: {
    async handleRestart() {
      try {
        const response = await api.startNewGame(this.userId);
        this.gameState = response.data.gameState;
      } catch (error) {
        console.error('Failed to start new game:', error);
      }
    },

    async fetchGameState() {
      try {
        const response = await api.getGameState(this.userId);
        this.gameState = response.data.gameState;
      } catch (error) {
        console.error('Failed to load game state:', error);
      }
    },

    // Called when a drag operation starts from any valid pile.
    // The 'sourceInfo' object is now fully detailed.
    handleDragStart(sourceInfo) {
      this.draggedCardSourceInfo = sourceInfo;
    },

    // Called when a card is dropped onto a valid destination pile.
    async handleDrop(destinationInfo) {
      if (!this.draggedCardSourceInfo) return;

      // Combine the stored source info and the new destination info.
      const movePayload = {
        userId: this.userId,
        ...this.draggedCardSourceInfo,
        ...destinationInfo,
      };

      try {
        const response = await api.moveCard(movePayload);
        this.gameState = response.data.gameState; // Update the view with the new state
        if (response.data.win) {
          alert('C\'est gagné');
        }
      } catch (error) {
        // The backend correctly identifies invalid moves now.
        console.warn('Invalid move:', error.response.data.error);
      } finally {
        // IMPORTANT: Clear the drag info to prevent stale data
        this.draggedCardSourceInfo = null;
      }
    },

    async handleDrawCard() {
      try {
        const response = await api.drawCard(this.userId);
        this.gameState = response.data.gameState;
      } catch (error) {
        console.error('Failed to draw card:', error);
      }
    },
  },
};
</script>

<style scoped>
/* Add your CSS for the board layout here */
.solitaire-board {
  padding: 20px;
  border-radius: 10px;
}
.top-section,
.tableau-section {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}
.top-section {
  flex-wrap: wrap;
  gap: 1em;
}
.stock-and-waste,
.foundations,
.tableau-section {
  display: flex;
  gap: 15px;
}
.back-btn {
  position: absolute;
  top: 1rem;
  left: 1rem;
  border-radius: 12px;
}
</style>