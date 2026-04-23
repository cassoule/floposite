<template>
  <v-card class="smooth-cards mb-4" variant="tonal" rounded="xl" style="overflow: hidden">
    <div class="sicbo-wrapper w-100 h-100">
      <svg style="display: none">
        <defs>
          <g id="d1">
            <rect width="24" height="24" rx="4" fill="#4A5568" />
            <circle cx="12" cy="12" r="3.5" fill="#E53E3E" />
          </g>
          <g id="d2">
            <rect width="24" height="24" rx="4" fill="#4A5568" />
            <circle cx="6" cy="6" r="2.5" fill="#E2E8F0" />
            <circle cx="18" cy="18" r="2.5" fill="#E2E8F0" />
          </g>
          <g id="d3">
            <rect width="24" height="24" rx="4" fill="#4A5568" />
            <circle cx="6" cy="6" r="2.5" fill="#E2E8F0" />
            <circle cx="12" cy="12" r="2.5" fill="#E2E8F0" />
            <circle cx="18" cy="18" r="2.5" fill="#E2E8F0" />
          </g>
          <g id="d4">
            <rect width="24" height="24" rx="4" fill="#4A5568" />
            <circle cx="6" cy="6" r="2.5" fill="#E53E3E" />
            <circle cx="18" cy="6" r="2.5" fill="#E53E3E" />
            <circle cx="6" cy="18" r="2.5" fill="#E53E3E" />
            <circle cx="18" cy="18" r="2.5" fill="#E53E3E" />
          </g>
          <g id="d5">
            <rect width="24" height="24" rx="4" fill="#4A5568" />
            <circle cx="6" cy="6" r="2.5" fill="#E2E8F0" />
            <circle cx="18" cy="6" r="2.5" fill="#E2E8F0" />
            <circle cx="12" cy="12" r="2.5" fill="#E2E8F0" />
            <circle cx="6" cy="18" r="2.5" fill="#E2E8F0" />
            <circle cx="18" cy="18" r="2.5" fill="#E2E8F0" />
          </g>
          <g id="d6">
            <rect width="24" height="24" rx="4" fill="#4A5568" />
            <circle cx="7" cy="5.5" r="2.5" fill="#E2E8F0" />
            <circle cx="17" cy="5.5" r="2.5" fill="#E2E8F0" />
            <circle cx="7" cy="12" r="2.5" fill="#E2E8F0" />
            <circle cx="17" cy="12" r="2.5" fill="#E2E8F0" />
            <circle cx="7" cy="18.5" r="2.5" fill="#E2E8F0" />
            <circle cx="17" cy="18.5" r="2.5" fill="#E2E8F0" />
          </g>
        </defs>
      </svg>

      <div class="sicbo-board">
        <div class="top-row">
          <div class="bet-zone side-zone zone-small" @click="$emit('place-bet', 'small')">
            <div class="title text-lg mb-1">SMALL</div>
            <div class="hide-mobile desc text-sm-dark mb-1">TOTAL 4 TO 10</div>
            <div class="hide-mobile payout text-sm mb-3">1 TO 1</div>
            <div class="dice-preview">
              <svg class="die-icon" viewBox="0 0 24 24"><use href="#d1" /></svg>
              <svg class="die-icon" viewBox="0 0 24 24"><use href="#d2" /></svg>
              <svg class="die-icon" viewBox="0 0 24 24"><use href="#d3" /></svg>
            </div>
          </div>

          <div class="center-column">
            <div class="grid-3-inline even-odd-row">
              <div class="bet-zone py-2 zone-even" @click="$emit('place-bet', 'even')">
                <div class="title text-md mb-1">EVEN</div>
                <div class="hide-mobile payout text-xs">1 TO 1</div>
              </div>
              <div class="bet-zone py-2 zone-any-triple" @click="$emit('place-bet', 'any_triple')">
                <div class="title text-md mb-1">ANY TRIPLE</div>
                <div class="hide-mobile payout text-xs">30 TO 1</div>
              </div>
              <div class="bet-zone py-2 zone-odd" @click="$emit('place-bet', 'odd')">
                <div class="title text-md mb-1">ODD</div>
                <div class="hide-mobile payout text-xs">1 TO 1</div>
              </div>
            </div>

            <div class="grid-6 triples-row">
              <div
                v-for="i in 6"
                :key="'triple-' + i"
                class="bet-zone py-2"
                @click="$emit('place-bet', `triple_${i}`)"
              >
                <div class="hide-mobile payout text-xs mb-2">180 TO 1</div>
                <div class="dice-preview mb-2">
                  <svg class="die-icon" viewBox="0 0 24 24"><use :href="'#d' + i" /></svg>
                  <svg class="die-icon" viewBox="0 0 24 24"><use :href="'#d' + i" /></svg>
                  <svg class="die-icon" viewBox="0 0 24 24"><use :href="'#d' + i" /></svg>
                </div>
                <div class="hide-mobile title text-xs-dark">TRIPLE {{ i }}</div>
              </div>
            </div>

            <div class="grid-6 doubles-row">
              <div
                v-for="i in 6"
                :key="'double-' + i"
                class="bet-zone py-2"
                @click="$emit('place-bet', `double_${i}`)"
              >
                <div class="hide-mobile payout text-xs mb-2">10 TO 1</div>
                <div class="dice-preview mb-2">
                  <svg class="die-icon" viewBox="0 0 24 24"><use :href="'#d' + i" /></svg>
                  <svg class="die-icon" viewBox="0 0 24 24"><use :href="'#d' + i" /></svg>
                </div>
                <div class="hide-mobile title text-xs-dark">DOUBLE {{ i }}</div>
              </div>
            </div>
          </div>

          <div class="bet-zone side-zone zone-big" @click="$emit('place-bet', 'big')">
            <div class="title text-lg mb-1">BIG</div>
            <div class="hide-mobile desc text-sm-dark mb-1">TOTAL 11 TO 17</div>
            <div class="hide-mobile payout text-sm mb-3">1 TO 1</div>
            <div class="dice-preview">
              <svg class="die-icon" viewBox="0 0 24 24"><use href="#d4" /></svg>
              <svg class="die-icon" viewBox="0 0 24 24"><use href="#d5" /></svg>
              <svg class="die-icon" viewBox="0 0 24 24"><use href="#d6" /></svg>
            </div>
          </div>
        </div>

        <div class="grid-totaux mt-gap">
          <div
            v-for="total in totalsData"
            :key="'total-' + total.val"
            class="bet-zone py-2"
            @click="$emit('place-bet', `total_${total.val}`)"
          >
            <div class="title text-lg mb-1">{{ total.val }}</div>
            <div class="hide-mobile payout text-xs">{{ total.payout }} TO 1</div>
          </div>
        </div>

        <div class="grid-6 mt-gap single-dice-row">
          <div
            v-for="i in 6"
            :key="'single-' + i"
            class="bet-zone py-4"
            @click="$emit('place-bet', `single_${i}`)"
          >
            <svg class="die-icon large-die" viewBox="0 0 24 24">
              <use :href="'#d' + i" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  </v-card>
</template>

<script>
export default {
  name: 'SicBoBoard',
  props: {
    totalsData: {
      type: Array,
      required: true,
    },
  },
  emits: ['place-bet'],
}
</script>

<style scoped>
/* =========================================
   STYLE ORIGINAL (PC & THEME)
   ========================================= */
.sicbo-wrapper {
  background: linear-gradient(180deg, #1a202c 0%, #2d3748 100%);
  padding: 16px;
  font-family: sans-serif;
  box-sizing: border-box;
}

.sicbo-board {
  display: flex;
  flex-direction: column;
}

.text-lg {
  font-size: 24px;
  font-weight: bold;
  color: #e2e8f0;
  line-height: 1.1;
}
.text-md {
  font-size: 16px;
  font-weight: bold;
  color: #e2e8f0;
  line-height: 1.1;
}
.text-sm {
  font-size: 14px;
  font-weight: bold;
  color: #e2e8f0;
  line-height: 1.1;
}
.text-sm-dark {
  font-size: 12px;
  font-weight: bold;
  color: #cbd5e0;
  line-height: 1.1;
}
.text-xs {
  font-size: 10px;
  font-weight: bold;
  color: #e2e8f0;
  line-height: 1.1;
}
.text-xs-dark {
  font-size: 10px;
  font-weight: bold;
  color: #cbd5e0;
  line-height: 1.1;
}

.mb-1 {
  margin-bottom: 4px;
}
.mb-2 {
  margin-bottom: 8px;
}
.mb-3 {
  margin-bottom: 12px;
}
.mt-gap {
  margin-top: 10px;
}
.py-2 {
  padding: 10px 0;
}
.py-4 {
  padding: 24px 0;
}

.hide-mobile {
  display: block;
}

.bet-zone {
  background-color: #2d3748;
  border: 1.5px solid #4a5568;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  cursor: pointer;
  transition:
    background-color 0.2s,
    transform 0.1s;
  min-height: 50px;
}
.bet-zone:hover {
  background-color: #384459;
  border-color: #5865f2;
}
.bet-zone:active {
  transform: scale(0.98);
}

/* Grilles PC */
.top-row {
  display: grid;
  grid-template-columns: 1.5fr 7fr 1.5fr;
  gap: 10px;
}
.center-column {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.grid-3-inline {
  order: 1;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
.triples-row {
  order: 2;
}
.doubles-row {
  order: 3;
}
.grid-6 {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 10px;
}
.grid-totaux {
  display: grid;
  grid-template-columns: repeat(14, 1fr);
  gap: 6px;
}

.dice-preview {
  display: flex;
  gap: 4px;
}
.die-icon {
  width: 22px;
  height: 24px;
}
.large-die {
  width: 56px;
  height: 56px;
}

/* =========================================
   MODE MOBILE
   ========================================= */
@media (max-width: 1024px) {
  .hide-mobile {
    display: none !important;
  }

  .sicbo-wrapper {
    padding: 8px;
  }

  /* On transforme le plateau en grille globale et on "casse" les wrappers */
  .sicbo-board {
    display: grid;
    grid-template-columns: 1.5fr 0.8fr 1.8fr 0.8fr 1.5fr;
    gap: 6px;
  }

  /* display: contents permet d'ignorer ces divs pour placer leurs enfants directement sur la grille parente */
  .top-row,
  .center-column,
  .grid-3-inline.even-odd-row {
    display: contents;
  }

  /* 1. Placement de la ligne du haut */
  .zone-small {
    order: 1;
    grid-column: span 1;
    padding: 4px;
    min-height: 60px;
  }
  .zone-odd {
    order: 2;
    grid-column: span 1;
    padding: 4px;
    min-height: 60px;
  }
  .zone-any-triple {
    order: 3;
    grid-column: span 1;
    padding: 4px;
    min-height: 60px;
  }
  .zone-even {
    order: 4;
    grid-column: span 1;
    padding: 4px;
    min-height: 60px;
  }
  .zone-big {
    order: 5;
    grid-column: span 1;
    padding: 4px;
    min-height: 60px;
  }

  /* Ajustement vertical du texte ODD et EVEN */
  .zone-odd .title,
  .zone-even .title {
    writing-mode: vertical-rl;
    text-orientation: upright;
    letter-spacing: -1px;
    margin: 0;
  }

  .top-row .title.text-lg {
    font-size: 18px;
  }
  .top-row .title.text-md {
    font-size: 14px;
  }

  /* 2. Les Doubles */
  .doubles-row {
    order: 6;
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 4px;
  }

  /* 3. Les Triples */
  .triples-row {
    order: 7;
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 4px;
  }

  /* Rendre les dés des triples verticaux sur mobile ! */
  .triples-row .dice-preview {
    flex-direction: column;
    gap: 2px;
  }

  /* 4. Les Totaux */
  .grid-totaux {
    order: 8;
    grid-column: 1 / -1;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
    margin-top: 4px;
  }

  /* 5. Les Dés simples */
  .single-dice-row {
    order: 9;
    grid-column: 1 / -1;
    grid-template-columns: repeat(3, 1fr);
    gap: 4px;
    margin-top: 4px;
  }

  /* Ajustement des tailles des blocs internes pour mobile */
  .doubles-row .bet-zone,
  .zone-any-triple {
    padding: 6px 0 !important;
    min-height: 40px;
  }

  /* Hauteur spécifique pour les triples car les 3 dés sont empilés */
  .triples-row .bet-zone {
    padding: 8px 0 !important;
    min-height: 80px;
  }

  .grid-totaux .bet-zone {
    min-height: 40px !important;
    padding: 6px 0 !important;
  }
  .grid-totaux .title.text-lg {
    font-size: 18px;
  }
  .single-dice-row .bet-zone {
    padding: 12px 0 !important;
  }
  .large-die {
    width: 36px;
    height: 36px;
  }
  .die-icon {
    width: 16px;
    height: 16px;
  }
}

@media (max-width: 480px) {
  .text-lg {
    font-size: 16px !important;
  }
  .zone-small,
  .zone-big,
  .zone-odd,
  .zone-even,
  .zone-any-triple {
    min-height: 50px;
  }
}
</style>
