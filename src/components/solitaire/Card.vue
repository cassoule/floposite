<template>
  <img
    :src="cardImage"
    :alt="card.rank + card.suit"
    class="card"
    @click="selectCard"
  />
</template>

<script>
export default {
  props: {
    card: {
      type: Object,
      required: true,
    },
    isSelected: {
      type: Boolean,
      default: false,
    },
    pileType: {
      type: String,
      required: true, // e.g., 'tableau', 'foundation'
    },
    pileIndex: {
      type: Number,
      required: true,
    },
    cardIndex: {
      type: Number,
      required: true
    }
  },
  computed: {
    cardImage() {
      // Construct the image path based on card properties
      return this.card.faceUp
        ? `/cards/${this.card.image}`
        : '/cards/card_back.png';
    },
  },
  methods: {
    selectCard() {
      this.$emit('card-selected', {
        card: this.card,
        pileType: this.pileType,
        pileIndex: this.pileIndex,
        cardIndex: this.cardIndex,
      }); // Emit event when a card is clicked
    },
  },
};
</script>

<style scoped>
.card {
  width: 75px; /* Adjust as needed */
  border: 1px solid #ccc;
  border-radius: 5px;
  margin: 2px;
  cursor: pointer;
}

/*Optional styling when the card is selected*/
.card.selected{
  border: 2px solid green;
}
</style>