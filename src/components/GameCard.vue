<script>
export default {
  name: 'GameCard',
  props: {
    game: {
      type: Object,
      required: true,
    },
    gameCardsFilter: {
      type: String,
      required: false,
    },
    SOTDRank: {
      type: Number,
      default: null,
    },
  },
}
</script>

<template>
  <v-card
    v-if="!gameCardsFilter || game.chips.includes(gameCardsFilter)"
    class="game-action-card bg-black"
    :class="game.class"
    variant="tonal"
    style="
      display: flex;
      flex-direction: column;
      flex-grow: 1;
      flex-shrink: 0;
      flex-basis: 33%;
      place-content: space-between;
      border-radius: 0px !important;
      border: none !important;
    "
    @click="$router.push('/' + game.route)"
  >
    <v-card-title>
      {{ game.name }}
      <v-chip-group style="float: right; pointer-events: none">
        <v-chip v-for="chip in game.chips" size="small">{{ chip }}</v-chip>
      </v-chip-group>
    </v-card-title>
    <v-card-subtitle class="mb-4" style="text-wrap: wrap; white-space: normal; flex-grow: 1">
      <p>{{ game.description }}</p>
    </v-card-subtitle>
    <v-card-item class="w-100">
      <div class="w-100 d-flex justify-space-between">
        <v-chip
          v-if="SOTDRank"
          :class="
            SOTDRank === 1
              ? 'gold-chip'
              : SOTDRank === 2
                ? 'silver-chip'
                : SOTDRank === 3
                  ? 'bronze-chip'
                  : ''
          "
          :title="'Classement ' + game.name + ' of the day'"
        >
          <span style="text-shadow: 1px 1px 1px #181818">#{{ SOTDRank }}</span>
        </v-chip>
        <v-chip v-else style="opacity: 0"></v-chip>
        <v-btn
          text="Jouer"
          class="text-none"
          append-icon="mdi-play-circle"
          color="primary"
          variant="flat"
          rounded="lg"
          style="border-radius: 10px !important"
          @click="$router.push('/' + game.route)"
        />
      </div>
    </v-card-item>
  </v-card>
</template>

<style scoped>
@media (max-width: 850px) {
  .game-action-card {
    flex-basis: 100% !important;
  }
}

.gold-chip {
  background:
    radial-gradient(
      ellipse farthest-corner at right bottom,
      #fedb37 10%,
      #fdb931 15%,
      #9f7928 40%,
      #8a6e2f 60%,
      transparent 80%
    ),
    radial-gradient(
      ellipse farthest-corner at left top,
      #ffffff 0%,
      #fedb37 10%,
      #d1b464 40%,
      #5d4a1f 62.5%,
      #5d4a1f 70%
    );
}

.silver-chip {
  background:
    radial-gradient(
      ellipse farthest-corner at right bottom,
      #e8e8e8 10%,
      #d1d1d1 15%,
      #a0a0a0 40%,
      #8a8a8a 60%,
      transparent 80%
    ),
    radial-gradient(
      ellipse farthest-corner at left top,
      #ffffff 0%,
      #e8e8e8 10%,
      #b8b8b8 40%,
      #6a6a6a 62.5%,
      #6a6a6a 70%
    );
}

.bronze-chip {
  background:
    radial-gradient(
      ellipse farthest-corner at right bottom,
      #e8a44e 10%,
      #cd7f32 15%,
      #a05a2c 40%,
      #804a26 60%,
      transparent 80%
    ),
    radial-gradient(
      ellipse farthest-corner at left top,
      #f7d9b0 0%,
      #e8a44e 10%,
      #b87333 40%,
      #6d4c2a 62.5%,
      #6d4c2a 70%
    );
}
</style>
