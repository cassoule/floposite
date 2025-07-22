<!-- Pile.vue -->
<template>
  <div
    :class="['pile', type]"
    @click="onPileClick"
    @dragover.prevent
    @drop.prevent="onDrop"
  >
    <!-- Placeholder for empty tableau/foundation piles -->
    <div v-if="pile.length === 0" class="empty-pile-placeholder"></div>

    <Card
      v-for="(card, index) in pile"
      :key="card.suit + card.rank"
      :card="card"
      :card-index="index"
      :style="{ top: type === 'tableauPiles' ? `${index * 25}px` : '0' }"
      class="card-in-pile"
      @card-drag-started="handleCardDrag"
    />
  </div>
</template>

<script>
import Card from './Card.vue';

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
  methods: {
    handleCardDrag(cardIndex) {
      // Create the complete "source" object.
      const sourceInfo = {
        sourcePileType: this.type,
        sourcePileIndex: this.pileIndex, // This will be the index (0-6) for tableau, or null for waste
        sourceCardIndex: cardIndex,   // This is the index of the specific card that was dragged
      };
      // Emit this detailed object up to the parent (Solitaire.vue).
      this.$emit('drag-start-from-pile', sourceInfo);
    },
    // Emits the drop info up to the parent
    onDrop() {
      // Create the complete "destination" object.
      const destinationInfo = {
        destPileType: this.type,
        destPileIndex: this.pileIndex,
      };
      // Emit this detailed object up to the parent.
      this.$emit('drop-on-pile', destinationInfo);
    },

    // Handles clicks, specifically for the stock pile.
    onPileClick() {
      if (this.type === 'stock') {
        this.$emit('stock-pile-clicked');
      }
    },
  },
};
</script>

<style scoped>
.pile {
  position: relative;
  width: 100px; /* Adjust card width */
  height: 140px; /* Adjust card height */
  border: 2px solid #555;
  border-radius: 5px;
}
.empty-pile-placeholder {
  width: 100%;
  height: 100%;
}
.card-in-pile {
  position: absolute;
  left: 0;
}
</style>