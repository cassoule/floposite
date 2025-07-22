<template>
  <div v-if="gameState" class="solitaire-game">
    <div class="top-area">
      <Pile
        pileType="stockPile"
        :pileIndex="0"
        :cards="gameState.stockPile || []"
        @drag-start="handleDragStart"
        @drag-end="handleDragEnd"
        @empty-pile-clicked="handleEmptyPileClick"
      />

      <Pile
        pileType="wastePile"
        :pileIndex="0"
        :cards="gameState.wastePile || []"
        @drag-start="handleDragStart"
        @drag-end="handleDragEnd"
        @empty-pile-clicked="handleEmptyPileClick"
      />
      <button @click="drawCard">Draw Card</button>

      <Pile
        v-for="(pile, index) in gameState.foundationPiles"
        :key="'foundation-' + index"
        pileType="foundationPiles"
        :pileIndex="index"
        :cards="pile"
        @drag-start="handleDragStart"
        @drag-end="handleDragEnd"
        @empty-pile-clicked="handleEmptyPileClick"
      />
    </div>

    <div class="card-piles">
      <Pile
        v-for="(pile, index) in gameState.tableauPiles"
        :key="'tableau-' + index"
        pileType="tableauPiles"
        :pileIndex="index"
        :cards="pile"
        @drag-start="handleDragStart"
        @drag-end="handleDragEnd"
        @empty-pile-clicked="handleEmptyPileClick"
      />
    </div>
  </div>
  <div v-else>
    Chargement...
  </div>
</template>

<script>
import { ref } from 'vue';
import axios from 'axios';
import Pile from '../components/solitaire/Pile.vue';

export default {
  components: {
    Pile,
  },
  setup() {
    const discordId = ref(null)
    const gameState = ref(null)
    const draggedCard = ref(null)

    const fetchGameState = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_FLAPI_URL}/solitaire/state/${discordId.value}`)

        gameState.value = {...response.data.gameState}
      } catch (e) {
        console.error('Failed to fetch game state', e)
      }
    }

    const drawCard = async () => {
      try {
        const response = await axios.post(`${import.meta.env.VITE_FLAPI_URL}/solitaire/draw`, { userId: discordId.value })
        gameState.value = {...response.data.gameState}
      } catch (e) {
        console.error('Failed to draw card')
      }
    }

    const handleCardSelected = async (cardInfo) => {
      console.log(gameState)
    }

    const handleDragStart = async (cardInfo) => {
      draggedCard.value = cardInfo
    }

    const handleDragEnd = async (cardInfo) => {
      try {
        const moveParams = {
          userId: discordId.value,
          sourcePile: draggedCard.value.pileType,
          sourceCardIndex: draggedCard.value.cardIndex,
          destPile: cardInfo.pileType,
          destPileIndex: cardInfo.pileIndex
        };

        const response = await axios.post(`${import.meta.env.VITE_FLAPI_URL}/solitaire/move`, moveParams);

        gameState.value = {...response.data.gameState}
      } catch (e) {
        console.error('Failed to move card', e)
      } finally {
        draggedCard.value = null
      }
    }

    const handleEmptyPileClick = async (pileType, pileIndex) => {
      if (!draggedCard.value) return
      //Make move
      try {
        const response = await axios.post(`${import.meta.env.VITE_FLAPI_URL}/solitaire/move`, {
          userId: discordId.value,
          sourcePile: draggedCard.value.pileType,
          sourceCardIndex: draggedCard.value.cardIndex,
          destPile: 'empty',
        })
        gameState.value = {...response.data.gameState}
      } catch (e) {
        console.error('Failed to move card')
      }
    }

    return {fetchGameState, discordId, gameState, drawCard, handleCardSelected, handleDragStart, handleDragEnd, handleEmptyPileClick, draggedCard }
  },

  async mounted() {
    this.discordId = localStorage.getItem('discordId')
    if (!this.discordId) this.$router.push('/')

    await this.fetchGameState()
  }
}
</script>

<style scoped>
.solitaire-game {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}

.top-area {
  display: flex;
  justify-content: space-around;
  width: 100%;
  margin-bottom: 20px;
}

.card-piles {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
}
</style>