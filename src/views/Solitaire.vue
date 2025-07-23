<!-- Solitaire.vue -->
<template>
  <v-layout class="w-100">
    <v-main class="d-flex w-100 mb-16 pb-16 mt-8">
      <div class="w-100">
        <h1 class="text-white mb-4 d-flex w-100" style="position: relative; width: fit-content; place-items: center">
          Solitaire
          <v-spacer></v-spacer>
          <v-btn variant="flat" color="primary" rounded="lg" @click="handleRestart">Rejouer</v-btn>
        </h1>
        <div v-if="isLoading" class="loading-overlay">
          <div class="spinner">Chargement...</div>
        </div>
        <div v-if="gameState" class="solitaire-board pb-16 mb-16" :key="Date.now()">
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
                @drag-start-from-pile="handleDragStart"
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
      draggedCardSourceInfo: null, // Stores info about the card being dragged
      // In a real app, this would come from your auth system
      userId: null,
      isLoading: false,
    };
  },
  async mounted() {
    // Fetch the initial game state when the component is created
    try {
      this.userId = localStorage.getItem('discordId')
      if (!this.userId) this.$router.push('/')

      this.isLoading = true;
      const response = await this.fetchGameState(this.userId);
      this.isLoading = false;
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
      if (this.isLoading) return;
      this.draggedCardSourceInfo = sourceInfo;
    },

    // Called when a card is dropped onto a valid destination pile.
    async handleDrop(destinationInfo) {
      if (!this.draggedCardSourceInfo || this.isLoading) return;

      this.isLoading = true;

      const oldState = JSON.parse(JSON.stringify(this.gameState));

      // Combine the stored source info and the new destination info.
      const movePayload = {
        userId: this.userId,
        ...this.draggedCardSourceInfo,
        ...destinationInfo,
      };

      this.performLocalMove(movePayload);
      this.draggedCardSourceInfo = null;

      try {
        const response = await api.moveCard(movePayload);
        if (response.data.win) {
          alert('C\'est gagné');
        }
      } catch (error) {
        // The backend correctly identifies invalid moves now.
        console.warn('Invalid move:', error.response.data.error);
        this.gameState = oldState;
      } finally {
        this.isLoading = false;
      }
    },

    performLocalMove(moveData) {
      const { sourcePileType, sourcePileIndex, sourceCardIndex, destPileType, destPileIndex } = moveData;

      const sourcePile = sourcePileType === 'tableauPiles'
        ? this.gameState.tableauPiles[sourcePileIndex]
        : this.gameState.wastePile;

      const destPile = destPileType === 'tableauPiles'
        ? this.gameState.tableauPiles[destPileIndex]
        : this.gameState.foundationPiles[destPileIndex];

      const cardsToMove = sourcePile.splice(sourceCardIndex);
      destPile.push(...cardsToMove);

      if (sourcePileType === 'tableauPiles' && sourcePile.length > 0) {
        sourcePile[sourcePile.length - 1].faceUp = true;
      }
    },

    async handleDrawCard() {
      const oldState = JSON.parse(JSON.stringify(this.gameState));

      /*if (this.gameState.stockPile.length > 0) {
        const card = this.gameState.stockPile.pop();
        card.faceUp = true;
        this.gameState.wastePile.push(card);
      } else {
        this.gameState.stockPile = this.gameState.wastePile.reverse();
        this.gameState.stockPile.forEach(c => c.faceUp = false);
        this.gameState.wastePile = [];
      }*/

      try {
        this.isLoading = true
        const response = await api.drawCard(this.userId);
        console.log(response.data.gameState)
        this.gameState = {...response.data.gameState}
        this.isLoading = false
        await this.fetchGameState()
      } catch (error) {
        console.error('Failed to draw card:', error);
        this.gameState = oldState;
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
.loading-overlay {
  position: absolute;
  bottom: 0;
}
</style>