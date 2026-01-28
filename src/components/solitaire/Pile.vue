<!-- Pile.vue -->
<template>
  <div :class="['pile', type]" @click="onPileClick" @dragover.prevent @drop.prevent="onDrop">
    <!-- Placeholder for empty tableau/foundation piles -->
    <div v-if="pile.length === 0" class="empty-pile-placeholder"></div>

    <Card
      v-for="(card, index) in pile"
      :key="card.suit + card.rank"
      :card="card"
      :card-index="index"
      :style="cardStyle(index)"
      class="card-in-pile"
      @card-drag-started="handleCardDrag"
      @card-drag-ended="handleCardDragEnd"
      @card-clicked="handleCardClick"
      :is-hidden="dragStartIndex !== null && index >= dragStartIndex && card.faceUp"
    />
  </div>
</template>

<script>
import Card from './Card.vue'

const CARD_WIDTH = 100
const CARD_HEIGHT = 145
const STACK_OFFSET = 25

export default {
  name: 'Pile',
  components: {
    Card,
  },
  props: {
    pile: {
      type: Array,
      required: true,
    },
    type: {
      type: String, // e.g., 'tableauPiles', 'foundationPiles', 'stock', 'wastePile'
      required: true,
    },
    pileIndex: {
      type: Number, // Index for tableau and foundation piles
      default: null,
    },
  },
  data() {
    return {
      dragStartIndex: null,
    }
  },
  methods: {
    cardStyle(index) {
      switch (this.type) {
        case 'tableauPiles':
          return `top: ${index * 25}px`
        case 'wastePile':
          let leftM = 0
          if (this.pile.length === 2) {
            leftM = index >= this.pile.length - 2 ? (index - this.pile.length + 2) * 10 : 0
          } else if (this.pile.length > 2) {
            leftM = index >= this.pile.length - 3 ? (index - this.pile.length + 3) * 10 : 0
          }
          return `left: ${leftM}px`
        default:
          return `top: 0px`
      }
    },
    handleCardDrag(event, cardIndex) {
      this.dragStartIndex = this.type === 'wastePile' ? this.pile.length - 1 : cardIndex

      // Create the complete "source" object.
      const stackToDrag =
        this.type === 'tableauPiles'
          ? this.pile.slice(cardIndex)
          : [this.pile[this.pile.length - 1]]

      const previewElement = this.createDragPreview(stackToDrag)

      document.body.appendChild(previewElement)

      const xOffset = CARD_WIDTH / 2
      const yOffset = CARD_HEIGHT / 10

      event.dataTransfer.setDragImage(previewElement, xOffset, yOffset)

      setTimeout(() => {
        document.body.removeChild(previewElement)
      }, 0)

      const sourceInfo = {
        sourcePileType: this.type,
        sourcePileIndex: this.pileIndex, // This will be the index (0-6) for tableau, or null for waste
        sourceCardIndex: cardIndex, // This is the index of the specific card that was dragged
      }
      // Emit this detailed object up to the parent (Solitaire.vue).
      this.$emit('drag-start-from-pile', sourceInfo)
    },
    handleCardDragEnd() {
      // Reset the dragStartIndex, making all cards in this pile visible again.
      this.dragStartIndex = null
    },
    // Emits the drop info up to the parent
    onDrop() {
      // Create the complete "destination" object.
      const destinationInfo = {
        destPileType: this.type,
        destPileIndex: this.pileIndex,
      }
      // Emit this detailed object up to the parent.
      this.$emit('drop-on-pile', destinationInfo)
    },

    // Handles clicks, specifically for the stock pile.
    onPileClick() {
      if (this.type === 'stock') {
        this.$emit('stock-pile-clicked')
      }
    },

    createDragPreview(cards) {
      const container = document.createElement('div')
      // Style the container to be invisible and hold the stack
      container.style.position = 'absolute'
      container.style.top = '-9999px' // Position off-screen
      container.style.left = '-9999px'
      container.style.zIndex = '-1' // Ensure it's not interactable

      // Add each card image to the container with a staggered offset
      cards.forEach((card, index) => {
        const img = document.createElement('img')
        img.src = `/cards/webp/${card.rank}${card.suit}.webp`
        // Style the individual card images
        img.style.position = 'absolute'
        img.style.width = `${CARD_WIDTH}px` // Same as your Card.vue component
        img.style.height = `${CARD_HEIGHT}px`
        img.style.left = '0'
        img.style.top = `${index * STACK_OFFSET}px` // The stacking effect
        img.style.borderRadius = '5px'
        img.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)' // Add a nice shadow

        if (card.faceUp) {
          container.appendChild(img)
        }
      })

      return container
    },

    handleCardClick(cardIndex) {
      const sourceInfo = {
        sourcePileType: this.type,
        sourcePileIndex: this.pileIndex,
        sourceCardIndex: cardIndex,
      }

      this.$emit('auto-move-triggered', sourceInfo)
    },
  },
}
</script>

<style scoped>
.pile {
  position: relative;
  width: 100px; /* Adjust card width */
  height: 145px; /* Adjust card height */
  border: 2px solid #555;
  border-radius: 5px;
}
.stockPile {
  cursor: pointer !important;
}
.empty-pile-placeholder {
  width: 100%;
  height: 100%;
}
.card-in-pile {
  position: absolute;
  left: 0;
}
@media (max-width: 850px) {
  .pile {
    width: 50px;
    height: 72px;
    border: 1px solid #555;
  }
}
@media (max-width: 550px) {
  .pile {
    width: 33px;
    height: 47px;
  }
}
</style>
