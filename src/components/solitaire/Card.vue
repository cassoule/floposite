<!-- Card.vue -->
<template>
  <div
    class="card-container"
    :draggable="card.faceUp"
    @dragstart.stop="onDragStart"
  >
    <img
      v-if="card.faceUp"
      :src="`/cards/${card.rank}${card.suit}.png`"
      :alt="`${card.rank} of ${card.suit}`"
      class="card-image"
    />
    <img
      v-else
      src="/cards/card_back.png"
      alt="card back"
      class="card-image"
    />
  </div>
</template>

<script>
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
  },
  methods: {
    // When a drag starts, emit the card and its index up to the pile
    onDragStart(event) {
      // Set some data for the browser's drag event (good practice)
      event.dataTransfer.setData('text/plain', this.card.rank + this.card.suit);
      event.dataTransfer.effectAllowed = 'move';

      // Emit the index of THIS card up to the parent Pile.
      this.$emit('card-drag-started', this.cardIndex);
    },
  },
};
</script>

<style scoped>
.card-container {
  width: 100px;
  height: 140px;
  cursor: grab;
}
.card-image {
  width: 100%;
  height: 100%;
  border-radius: 5px;
}
.card-back {
  width: 100%;
  height: 100%;
  background-color: blue; /* Or use an image */
  border: 1px solid #ccc;
  border-radius: 5px;
}
</style>