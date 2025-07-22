<template>
  <div class="pile">
    <draggable
      v-model="internalCards"
      group="cards"
      item-key="image"
      @start="dragStart"
      @end="dragEnd"
    >
      <template #item="{ element, index }">
        <Card
          :key="element.image"
          :card="element"
          :pileType="pileType"
          :pileIndex="pileIndex"
          :cardIndex="index"
        />
      </template>
    </draggable>
    <div v-if="!internalCards.length" class="empty-pile" @click="handleEmptyPileClick"></div>
  </div>
</template>

<script>
import Card from './Card.vue';
import draggable from 'vuedraggable';

export default {
  components: {
    Card,
    draggable,
  },
  props: {
    cards: {
      type: Array,
      required: true,
    },
    pileType: {
      type: String,
      required: true,
    },
    pileIndex: {
      type: Number,
      required: true,
    },
  },
  emits: ['card-moved', 'empty-pile-clicked'], // Emit when card is moved

  data() {
    return {
      draggedCard: null,
      internalCards: [...this.cards],
    }
  },

  watch: {
    cards: {
      handler(newCards) {
        this.internalCards = [...newCards];
      },
      deep: true,
    },
  },

  methods: {
    dragStart(evt) {
      this.$emit('drag-start', {
        card: this.cards[evt.itemIndex],
        pileType: this.pileType,
        pileIndex: this.pileIndex,
        cardIndex: evt.itemIndex
      })
    },

    dragEnd(evt) {
      this.$emit('drag-end', {
        card: this.cards[evt.newIndex],
        pileType: this.pileType,
        pileIndex: this.pileIndex,
        cardIndex: evt.newIndex,
      });
    },
    handleCardSelected(cardInfo) {
      this.$emit('card-selected', cardInfo);
    },

    handleEmptyPileClick() {
      this.$emit('empty-pile-clicked', this.pileType, this.pileIndex); // Emit click on empty pile
    },
  }
};
</script>

<style scoped>
.pile {
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 1px dashed #999;
  padding: 5px;
  margin: 5px;
  min-height: 100px;
  width: 80px;
}
</style>