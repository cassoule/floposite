<!-- Card.vue -->
<template>
  <div
    class="bg-white rounded"
    :class="['card-container', { 'is-hidden': isHidden }]"
    :draggable="card.faceUp"
    @dragstart.stop="onDragStart"
    @dragend.stop="onDragEnd"
    @click="onClick"
  >
    <img
      v-if="card.faceUp"
      :src="`/cards/webp/${card.rank}${card.suit}.webp`"
      :alt="`${card.rank} of ${card.suit}`"
      class="card-image"
    />
    <img
      v-else
      src="/cards/webp/card_back.webp"
      alt="card back"
      class="card-back"
    />
  </div>
</template>

<script>
import { getCardImagePath } from '@/utils/cardImages.js'

export default {
  name: 'Card',
  props: {
    card: {
      type: Object,
      required: true,
    },
    cardIndex: {
      type: Number,
      required: true,
    },
    isHidden: {
      type: Boolean,
      default: false
    },
  },
  methods: {
    // When a drag starts, emit the card and its index up to the pile
    onDragStart(event) {
      // Set some data for the browser's drag event (good practice)
      event.dataTransfer.setData('text/plain', this.card.rank + this.card.suit);
      event.dataTransfer.effectAllowed = 'move';

      // Emit the index of THIS card up to the parent Pile.
      this.$emit('card-drag-started', event, this.cardIndex);
    },

    onDragEnd() {
      this.$emit('card-drag-ended');
    },

    onClick() {
      if (this.card.faceUp) {
        this.$emit('card-clicked', this.cardIndex);
      }
    },
  },
};
</script>

<style scoped>
.card-container {
  width: 100px;
  height: 145px;
  cursor: grab;
  opacity: 1;
  transition: opacity 0.2s; /* No transition needed */
}
.card-container.is-hidden {
  opacity: 0;
}
.card-image {
  width: 100%;
  height: 100%;
}
.card-back {
  width: 100%;
  height: 100%;
}
@media(max-width: 850px) {
  .card-container {
    width: 50px;
    height: 72px;
  }
}
@media(max-width: 550px) {
  .card-container {
    width: 33px;
    height: 47px;
  }
}
</style>