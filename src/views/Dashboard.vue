<template>
  <div v-if="user" class="user-tab">
    <div style="position: relative; margin-top: 1rem">
      <v-sparkline
        v-if="sparklines[discordId]?.length > 0"
        smooth
        auto-draw
        color="primary"
        line-width="0.5"
        :model-value="
          sparklines[discordId]?.length > 0
            ? sparklines[discordId]?.map((entry) => entry.userNewAmount)
            : [0]
        "
        style="
          position: absolute;
          left: 0;
          top: 0;
          filter: blur(3px);
          z-index: -1;
          height: 100%;
          width: 100%;
        "
      />
      <v-sparkline
        v-if="elo_graphs[discordId]?.length > 0"
        smooth
        auto-draw
        color="secondary"
        line-width="0.5"
        :model-value="elo_graphs[discordId]?.length > 0 ? elo_graphs[discordId] : [0]"
        style="
          position: absolute;
          left: 0;
          top: 0;
          filter: blur(3px);
          z-index: -1;
          height: 100%;
          width: 100%;
        "
      />
      <v-img
        class="cursor-pointer"
        :src="avatar"
        lazy-src="anon.png"
        width="70"
        color="transparent"
        style="border-radius: 50%; width: 70px; height: 70px"
        @click="$router.push('/akhy/' + discordId)"
      />
      <h1 class="cursor-pointer" @click="$router.push('/akhy/' + discordId)">
        Salut <span style="color: #5865f2">@{{ user?.username || anonUsername }}</span>
      </h1>
      <span
        v-if="
          active_slowmodes && Object.values(active_slowmodes).find((s) => s.userId === discordId)
        "
        class="bubble-text"
        style="
          background: radial-gradient(circle at -100% 0%, #ff8c00, transparent 120%);
          border: 1px solid #ff8c00;
        "
      >
        slowmode
      </span>
      <span
        v-if="user_isTimedOut"
        class="bubble-text"
        style="
          background: radial-gradient(circle at -100% 0%, #aa3e3e, transparent 120%);
          border: 1px solid #aa3e3e;
        "
      >
        timed out
      </span>
      <span class="bubble-text" style="opacity: 0"></span>
      <div class="d-flex flex-wrap mt-2 justify-space-between" style="column-gap: 2em">
        <p class="d-flex" style="place-items: baseline">
          <span class="font-weight-bold">{{
            user?.coins.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
          }}</span>
          &nbsp;FlopoCoins&nbsp;
          <v-btn
            text="Acheter"
            append-icon=""
            class="text-none buy-btn ml-2"
            color="white"
            variant="tonal"
            size="small"
            rounded="lg"
            @click="coinsModal = true"
          >
            <template #append>
              <v-img src="star.svg" width="12px" height="12px" />
            </template>
          </v-btn>
        </p>
        <div v-if="elos[discordId]" class="d-flex ga-2" style="place-items: center">
          <div style="display: flex; place-items: center">
            <v-img :src="rankIcon(user?.elo)" width="22" height="30">
              <div
                :style="`position: absolute; display: flex; width: 100%; height: 100%; place-items: center; place-content: center; font-size: .8em; color: #222`"
              >
                <p style="font-weight: 400">{{ rankDiv(user?.elo) }}</p>
              </div>
            </v-img>
          </div>
          {{ elos[discordId] }} FlopoElo
          <span v-if="elo_graphs[discordId]" style="color: rgba(255, 255, 255, 0.3)">{{
            'Best : ' + Math.max(...elo_graphs[discordId], 0) + ' Elo'
          }}</span>
        </div>
      </div>
    </div>

    <div
      class="mt-5 d-flex flex-column align-start justify-center"
      style="gap: 0.5rem; position: relative; place-content: space-between"
    >
      <div
        class="d-flex py-2"
        style="
          gap: 0.5rem;
          overflow-y: scroll;
          overflow-x: visible;
          padding-top: 0.6em;
          padding-right: 1em;
        "
      >
        <!-- <v-btn-toggle
          disabled
          rounded="lg"
          base-color="primary"
          variant="flat"
          density="compact"
          style="border-radius: 10px !important"
        >
          <v-btn
            class="text-capitalize"
            text="Market"
            append-icon="mdi-cart"
            @click="$router.push('/market')"
          />
          <v-btn class="text-capitalize" text="Caisses" @click="$router.push('/cases')">
            <template #append>
              <v-icon class="mdi mdi-treasure-chest-outline mt-1"></v-icon>
            </template>
          </v-btn>
        </v-btn-toggle> -->

        <v-btn
          v-if="!user.dailyQueried"
          :key="Date.now() + '-daily-reward'"
          color="primary"
          variant="tonal"
          rounded="lg"
          style="border: 1px solid #5865f2"
          @click="handleDailyQuery"
        >
          <v-icon
            class="animate__animated animate__heartBeat animate__infinite animate__slow mdi mdi-gift"
            size="20"
            color="white"
          ></v-icon>
        </v-btn>
      </div>
      <v-chip-group
        v-model="gameCardsFilter"
        class="mb-0 pb-0 text-secondary"
        selected-class="text-white"
        :disabled="tab !== 'games'"
      >
        <v-chip size="small" :value="'1v1'" filter>1v1</v-chip>
        <v-chip size="small" :value="'Multi'" filter>Multi</v-chip>
        <v-chip size="small" :value="'Solo'" filter>Solo</v-chip>
        <v-chip size="small" :value="'Elo'" filter>Elo</v-chip>
        <v-chip size="small" :value="'Coins'" filter class="mr-0">Coins</v-chip>
      </v-chip-group>
    </div>

    <v-tabs
      v-model="tab"
      variant="tonal"
      color="white"
      align-tabs="center"
      grow
      density="compact"
      class="tabs w-100 mt-5"
    >
      <v-tab value="games" icon><i class="mdi mdi-controller" /></v-tab>
      <v-tab class="new-tab" value="skins" icon><i class="mdi mdi-pistol" /></v-tab>
      <v-tab v-if="user?.isAkhy" value="commandes" icon>
        <i class="mdi mdi-slash-forward-box" />
      </v-tab>
      <v-tab v-if="user?.isAkhy" value="predictions" icon>
        <i class="mdi mdi-tooltip-question-outline" />
      </v-tab>
    </v-tabs>

    <v-tabs-window v-model="tab" class="w-100">
      <v-tabs-window-item value="games">
        <div class="actions-container">
          <v-card
            v-if="!gameCardsFilter || gameCardsFilter === '1v1' || gameCardsFilter === 'Elo'"
            class="game-action-card c4-action-card bg-black"
            variant="tonal"
            @click="$router.push('/connect-4')"
          >
            <v-card-title>
              Puissance 4
              <v-chip-group style="float: right; pointer-events: none">
                <v-chip size="small">1v1</v-chip>
                <v-chip size="small" class="mr-0">Elo</v-chip>
              </v-chip-group>
            </v-card-title>
            <v-card-subtitle style="text-wrap: wrap">
              <p>
                Joue une partie de puissance 4 contre un autre joueur, mais attention à ton
                FlopoRank.
              </p>
            </v-card-subtitle>
            <v-card-text class="d-flex justify-end">
              <v-btn
                text="Jouer"
                class="text-none"
                append-icon="mdi-numeric-4-circle"
                color="primary"
                variant="flat"
                rounded="lg"
                style="border-radius: 10px !important"
                @click="$router.push('/connect-4')"
              />
            </v-card-text>
          </v-card>

          <v-card
            v-if="!gameCardsFilter || gameCardsFilter === 'Solo' || gameCardsFilter === 'Coins'"
            class="game-action-card sol-action-card bg-black"
            variant="tonal"
            @click="$router.push('/solitaire')"
          >
            <v-card-title>
              Solitaire
              <v-chip-group style="float: right; pointer-events: none">
                <v-chip size="small">Solo</v-chip>
                <v-chip size="small" class="mr-0">Coins</v-chip>
              </v-chip-group>
            </v-card-title>
            <v-card-subtitle style="text-wrap: wrap">
              <p>Tente de gagner quelques FlopoCoins au solitaire.</p>
            </v-card-subtitle>
            <v-card-text class="d-flex justify-end">
              <v-btn
                text="Jouer"
                class="text-none"
                append-icon="mdi-cards-spade"
                color="primary"
                variant="flat"
                rounded="lg"
                style="border-radius: 10px !important"
                @click="$router.push('/solitaire')"
              />
            </v-card-text>
          </v-card>

          <v-card
            v-if="!gameCardsFilter || gameCardsFilter === 'Multi' || gameCardsFilter === 'Coins'"
            class="game-action-card poker-action-card bg-black"
            variant="tonal"
            @click="$router.push('/poker')"
          >
            <v-card-title>
              Flopoker
              <v-chip-group style="float: right; pointer-events: none">
                <v-chip size="small">Multi</v-chip>
                <v-chip size="small" class="mr-0">Coins</v-chip>
              </v-chip-group>
            </v-card-title>
            <v-card-subtitle style="text-wrap: wrap">
              <p>Mise tes FlopoCoins dans ce poker de 2 à 8 joueurs par table.</p>
            </v-card-subtitle>
            <v-card-text class="d-flex justify-end">
              <v-btn
                text="Jouer"
                class="text-none game-btn"
                color="primary"
                append-icon="mdi mdi-cards-playing-spade-multiple"
                style="z-index: 0"
                @click="$router.push('/poker')"
              />
            </v-card-text>
          </v-card>

          <v-card
            v-if="!gameCardsFilter || gameCardsFilter === 'Multi' || gameCardsFilter === 'Coins'"
            class="game-action-card bj-action-card bg-black"
            variant="tonal"
            @click="$router.push('/blackjack')"
          >
            <v-card-title>
              Blackjack
              <v-chip-group style="float: right; pointer-events: none">
                <v-chip size="small">Multi</v-chip>
                <v-chip size="small" class="mr-0">Coins</v-chip>
              </v-chip-group>
            </v-card-title>
            <v-card-subtitle style="text-wrap: wrap">
              <p>Mise tes FlopoCoins au Blackjack</p>
            </v-card-subtitle>
            <v-card-text class="d-flex justify-end">
              <v-btn
                text="Jouer"
                class="text-none"
                append-icon="mdi-cards"
                color="primary"
                variant="flat"
                rounded="lg"
                style="border-radius: 10px !important"
                @click="$router.push('/blackjack')"
              />
            </v-card-text>
          </v-card>

          <v-card
            v-if="!gameCardsFilter || gameCardsFilter === '1v1' || gameCardsFilter === 'Elo'"
            class="game-action-card ttt-action-card bg-black"
            variant="tonal"
            @click="$router.push('/tic-tac-toe')"
          >
            <v-card-title>
              Tic Tac Toe
              <v-chip-group style="float: right; pointer-events: none">
                <v-chip size="small">1v1</v-chip>
                <v-chip size="small" class="mr-0">Elo</v-chip>
              </v-chip-group>
            </v-card-title>
            <v-card-subtitle style="text-wrap: wrap">
              <p>Joue au morpion contre un autre joueur, mais attention à ton FlopoRank.</p>
            </v-card-subtitle>
            <v-card-text class="d-flex justify-end">
              <v-btn
                text="Jouer"
                class="text-none game-btn"
                color="primary"
                append-icon="mdi mdi-pound"
                style="z-index: 0"
                @click="$router.push('/tic-tac-toe')"
              />
            </v-card-text>
          </v-card>

          <v-card
            v-if="!gameCardsFilter || gameCardsFilter === 'Solo' || gameCardsFilter === 'Coins'"
            class="game-action-card mg-action-card bg-black"
            variant="tonal"
            @click="$router.push('/monke-game')"
          >
            <v-card-title>
              Monke Game
              <v-chip-group style="float: right; pointer-events: none">
                <v-chip size="small">Solo</v-chip>
                <v-chip size="small" class="mr-0">Coins</v-chip>
              </v-chip-group>
            </v-card-title>
            <v-card-subtitle style="text-wrap: wrap">
              <p>Tente de gagner des FlopoCoins mais attention aux bombes !</p>
            </v-card-subtitle>
            <v-card-text class="d-flex justify-end">
              <v-btn
                text="Jouer"
                class="text-none"
                append-icon="mdi-bomb"
                color="primary"
                variant="flat"
                rounded="lg"
                style="border-radius: 10px !important"
                @click="$router.push('/monke-game')"
              />
            </v-card-text>
          </v-card>

          <v-card
            v-if="!gameCardsFilter || gameCardsFilter === 'Solo' || gameCardsFilter === 'Coins'"
            class="game-action-card snake-action-card bg-black"
            variant="tonal"
            @click="$router.push('/snake/solo')"
          >
            <v-card-title>
              Snake Game
              <v-chip-group style="float: right; pointer-events: none">
                <v-chip size="small">Solo</v-chip>
                <v-chip size="small">Coins</v-chip>
              </v-chip-group>
            </v-card-title>
            <v-card-subtitle style="text-wrap: wrap">
              <p>Gagne des FlopoCoins en jouant au Snake en solo.</p>
            </v-card-subtitle>
            <v-card-text class="d-flex justify-end">
              <v-btn
                text="Jouer"
                class="text-none"
                append-icon="mdi-snake"
                color="primary"
                variant="flat"
                rounded="lg"
                style="border-radius: 10px !important"
                @click="$router.push('/snake/solo')"
              />
            </v-card-text>
          </v-card>
        </div>
      </v-tabs-window-item>

      <v-tabs-window-item value="skins">
        <div class="actions-container">
          <v-card class="game-action-card bg-black" variant="tonal" @click="$router.push('/cases')">
            <v-card-title> Caisses </v-card-title>
            <v-card-subtitle style="text-wrap: wrap">
              <p>Ouvre des caisses pour obtenir des skins rares et uniques.</p>
            </v-card-subtitle>
            <v-card-text class="d-flex justify-end">
              <v-btn
                text="Caisses"
                class="text-none"
                append-icon="mdi-gift-open-outline"
                color="primary"
                variant="flat"
                rounded="lg"
                style="border-radius: 10px !important"
                @click="$router.push('/cases')"
              />
            </v-card-text>
          </v-card>

          <v-card
            class="game-action-card bg-black"
            variant="tonal"
            @click="$router.push('/market')"
          >
            <v-card-title> FlopoMarket </v-card-title>
            <v-card-subtitle style="text-wrap: wrap">
              <p>Vends tes skins au enchères ou achètes-en de nouveaux pour ta collection.</p>
            </v-card-subtitle>
            <v-card-text class="d-flex justify-end">
              <v-btn
                text="Market"
                class="text-none"
                append-icon="mdi-cart-variant"
                color="primary"
                variant="flat"
                rounded="lg"
                style="border-radius: 10px !important"
                @click="$router.push('/market')"
              />
            </v-card-text>
          </v-card>

          <v-card
            class="game-action-card bg-black"
            variant="tonal"
            @click="$router.push('/trade-up')"
          >
            <v-card-title> Trade Up </v-card-title>
            <v-card-subtitle style="text-wrap: wrap">
              <p>Améliore tes skins en les combinant pour obtenir des versions plus rares.</p>
            </v-card-subtitle>
            <v-card-text class="d-flex justify-end">
              <v-btn
                text="Upgrade"
                class="text-none"
                append-icon="mdi-swap-vertical"
                color="primary"
                variant="flat"
                rounded="lg"
                style="border-radius: 10px !important"
                @click="$router.push('/trade-up')"
              />
            </v-card-text>
          </v-card>
        </div>
      </v-tabs-window-item>

      <v-tabs-window-item v-if="user?.isAkhy" value="commandes">
        <div class="actions-container">
          <v-card class="action-card" variant="tonal">
            <v-card-title>Modif Pseudo</v-card-title>
            <v-card-subtitle>
              <p>Modifie le pseudo de quelqu'un</p>
            </v-card-subtitle>
            <v-card-text class="d-flex justify-end">
              <v-btn
                text="1K FlopoCoins"
                class="text-none"
                append-icon="mdi-play"
                color="primary"
                variant="flat"
                rounded="lg"
                style="border-radius: 10px !important"
                :disabled="user?.coins < 1000"
                @click="nicknameModal = true"
              />
            </v-card-text>
          </v-card>

          <v-card class="action-card" variant="tonal">
            <v-card-title>Spam Ping</v-card-title>
            <v-card-subtitle>
              <p>Spam quelqu'un pendant 30 secondes</p>
            </v-card-subtitle>
            <v-card-text class="d-flex justify-end">
              <v-btn
                text="5K FlopoCoins"
                class="text-none"
                append-icon="mdi-play"
                color="primary"
                variant="flat"
                rounded="lg"
                style="border-radius: 10px !important"
                :disabled="user?.coins < 5000"
                @click="spamPingModal = true"
              />
            </v-card-text>
          </v-card>

          <v-card class="action-card" variant="tonal">
            <v-card-title>Slow Mode</v-card-title>
            <v-card-subtitle>
              <p>1 message par minute pendant 1 heure</p>
            </v-card-subtitle>
            <v-card-text class="d-flex justify-end">
              <v-btn
                text="10K FlopoCoins"
                class="text-none"
                append-icon="mdi-play"
                color="primary"
                variant="flat"
                rounded="lg"
                style="border-radius: 10px !important"
                :disabled="user?.coins < 10000"
                @click="slowmodeModal = true"
              />
            </v-card-text>
          </v-card>

          <v-card class="action-card" variant="tonal">
            <v-card-title>Time-Out</v-card-title>
            <v-card-subtitle>
              <p>Time-out quelqu'un pendant 12 heures</p>
            </v-card-subtitle>
            <v-card-text class="d-flex justify-end">
              <v-btn
                text="100K FlopoCoins"
                class="text-none"
                append-icon="mdi-play"
                color="primary"
                variant="flat"
                rounded="lg"
                style="border-radius: 10px !important"
                :disabled="user?.coins < 100000"
                @click="timeoutModal = true"
              />
            </v-card-text>
          </v-card>
        </div>
      </v-tabs-window-item>

      <v-tabs-window-item v-if="user?.isAkhy" value="predictions">
        <div class="actions-container">
          <div
            style="
              position: absolute;
              z-index: 2;
              padding: 0.7em 0.5em;
              width: 100%;
              display: flex;
              place-content: space-between;
              backdrop-filter: blur(5px);
            "
          >
            <h2 class="text-white">Prédictions</h2>
            <v-btn
              class="text-none"
              variant="flat"
              color="primary"
              text="Nouvelle Prédi"
              style="border-radius: 10px"
              @click="prediModal = true"
            />
          </div>
          <div
            v-if="active_predis"
            class="predis-containers pt-12"
            :style="discordId === devId ? 'height: 333px;' : 'height: 388px;'"
          >
            <v-card
              v-for="[key, predi] in Object.entries(active_predis)"
              :key="key"
              class="votes-card"
              :variant="
                ((predi.endTime - Date.now()) / 1000).toFixed() < 0 || predi.closed
                  ? 'plain'
                  : 'tonal'
              "
            >
              <div>
                <v-img
                  :src="avatars[predi.creatorId]"
                  color="transparent"
                  style="
                    border-radius: 50%;
                    width: 25px;
                    height: 25px;
                    position: absolute;
                    right: 1em;
                    top: 1em;
                  "
                />
                <v-card-text class="font-weight-bold pr-0 mr-12">
                  {{ predi.label }}
                </v-card-text>
                <v-card-subtitle class="pb-3">
                  {{ predi.options[0].votes.length + predi.options[1].votes.length }}
                  vote(s) - Prédi de {{ users.find((u) => u.id === predi.creatorId).username }}
                </v-card-subtitle>
                <v-card-subtitle class="d-flex pb-2" style="place-content: space-between">
                  <p style="max-width: 48%; overflow: hidden; text-overflow: ellipsis">
                    {{ predi.options[0].label }}
                  </p>
                  <p style="max-width: 48%; overflow: hidden; text-overflow: ellipsis">
                    {{ predi.options[1].label }}
                  </p>
                </v-card-subtitle>
                <v-card-text class="px-0">
                  <div
                    class="animate__animated animate__fadeIn"
                    style="text-align: right; position: absolute"
                    :style="`height: 15px; width: 100%; transition: 1s ease-in-out; transform: translateX(${predi.options[0].percent - 100}%); background: #5865f2; border: 2px solid #5865f277`"
                  >
                    <p class="pr-4" style="transform: translateY(-25px)">
                      {{ predi.options[0].percent.toFixed(1) }}%
                    </p>
                  </div>
                  <div
                    class="animate__animated animate__fadeIn"
                    style="text-align: left; position: absolute"
                    :style="`height: 15px; width: 100%; transition: 1s ease-in-out; transform: translateX(${100 - predi.options[1].percent}%); background: #aa3e3e; border: 2px solid #aa3e3e77`"
                  >
                    <p class="pl-4" style="transform: translateY(-25px)">
                      {{ predi.options[1].percent.toFixed(1) }}%
                    </p>
                  </div>
                </v-card-text>
                <v-card-subtitle class="d-flex justify-space-between pt-2">
                  <div style="display: flex; place-content: start; gap: 0">
                    <div
                      v-for="(vote, index) in predi.options[0].votes"
                      :key="vote.id + Date.now()"
                      :style="`transform: translateX(calc(-12px * ${index})); z-index: 1;`"
                    >
                      <v-img
                        :src="avatars[vote.id]"
                        color="transparent"
                        style="border-radius: 50%; width: 20px; height: 20px"
                      />
                    </div>
                  </div>
                  <div
                    style="display: flex; flex-direction: row-reverse; place-content: start; gap: 0"
                  >
                    <div
                      v-for="(vote, index) in predi.options[1].votes"
                      :key="vote.id + Date.now()"
                      :style="`transform: translateX(calc(12px * ${index})); z-index: 1;`"
                    >
                      <v-img
                        :src="avatars[vote.id]"
                        color="transparent"
                        style="border-radius: 50%; width: 20px; height: 20px"
                      />
                    </div>
                  </div>
                </v-card-subtitle>
                <v-card-text class="d-flex align-end">
                  <p v-if="!predi.closed">
                    {{
                      ((predi.closingTime - Date.now()) / 1000).toFixed() > 0
                        ? ((predi.closingTime - Date.now()) / 1000).toFixed() +
                          's restantes pour voter'
                        : ((predi.endTime - Date.now()) / 1000).toFixed() > 0
                          ? Math.max(((predi.endTime - Date.now()) / 1000).toFixed(), 0) +
                            's avant les résultats'
                          : 'Prédi terminée, en attente de validation'
                    }}
                  </p>
                  <p v-else>Prédi terminée, les FlopoCoins ont été distribués</p>

                  <v-spacer />
                  <div v-if="!predi.options[0].votes.find((v) => v?.voter === discordId)">
                    <v-btn
                      :text="
                        ((predi.closingTime - Date.now()) / 1000).toFixed() > 0 ? 'Voter' : 'Voir'
                      "
                      color="primary"
                      variant="flat"
                      rounded="lg"
                      @click="setSelectedPredi(predi, key)"
                      @click.stop="prediVoteModal = true"
                    />
                  </div>
                  <div v-else>Tu as voté !</div>
                </v-card-text>
              </div>
            </v-card>
            <div v-if="Object.keys(active_predis)?.length === 0" class="pt-16 pl-5">
              <p class="pt-16 w-100 text-center">Aucune prédi en cours</p>
            </div>
          </div>
          <div
            v-else
            style="width: 100%; display: flex; place-content: center; place-items: center"
            :style="discordId === devId ? 'height: 333px;' : 'height: 388px;'"
          >
            <v-progress-circular
              :size="70"
              :width="10"
              color="primary"
              indeterminate
            ></v-progress-circular>
          </div>
        </div>
      </v-tabs-window-item>
    </v-tabs-window>
    <p class="d-flex mt-2" style="place-items: center">
      {{ formatAmount(user?.coins) }} Flopos
      <v-img src="star.svg" class="ml-2" max-width="12px" height="12px" />
    </p>

    <button class="discord-logout" @click="logout">Déconnexion</button>
  </div>

  <div v-else class="user-tab">
    <v-skeleton-loader
      class="mt-2 mb-2"
      type="avatar"
      color="transparent"
      style="min-width: 800px"
    ></v-skeleton-loader>
    <v-skeleton-loader
      class="mb-6"
      type="heading"
      color="transparent"
      style="max-width: 300px"
    ></v-skeleton-loader>
    <v-skeleton-loader
      class=""
      type="text@3"
      color="transparent"
      style="max-width: 300px"
    ></v-skeleton-loader>
    <v-skeleton-loader
      class="mb-10"
      type="text"
      color="transparent"
      style="max-width: 300px"
    ></v-skeleton-loader>
    <v-skeleton-loader
      class="px-0"
      type="heading"
      color="transparent"
      style="max-width: 800px"
    ></v-skeleton-loader>
    <v-skeleton-loader
      type="image@3"
      color="transparent"
      style="border-radius: 20px; overflow: hidden"
    ></v-skeleton-loader>
  </div>

  <div v-if="users" class="leaderboard-container">
    <h2 style="display: flex; place-content: space-between; align-items: center">
      Classement
      <span
        class="d-flex justify-center text-white align-center text-capitalize cursor-pointer rounded-xl text-center"
        style="user-select: none; width: 60px; font-size: 0.75em; height: 25px"
        :style="leaderboardType === 'coins' ? 'background: #5865f2;' : 'background: #5865f277;'"
        @click="leaderboardSwitch"
      >
        {{ leaderboardType }}
      </span>
    </h2>
    <TransitionGroup name="leaderboard-list" tag="div" class="leaderboard">
      <div
        v-for="akhy in leaderboardUsers"
        :key="akhy.id"
        v-motion
        :initial="{ opacity: 0, y: -20, scale: 0.9 }"
        :enter="{ opacity: 1, y: 0, scale: 1, transition: { duration: 300, delay: 50 } }"
        :leave="{ opacity: 0, y: 20, scale: 0.9, transition: { duration: 200 } }"
        style="border-radius: 10px"
        :style="
          akhy.id === discordId
            ? 'background: radial-gradient(circle at -100% -300%,#5865f2,transparent 100%)'
            : ''
        "
      >
        <div
          v-if="akhy"
          style="
            display: flex;
            place-content: space-between;
            min-width: 300px;
            width: 100%;
            padding: 0.5em 1em;
          "
        >
          <span style="color: #ddd; display: flex; place-items: center; gap: 0.7rem">
            <v-img
              :src="akhy.avatarUrl"
              color="transparent"
              style="border-radius: 50%; width: 20px; height: 20px"
            />
            @{{ akhy?.username }}&nbsp;
            <i v-if="akhy?.isAkhy" class="mdi mdi-check-decagram-outline" title="Akhy certifié"></i>
            <i v-if="akhy.id === devId" class="mdi mdi-crown-outline" title="FlopoDev"></i>
          </span>
          <div v-if="leaderboardType === 'coins'" style="display: flex; place-items: center">
            {{ leaderboardType === 'coins' ? formatAmount(akhy.coins) : akhy.elo }}
          </div>
          <div v-else style="display: flex; place-items: center">
            <v-img :src="rankIcon(akhy.elo)" width="20" height="20">
              <div
                :style="`position: absolute; display: flex; width: 100%; height: 100%; place-items: center; place-content: center; font-size: .8em; color: #222`"
              >
                <p style="font-weight: 400">{{ rankDiv(akhy?.elo) }}</p>
              </div>
            </v-img>
          </div>

          <v-menu activator="parent" location="end" open-on-click transition="scale-transition">
            <v-list
              width="250"
              class="mr-2 py-0"
              elevation="20"
              rounded="xl"
              bg-color="#181818"
              base-color="white"
              variant="tonal"
              style="border: 2px solid #ffffff55"
            >
              <v-list-item class="px-2">
                <v-list-item-title
                  style="display: flex; place-content: start; place-items: center; gap: 0.7rem"
                  class="cursor-pointer"
                  @click="$router.push('/akhy/' + akhy.id)"
                >
                  <v-img
                    :src="akhy.avatarUrl"
                    color="transparent"
                    max-width="30"
                    style="border-radius: 50%; width: 20px; height: 30px"
                  />
                  {{ akhy?.username }}
                </v-list-item-title>
              </v-list-item>
              <v-list-item>
                <v-sparkline
                  smooth
                  auto-draw
                  class="pa-0 ma-0"
                  color="primary"
                  line-width="2"
                  :model-value="
                    sparklines[akhy.id]?.length > 1
                      ? sparklines[akhy.id]?.map((entry) => entry.userNewAmount)
                      : [0, 0]
                  "
                  style="position: absolute; left: 0; top: 0"
                  title="Evolution de FlopoCoins"
                />
              </v-list-item>
              <v-list-item>
                <v-list-item-subtitle>
                  {{
                    users
                      .find((u) => u.id === akhy.id)
                      ?.coins.toString()
                      .replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
                  }}
                  FlopoCoins
                </v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-sparkline
                  smooth
                  auto-draw
                  class="pa-0 ma-0"
                  color="secondary"
                  line-width="2"
                  :model-value="elo_graphs[akhy.id]?.length > 1 ? elo_graphs[akhy.id] : [0, 0]"
                  style="position: absolute; left: 0; top: 0"
                  title="Evolution de l'elo"
                />
              </v-list-item>
              <v-list-item>
                <v-list-item-subtitle> {{ elos[akhy.id] ?? 0 }} FlopoRank </v-list-item-subtitle>
              </v-list-item>
              <v-list-item class="pb-1 px-3">
                <v-btn
                  class="text-none"
                  color="primary"
                  block
                  rounded
                  density="comfortable"
                  @click="$router.push('/akhy/' + akhy.id)"
                  >Voir plus</v-btn
                >
              </v-list-item>
            </v-list>
          </v-menu>
        </div>
      </div>
    </TransitionGroup>
  </div>
  <div v-else class="leaderboard-container">
    <h2 style="display: flex; place-content: space-between">
      Classement
      <span
        class="text-capitalize text-secondary cursor-pointer rounded-lg"
        style="user-select: none"
      >
        {{ leaderboardType }}
      </span>
    </h2>
    <div class="leaderboard">
      <v-skeleton-loader
        v-for="n in 19"
        :key="n"
        type="text"
        color="transparent"
        style="min-width: 300px"
      ></v-skeleton-loader>
    </div>
  </div>

  <!--  DIALOGS -->
  <v-dialog
    v-model="isRegistered"
    class="modals"
    :max-width="550"
    scroll-strategy="block"
    scrollable
    persistent
  >
    <v-card class="modal-card px-6 py-4" variant="tonal">
      <v-card-title class="pb-0 pt-9">
        <h1 style="letter-spacing: 0.03em">Salut @{{ anonUsername }} 👋</h1>
        <v-img
          src="public/flopobot.webp"
          style="position: absolute; right: 0; top: 1em"
          width="150"
        ></v-img>
      </v-card-title>
      <v-card-subtitle class="pb-6">
        <h2>Bienvenue sur Floposite !</h2>
      </v-card-subtitle>
      <v-card-text class="px-4" style="font-size: 1.1em">
        <p>Il semblerait que ce soit ta première visite ici.</p>
        <p>Donc <strong>5000</strong> FlopoCoins de bienvenue pour toi ! 🎉</p>
      </v-card-text>
      <v-card-actions>
        <v-btn
          class="text-none mt-4 px-4"
          density="default"
          color="error"
          variant="flat"
          rounded="lg"
          :disabled="loading"
          @click="logout"
        >
          Quitter
        </v-btn>
        <v-btn
          class="text-none mt-4 px-4"
          density="default"
          color="primary"
          variant="flat"
          rounded="lg"
          :disabled="loading"
          @click="handleRegister"
          @click.stop="isRegistered = false"
        >
          +5000 FlopoCoins
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="loading" style="backdrop-filter: blur(10px) contrast(0.5)">
    <v-card class="px-6 py-4" variant="text" elevation="0">
      <v-card-text class="d-flex justify-center">
        <v-progress-circular
          :size="70"
          :width="10"
          color="primary"
          indeterminate
        ></v-progress-circular>
      </v-card-text>
      <v-card-subtitle class="text-center">Traitement de votre demande en cours...</v-card-subtitle>
    </v-card>
  </v-dialog>

  <v-dialog
    v-model="coinsModal"
    class="modals"
    :max-width="coinsModalMaxWidth"
    scroll-strategy="reposition"
    scrollable
    @update:model-value="
      () => {
        acceptedCGV = false
      }
    "
  >
    <v-card class="modal-card overflow-scroll coins-modal" variant="tonal">
      <v-card-title class="pt-4"> Achat de FlopoCoins </v-card-title>
      <v-card-subtitle class="pb-1">
        <p>Recharge tes FlopoCoins !</p>
      </v-card-subtitle>
      <v-card-text
        class="d-flex px-4 pt-16"
        style="gap: 1em; place-content: start; flex-wrap: wrap; height: fit-content"
      >
        <v-card
          class="article-card"
          color="transparent"
          style="border-radius: 12px"
          :disabled="paymentModal"
        >
          <v-card-item>
            <v-img
              src="5k.svg"
              min-height="200px"
              min-width="200"
              width="100%"
              cover
              rounded="lg"
            ></v-img>
          </v-card-item>
          <v-card-subtitle> +5 000 FlopoCoins </v-card-subtitle>
          <v-card-actions>
            <v-btn
              class="text-none"
              color="primary"
              variant="flat"
              rounded="lg"
              block
              :disabled="loading || !acceptedCGV"
              @click="(buyCoins('offer_5000'), (coinsModal = false))"
            >
              0.99€
            </v-btn>
          </v-card-actions>
        </v-card>
        <v-card
          class="article-card"
          color="transparent"
          style="border-radius: 12px"
          :disabled="paymentModal"
        >
          <v-card-item>
            <v-img
              src="20k.svg"
              min-height="200px"
              min-width="200"
              width="100%"
              cover
              rounded="lg"
            ></v-img>
          </v-card-item>
          <v-card-subtitle> +20 000 FlopoCoins </v-card-subtitle>
          <v-card-actions>
            <v-btn
              class="text-none"
              color="primary"
              variant="flat"
              rounded="lg"
              block
              :disabled="loading || !acceptedCGV"
              @click="(buyCoins('offer_20000'), (coinsModal = false))"
            >
              2.99€
            </v-btn>
          </v-card-actions>
        </v-card>
        <v-card
          class="article-card"
          color="transparent"
          style="border-radius: 12px"
          :disabled="paymentModal"
        >
          <v-card-item>
            <v-img
              src="40k.svg"
              min-height="200px"
              min-width="200"
              width="100%"
              cover
              rounded="lg"
            ></v-img>
          </v-card-item>
          <v-card-subtitle> +40 000 FlopoCoins </v-card-subtitle>
          <v-card-actions>
            <v-btn
              class="text-none"
              color="primary"
              variant="flat"
              rounded="lg"
              block
              :disabled="loading || !acceptedCGV"
              @click="(buyCoins('offer_40000'), (coinsModal = false))"
            >
              4.99€
            </v-btn>
          </v-card-actions>
        </v-card>
        <v-card
          class="article-card"
          color="transparent"
          style="border-radius: 12px"
          :disabled="paymentModal"
        >
          <v-card-item>
            <v-img
              src="100k.svg"
              min-height="200px"
              min-width="200"
              width="100%"
              cover
              rounded="lg"
            ></v-img>
          </v-card-item>
          <v-card-subtitle> +100 000 FlopoCoins </v-card-subtitle>
          <v-card-actions>
            <v-btn
              class="text-none"
              color="primary"
              variant="flat"
              rounded="lg"
              block
              :disabled="loading || !acceptedCGV"
              @click="(buyCoins('offer_100000'), (coinsModal = false))"
            >
              9.99€
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-card-text>
      <v-card-text
        class="pt-1 pb-4 px-5"
        style="color: #ddddddaa; text-align: right; overflow: hidden"
      >
        <v-checkbox v-model="acceptedCGV" class="pt-0 mt-0" color="white" hide-details>
          <template #label>
            <p class="text-left">
              J'ai lu et j'accepte les
              <a
                href="/cgv"
                target="_blank"
                style="color: #5865f2 !important; text-decoration: none; font-size: 1em"
              >
                Conditions Générales de Vente </a
              >, ainsi que la
              <a
                href="/privacy"
                target="_blank"
                style="color: #5865f2 !important; text-decoration: none; font-size: 1em"
              >
                Politique de Confidentialité </a
              >et je renonce expressément à mon droit de rétractation.
            </p>
          </template>
        </v-checkbox>
      </v-card-text>
    </v-card>
  </v-dialog>

  <v-dialog v-model="nicknameModal" class="modals" max-width="800" scroll-strategy="reposition">
    <v-card class="modal-card" variant="tonal">
      <v-card-title>Modif Pseudo</v-card-title>
      <v-card-subtitle>
        <p>Modifie le pseudo de quelqu'un</p>
      </v-card-subtitle>
      <v-card-text>
        <v-select
          v-model="nicknameForm.id"
          placeholder="Akhy"
          clearable
          :items="users.filter((u) => u.isAkhy)"
          item-value="id"
          item-title="username"
          variant="outlined"
          class="text-white w-100"
          rounded="lg"
          density="comfortable"
        >
          <template #item="{ props, item }">
            <v-list-item v-bind="props" rounded="lg" color="primary">
              <template #title>
                <div style="display: flex; place-items: center; place-content: start; gap: 1em">
                  <v-img
                    :src="avatars[item.raw.id]"
                    color="transparent"
                    style="border-radius: 50%; max-width: 40px; height: 40px"
                  />
                  <p>{{ item.raw.username }}</p>
                </div>
              </template>
            </v-list-item>
          </template>
        </v-select>

        <v-text-field
          v-model="nicknameForm.nickname"
          clearable
          placeholder="Nouveau nom"
          variant="outlined"
          rounded="lg"
          density="comfortable"
          class="text-white w-100"
          max-length="20"
          :hint="!nicknameForm.nickname ? 'Nom par défaut' : ''"
          persistent-hint
        />
      </v-card-text>
      <v-card-text class="d-flex justify-end">
        <v-btn
          text="1K FlopoCoins"
          class="text-none"
          append-icon="mdi-play"
          color="primary"
          variant="flat"
          rounded="lg"
          :disabled="!nicknameForm.id"
          @click="changeNickname"
          @click.stop="nicknameModal = false"
        />
      </v-card-text>
    </v-card>
  </v-dialog>

  <v-dialog v-model="spamPingModal" class="modals" max-width="800" scroll-strategy="reposition">
    <v-card class="modal-card" variant="tonal">
      <v-card-title>Spam Ping</v-card-title>
      <v-card-subtitle>
        <p>Spam un akhy pendant 30 secondes</p>
      </v-card-subtitle>
      <v-card-text class="d-flex" style="gap: 1em">
        <v-select
          v-model="spamPingForm.id"
          placeholder="Akhy"
          clearable
          :items="users.filter((u) => u.isAkhy)"
          item-value="id"
          item-title="username"
          variant="outlined"
          class="text-white w-50"
          rounded="lg"
          density="comfortable"
        >
          <template #item="{ props, item }">
            <v-list-item v-bind="props" rounded="lg" color="primary">
              <template #title>
                <div style="display: flex; place-items: center; place-content: start; gap: 1em">
                  <v-img
                    :src="avatars[item.raw.id]"
                    color="transparent"
                    style="border-radius: 50%; max-width: 40px; height: 40px"
                  />
                  <p>{{ item.raw.username }}</p>
                </div>
              </template>
            </v-list-item>
          </template>
        </v-select>
      </v-card-text>
      <v-card-text class="d-flex justify-end">
        <v-btn
          text="5K FlopoCoins"
          class="text-none"
          append-icon="mdi-play"
          color="primary"
          variant="flat"
          rounded="lg"
          :disabled="!spamPingForm.id"
          @click="spamPing"
          @click.stop="spamPingModal = false"
        />
      </v-card-text>
    </v-card>
  </v-dialog>

  <v-dialog v-model="slowmodeModal" class="modals" max-width="800" scroll-strategy="reposition">
    <v-card class="modal-card" variant="tonal">
      <v-card-title>Slow Mode</v-card-title>
      <v-card-subtitle>
        <p>1 message par minute pendant 1 heure</p>
      </v-card-subtitle>
      <v-card-text class="d-flex" style="gap: 1em">
        <v-select
          v-model="slowmodeForm.id"
          placeholder="Akhy"
          clearable
          :items="users.filter((u) => u.isAkhy)"
          item-value="id"
          item-title="username"
          variant="outlined"
          class="text-white w-50"
          rounded="lg"
          density="comfortable"
          hint="Tu peux retirer ton slowmode en te mettant toi-même"
          persistent-hint
        >
          <template #item="{ props, item }">
            <v-list-item v-bind="props" rounded="lg" color="primary">
              <template #title>
                <div style="display: flex; place-items: center; place-content: start; gap: 1em">
                  <v-img
                    :src="avatars[item.raw.id]"
                    color="transparent"
                    style="border-radius: 50%; max-width: 40px; height: 40px"
                  />
                  <p>{{ item.raw.username }}</p>
                </div>
              </template>
            </v-list-item>
          </template>
        </v-select>
      </v-card-text>
      <v-card-text class="d-flex justify-end">
        <v-btn
          text="10K FlopoCoins"
          class="text-none"
          append-icon="mdi-play"
          color="primary"
          variant="flat"
          rounded="lg"
          :disabled="!slowmodeForm.id"
          @click="slowmode"
          @click.stop="slowmodeModal = false"
        />
      </v-card-text>
    </v-card>
  </v-dialog>

  <v-dialog v-model="timeoutModal" class="modals" max-width="800" scroll-strategy="reposition">
    <v-card class="modal-card" variant="tonal">
      <v-card-title>Time-Out</v-card-title>
      <v-card-subtitle>
        <p>Time-out quelqu'un pendant 12 heures</p>
      </v-card-subtitle>
      <v-card-text class="d-flex" style="gap: 1em">
        <v-select
          v-model="timeoutForm.id"
          placeholder="Akhy"
          clearable
          :items="users.filter((u) => u.isAkhy)"
          item-value="id"
          item-title="username"
          variant="outlined"
          class="text-white w-50"
          rounded="lg"
          density="comfortable"
          hint="Tu peux retirer ton time-out en te mettant toi-même"
          persistent-hint
        >
          <template #item="{ props, item }">
            <v-list-item v-bind="props" rounded="lg" color="primary">
              <template #title>
                <div style="display: flex; place-items: center; place-content: start; gap: 1em">
                  <v-img
                    :src="avatars[item.raw.id]"
                    color="transparent"
                    style="border-radius: 50%; max-width: 40px; height: 40px"
                  />
                  <p>{{ item.raw.username }}</p>
                </div>
              </template>
            </v-list-item>
          </template>
        </v-select>
      </v-card-text>
      <v-card-text class="d-flex justify-end">
        <v-btn
          text="100K FlopoCoins"
          class="text-none"
          append-icon="mdi-play"
          color="primary"
          variant="flat"
          rounded="lg"
          :disabled="!timeoutForm.id"
          @click="timeout"
          @click.stop="timeoutModal = false"
        />
      </v-card-text>
    </v-card>
  </v-dialog>

  <v-dialog v-model="prediModal" class="modals" max-width="800" scroll-strategy="reposition">
    <v-card class="modal-card" variant="tonal">
      <v-card-title>Prédi</v-card-title>
      <v-card-subtitle>
        <p>Crées une nouvelle prédiction</p>
      </v-card-subtitle>
      <v-card-text class="d-flex pb-4" style="gap: 1em">
        <v-select
          v-model="prediForm.closingTime"
          label="Fermeture des votes"
          :items="[
            { time: 300, label: '5 minutes' },
            { time: 600, label: '10 minutes' },
            { time: 1800, label: '30 minutes' },
            { time: 3600, label: '1 heure' },
            { time: 7200, label: '2 heures' },
            { time: 10800, label: '3 heures' },
            { time: 14400, label: '4 heures' },
            { time: 18000, label: '5 heures' },
            { time: 21600, label: '6 heures' },
            { time: 43200, label: '12 heures' },
            { time: 86400, label: '24 heures' },
          ]"
          item-value="time"
          item-title="label"
          variant="outlined"
          class="text-white w-50"
          rounded="lg"
          density="comfortable"
          hint="Temps pour voter"
          persistent-hint
        />
        <v-select
          v-model="prediForm.payoutTime"
          label="Résultats"
          :items="[
            { time: 300, label: '5 minutes' },
            { time: 600, label: '10 minutes' },
            { time: 1800, label: '30 minutes' },
            { time: 3600, label: '1 heure' },
            { time: 7200, label: '2 heures' },
            { time: 10800, label: '3 heures' },
            { time: 14400, label: '4 heures' },
            { time: 18000, label: '5 heures' },
            { time: 21600, label: '6 heures' },
            { time: 43200, label: '12 heures' },
            { time: 86400, label: '24 heures' },
          ]"
          item-value="time"
          item-title="label"
          variant="outlined"
          class="text-white w-50"
          rounded="lg"
          density="comfortable"
          hint="Fin de la prédi"
          persistent-hint
        />
      </v-card-text>
      <v-card-text class="d-flex pt-0 pb-4" style="gap: 1em">
        <v-text-field
          v-model="prediForm.label"
          label="Titre de la prédi"
          max-length="64"
          clearable
          variant="outlined"
          class="text-white w-50"
          rounded="lg"
          density="comfortable"
          hide-details
        />
      </v-card-text>
      <v-card-text class="d-flex pt-0" style="gap: 1em">
        <v-text-field
          v-model="prediForm.options[0]"
          label="Option 1"
          max-length="32"
          clearable
          variant="outlined"
          class="text-white w-50"
          rounded="lg"
          density="comfortable"
        />
        <v-text-field
          v-model="prediForm.options[1]"
          label="Option 2"
          max-length="32"
          clearable
          variant="outlined"
          class="text-white w-50"
          rounded="lg"
          density="comfortable"
        />
      </v-card-text>
      <v-card-text class="d-flex justify-end">
        <v-btn
          text="100 FlopoCoins"
          class="text-none"
          append-icon="mdi-play"
          color="primary"
          variant="flat"
          rounded="lg"
          :disabled="!prediForm.label || !prediForm.options[0] || !prediForm.options[1]"
          @click="startPredi"
          @click.stop="prediModalClose"
        />
      </v-card-text>
    </v-card>
  </v-dialog>

  <v-dialog
    v-model="prediVoteModal"
    class="modals"
    max-width="800"
    scroll-strategy="reposition"
    scrollable
  >
    <v-card v-if="selectedPredi" :key="Date.now()" class="modal-card" variant="tonal">
      <v-card-title>{{ selectedPredi.label }}</v-card-title>
      <v-card-subtitle>
        <p>Choisis un montant à parier</p>
      </v-card-subtitle>
      <v-card-text class="pa-0">
        <v-card-text v-if="!processingVote" class="w-100 d-flex predi-vote-options pb-4 px-4">
          <v-card
            class="predi-option-card"
            variant="text"
            rounded="xl"
            :style="
              selectedPredi.options[0].votes.find((v) => v.id === discordId) ||
              (selectedOption === 0 &&
                !selectedPredi.options[1].votes.find((v) => v.id === discordId))
                ? 'box-shadow: 0 0 10px 0 #ddddddaa !important; border: 2px solid #5865f2 !important'
                : ''
            "
            @click="
              ((selectedPredi.closingTime - Date.now()) / 1000).toFixed() > 0 &&
              !selectedPredi.options[1].votes.find((v) => v.id === discordId) &&
              !selectedPredi.closed
                ? (selectedOption = 0)
                : ''
            "
          >
            <v-card-text class="font-weight-bold">{{ selectedPredi.options[0].label }}</v-card-text>
            <v-card-subtitle>Option 1</v-card-subtitle>
            <v-card-text class="d-flex justify-center">
              <h1>{{ formatAmount(selectedPredi.options[0].total) }}</h1>
            </v-card-text>
            <v-card-item class="pr-0">
              <div style="width: 100%; display: flex; flex-direction: column; place-items: end">
                <p class="pr-4">{{ selectedPredi.options[0].percent.toFixed(1) }}%</p>
                <div
                  class="animate__animated animate__fadeIn"
                  :style="`height: 15px; width: 100%; transition: 1s ease-in-out; transform: translateX(${100 - selectedPredi.options[0].percent}%); background: #5865f2; border-radius: 20px 0 0 20px; border: 2px solid #5865f2`"
                ></div>
              </div>
            </v-card-item>
            <v-card-text class="pb-1">
              <p>
                {{ selectedPredi.options[0].votes.length }} vote(s) - Côte
                {{
                  (selectedPredi.options[0].total > 0
                    ? 1 + selectedPredi.options[1].total / selectedPredi.options[0].total
                    : 1
                  ).toFixed(2)
                }}
              </p>
            </v-card-text>
            <v-card-text class="d-flex justify-space-between pt-0 pb-3">
              <div
                style="
                  display: flex;
                  place-content: start;
                  gap: 0;
                  width: 100%;
                  overflow: hidden;
                  border-radius: 10px;
                "
              >
                <div
                  v-for="(vote, index) in selectedPredi.options[0].votes"
                  :key="vote.id + Date.now()"
                  :style="`transform: translateX(calc(-10px * ${index})); z-index: 1;`"
                >
                  <v-img
                    :src="avatars[vote.id]"
                    color="transparent"
                    style="border-radius: 50%; width: 20px; height: 20px"
                  />
                </div>
              </div>
            </v-card-text>
          </v-card>
          <v-card
            class="predi-option-card"
            variant="text"
            rounded="xl"
            :style="
              selectedPredi.options[1].votes.find((v) => v.id === discordId) ||
              (selectedOption === 1 &&
                !selectedPredi.options[0].votes.find((v) => v.id === discordId))
                ? 'box-shadow: 0 0 10px 0 #ddddddaa !important; border: 2px solid #aa3e3e !important'
                : ''
            "
            @click="
              ((selectedPredi.closingTime - Date.now()) / 1000).toFixed() > 0 &&
              !selectedPredi.options[0].votes.find((v) => v.id === discordId) &&
              !selectedPredi.closed
                ? (selectedOption = 1)
                : ''
            "
          >
            <v-card-text class="font-weight-bold">{{ selectedPredi.options[1].label }}</v-card-text>
            <v-card-subtitle>Option 2</v-card-subtitle>
            <v-card-text class="d-flex justify-center">
              <h1>{{ formatAmount(selectedPredi.options[1].total) }}</h1>
            </v-card-text>
            <v-card-item class="pl-0">
              <div style="width: 100%; display: flex; flex-direction: column; place-items: start">
                <p class="pl-4">{{ selectedPredi.options[1].percent.toFixed(1) }}%</p>
                <div
                  class="animate__animated animate__fadeIn"
                  :style="`height: 15px; width: 100%; transition: 1s ease-in-out; transform: translateX(${selectedPredi.options[1].percent - 100}%); background: #aa3e3e; border-radius: 0 20px 20px 0; border: 2px solid #aa3e3e77`"
                ></div>
              </div>
            </v-card-item>
            <v-card-text class="pb-1">
              <p>
                {{ selectedPredi.options[1].votes.length }} vote(s) - Côte
                {{
                  (selectedPredi.options[1].total > 0
                    ? 1 + selectedPredi.options[0].total / selectedPredi.options[1].total
                    : 1
                  ).toFixed(2)
                }}
              </p>
            </v-card-text>
            <v-card-text class="d-flex justify-space-between pt-0 pb-3">
              <div
                style="
                  display: flex;
                  place-content: start;
                  gap: 0;
                  width: 100%;
                  overflow: hidden;
                  border-radius: 10px;
                "
              >
                <div
                  v-for="(vote, index) in selectedPredi.options[1].votes"
                  :key="vote.id + Date.now()"
                  :style="`transform: translateX(calc(-10px * ${index})); z-index: 1;`"
                >
                  <v-img
                    :src="avatars[vote.id]"
                    color="transparent"
                    style="border-radius: 50%; width: 20px; height: 20px"
                  />
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-card-text>
        <v-card-item
          v-if="!processingVote"
          v-show="
            ((selectedPredi.closingTime - Date.now()) / 1000).toFixed() > 0 && !selectedPredi.closed
          "
        >
          <v-number-input
            v-model="prediVoteForm.amount"
            class="pt-1"
            clearable
            variant="outlined"
            control-variant="hidden"
            density="compact"
            rounded="lg"
            label="Montant du paris"
            :hint="`${formatAmount(Math.min(user.coins, 250000))} FlopoCoins max (10 minimum)`"
            :max="Math.min(user.coins, 250000)"
          >
            <template #append>
              <v-btn
                variant="flat"
                text="Prédir"
                :color="selectedOption === 1 ? '#aa3e3e' : '#5865f2'"
                class="text-none"
                :disabled="
                  selectedOption === null ||
                  !prediVoteForm.amount ||
                  prediVoteForm.amount < 10 ||
                  prediVoteForm > 250000
                "
                @click="prediVote"
                @click.stop="prediVoteModal = false"
              ></v-btn>
            </template>
          </v-number-input>
        </v-card-item>
        <v-card-subtitle
          v-if="
            selectedPredi.options[0].votes.find((v) => v.id === discordId) ||
            selectedPredi.options[1].votes.find((v) => v.id === discordId)?.amount
          "
        >
          Tu as misé
          {{
            formatAmount(
              selectedPredi.options[0].votes.find((v) => v.id === discordId)?.amount ??
                selectedPredi.options[1].votes.find((v) => v.id === discordId)?.amount,
            )
          }}
          FlopoCoins sur
          <span class="font-weight-bold font-italic"
            >'{{
              selectedPredi.options[0].votes.find((v) => v.id === discordId)
                ? selectedPredi.options[0].label
                : selectedPredi.options[1].label
            }}'</span
          >
        </v-card-subtitle>
        <v-card-text class="px-4">
          <p v-if="!selectedPredi.closed">
            {{
              ((selectedPredi.closingTime - Date.now()) / 1000).toFixed() > 0
                ? ((selectedPredi.closingTime - Date.now()) / 1000).toFixed() +
                  's restantes pour voter'
                : ((selectedPredi.endTime - Date.now()) / 1000).toFixed() > 0
                  ? Math.max(((selectedPredi.endTime - Date.now()) / 1000).toFixed(), 0) +
                    's avant les résultats'
                  : 'Prédi terminée, en attente de validation'
            }}
          </p>
          <p v-else-if="selectedPredi.cancelledTime === null">
            Prédi terminée, les FlopoCoins ont été distribués - Résultat :
            <span class="font-weight-bold font-italic"
              >'{{ selectedPredi.options[selectedPredi.winning].label }}'</span
            >
          </p>
          <p v-else>Prédi annulée, les FlopoCoins ont été remboursés</p>
        </v-card-text>
        <v-card-item v-if="discordId === devId" class="px-4">
          <v-btn
            color="primary"
            text="Valider option 1"
            rounded="lg"
            class="mr-3"
            :disabled="selectedPredi.closingTime > Date.now() || selectedPredi.closed"
            @click="endPredi(true, 0)"
            @click.stop="prediVoteModal = false"
          />
          <v-btn
            color="primary"
            text="Valider option 2"
            rounded="lg"
            class="mr-3"
            :disabled="selectedPredi.closingTime > Date.now() || selectedPredi.closed"
            @click="endPredi(true, 1)"
            @click.stop="prediVoteModal = false"
          />
          <v-btn
            color="primary"
            text="Annuler la prédi"
            rounded="lg"
            variant="outlined"
            :disabled="selectedPredi.closed"
            @click="endPredi(false, null)"
            @click.stop="prediVoteModal = false"
          />
        </v-card-item>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
/* global localStorage */
import axios from 'axios'
import { io } from 'socket.io-client'
import { useToastStore } from '../stores/toastStore.js'
import 'animate.css'

export default {
  setup() {
    const toastStore = useToastStore()

    const showLogoutToast = () => {
      toastStore.showLogoutToast()
    }

    const showSendingToast = () => {
      toastStore.showSendingToast()
    }

    const showSentToast = () => {
      toastStore.showSentToast()
    }

    const showCommandToast = (message) => {
      toastStore.showCommandToast(message)
    }

    const showSuccessOrWarningToast = (message, warning) => {
      toastStore.showSuccessOrWarningToast(message, warning)
    }

    const showErrorToast = (message) => {
      toastStore.showErrorToast(message)
    }

    return {
      toastStore: toastStore.$state,
      showLogoutToast,
      showSentToast,
      showSendingToast,
      showCommandToast,
      showSuccessOrWarningToast,
      showErrorToast,
    }
  },

  data() {
    return {
      windowWidth: window.innerWidth,

      anonUsername: null,

      isRegistered: false,
      tab: null,
      message: null,
      discordId: null,
      users: null,
      usersByElo: null,
      avatar: null,
      socket: null,
      user_inventory: null,
      user_isTimedOut: false,

      leaderboardUsers: null,
      leaderboardType: 'coins',

      active_polls: null,
      active_slowmodes: null,
      active_predis: null,
      processingVote: false,
      selectedPrediKey: null,
      selectedPredi: null,
      selectedOption: null,

      coinsModal: false,
      paymentModal: false,
      nicknameModal: false,
      spamPingModal: false,
      slowmodeModal: false,
      timeoutModal: false,
      prediModal: false,
      prediVoteModal: false,

      avatars: {},
      sparklines: {},
      elo_graphs: {},
      elos: {},
      buyCoinsForm: {
        price: null,
        coins: null,
      },
      nicknameForm: {
        id: null,
        nickname: null,
      },
      spamPingForm: {
        id: null,
      },
      slowmodeForm: {
        id: null,
      },
      timeoutForm: {
        id: null,
      },
      prediForm: {
        label: null,
        options: [],
        closingTime: 300,
        payoutTime: 300,
      },
      prediVoteForm: {
        amount: null,
      },

      loading: false,
      error: null,
      stripePromise: null,

      gameCardsFilter: null,

      acceptedCGV: false,
    }
  },

  computed: {
    user() {
      const filtered = this.users?.filter((u) => u.id === this.discordId)
      if (filtered?.length < 1) return null
      return this.users?.filter((u) => u.id === this.discordId)[0]
    },
    inventoryValue() {
      if (!this.user_inventory) return 0
      let sum = 0
      this.user_inventory.forEach((s) => {
        sum += s.currentPrice
      })
      return sum
    },
    devId() {
      return import.meta.env.VITE_DEV_ID
    },
    unseenActivePoll() {
      return (
        Object.values(this.active_polls)?.filter((p) => {
          return !p.voters.includes(this.discordId)
        })?.length > 0
      )
    },
    coinsModalMaxWidth() {
      if (this.windowWidth <= 850) {
        return 350
      } else if (this.windowWidth <= 1200) {
        return 511
      } else {
        return 1005
      }
    },
    percentages() {
      if (!this.selectedPredi) return
      let res1 = 0
      let res2 = 0
      if (
        this.selectedPredi.options[0].votes.length === 0 &&
        this.selectedPredi.options[1].votes.length === 0
      )
        return {
          res1,
          res2,
        }

      res1 =
        this.selectedPredi.options[1].votes.length === 0
          ? 100
          : (this.prediOptionStats(this.selectedPredi.options[0].votes, 'amount') /
              this.prediOptionStats(this.selectedPredi.options[1].votes, 'amount')) *
            100
      res2 = 100 - res1

      return { res1, res2 }
    },
  },

  watch: {
    prediVoteModal(newValue) {
      this.selectedOption = !newValue ? null : this.selectedOption
      this.getActivePredis()
    },
  },

  async mounted() {
    this.discordId = localStorage.getItem('discordId')
    if (!this.discordId) this.$router.push('/')

    await this.getUsers()
    if (!this.users) this.$router.push('/')
    this.leaderboardUsers = this.users

    this.avatar = await this.getAvatar(this.discordId)
    this.anonUsername = await this.fetchUsername(this.discordId)
    this.fetchAvatars()
    this.fetchSparklines()
    this.fetchElos()
    this.fetchEloGraphs()
    //await this.getInventory()
    await this.getActivePolls()
    await this.getActiveSlowmodes()
    await this.getActivePredis()
    await this.isTimedOut()

    this.isRegistered = !this.users?.find((u) => u.id === this.discordId)

    this.initSocket()
    window.addEventListener('resize', this.updateWindowWidth)
  },

  beforeUnmount() {
    // Clean up socket connection when component is destroyed
    if (this.socket) {
      this.socket.disconnect()
    }
  },

  methods: {
    updateWindowWidth() {
      this.windowWidth = window.innerWidth
    },
    handleSuccess() {
      this.paymentModal = false
      this.coinsModal = false
      this.showSuccessOrWarningToast('Paiement effectué !', false)
      this.buyCoins()
    },
    leaderboardSwitch() {
      this.leaderboardType = this.leaderboardType === 'coins' ? 'rank' : 'coins'
      this.leaderboardUsers = this.leaderboardType === 'coins' ? this.users : this.usersByElo
    },

    updateUserCoinsLocally(userId, newCoins) {
      // Update coins in the users array (sorted by coins)
      if (this.users) {
        const userIndex = this.users.findIndex((u) => u.id === userId)
        if (userIndex !== -1) {
          this.users[userIndex].coins = newCoins
          // Re-sort the array by coins (descending)
          this.users.sort((a, b) => b.coins - a.coins)
        }
      }

      // Update coins in the usersByElo array as well
      if (this.usersByElo) {
        const userEloIndex = this.usersByElo.findIndex((u) => u.id === userId)
        if (userEloIndex !== -1) {
          this.usersByElo[userEloIndex].coins = newCoins
          // Keep the ELO sorting intact, only update the coins value
        }
      }

      // Trigger reactivity by reassigning the current leaderboard
      // This will cause the TransitionGroup to animate the position changes
      if (this.leaderboardType === 'coins') {
        this.leaderboardUsers = [...this.users]
      } else {
        this.leaderboardUsers = [...this.usersByElo]
      }
    },

    initSocket() {
      // Connect to your bot's Socket.IO server
      this.socket = io(import.meta.env.VITE_FLAPI_URL.replace(/\/api$/, ''), {
        withCredentials: false,
        auth: { token: localStorage.getItem('token') },
        extraHeaders: {
          'ngrok-skip-browser-warning': 'true',
        },
      })

      // Handle connection events
      this.socket.on('connect', () => {
        console.log('Connected to WebSocket server')
      })

      // Listen for data updates
      this.socket.on('data-updated', async (data) => {
        // If we have userId and newCoins, update locally with animation
        if (data.userId && data.newCoins !== undefined) {
          this.updateUserCoinsLocally(data.userId, data.newCoins)
          this.sparklines[data.userId] = await this.getSparkline(data.userId)
          console.log(this.sparklines)
        } else {
          // Fallback to full refresh if data format is unexpected
          this.getUsers()
          this.fetchSparklines()
        }
      })

      this.socket.on('new-poll', (data) => {
        console.log('New Poll:', data.action)
        this.getActivePolls()
      })

      this.socket.on('new-slowmode', (data) => {
        console.log('New Slowmode:', data.action)
        this.getActiveSlowmodes()
      })

      this.socket.on('new-predi', async (data) => {
        console.log('New predi:', data.action)
        await this.getActivePredis()
        this.selectedPredi = this.active_predis[this.selectedPrediKey]
        this.processingVote = false
      })

      this.socket.on('disconnect', () => {
        console.log('Disconnected from WebSocket server')
      })

      this.socket.on('daily-queried', async (data) => {
        if (data.userId === this.discordId)
          this.showSuccessOrWarningToast('+500 FlopoCoins, récompense journalière récupérée', false)
        await this.getUsers()
      })
    },

    async handleRegister() {
      const fetchUrl = import.meta.env.VITE_FLAPI_URL + '/register-user'
      try {
        const response = await axios.post(fetchUrl)
        this.showSuccessOrWarningToast(response.data.message, false)
        await this.getUsers()
        this.avatar = await this.getAvatar(this.discordId)
        this.anonUsername = await this.fetchUsername(this.discordId)
        this.fetchAvatars()
        this.fetchSparklines()
        this.fetchElos()
        this.fetchEloGraphs()
        // await this.getInventory()
        await this.getActivePolls()
        await this.getActiveSlowmodes()
        await this.getActivePredis()
        await this.isTimedOut()
      } catch (e) {
        console.error('flAPI error:', e)
      }
    },

    async fetchUsername(id) {
      const fetchUrl = import.meta.env.VITE_FLAPI_URL + '/user/' + id + '/username'
      try {
        const response = await axios.get(fetchUrl, {
          headers: {
            'ngrok-skip-browser-warning': 'true',
            'Content-Type': 'application/json',
          },
          withCredentials: false,
        })
        return response.data?.user?.username
      } catch (e) {
        console.log(e)
      }
    },

    fetchAvatars() {
      this.users.forEach(async (user) => {
        this.avatars[user.id] = await this.getAvatar(user.id)
      })
    },

    fetchSparklines() {
      this.users.forEach(async (user) => {
        this.sparklines[user.id] = await this.getSparkline(user.id)
      })
    },

    fetchElos() {
      this.users.forEach(async (user) => {
        this.elos[user.id] = await this.getElo(user.id)
      })
    },

    fetchEloGraphs() {
      this.users.forEach(async (user) => {
        this.elo_graphs[user.id] = await this.getEloGraph(user.id)
      })
    },

    logout() {
      localStorage.removeItem('discordId')
      localStorage.removeItem('token')
      this.showLogoutToast()
      this.$router.push('/')
    },

    async getUsers() {
      const fetchUrl = import.meta.env.VITE_FLAPI_URL + '/users'
      try {
        const response = await axios.get(fetchUrl, {
          headers: {
            'ngrok-skip-browser-warning': 'true',
            'Content-Type': 'application/json',
          },
          withCredentials: false,
        })
        this.users = response.data
      } catch (e) {
        console.error('flAPI error:', e)
      }

      try {
        const response = await axios.get(fetchUrl + '/by-elo', {
          headers: {
            'ngrok-skip-browser-warning': 'true',
            'Content-Type': 'application/json',
          },
          withCredentials: false,
        })
        this.usersByElo = response.data
      } catch (e) {
        console.error('flAPI error:', e)
      }
    },

    async getAvatar(id) {
      const fetchUrl = import.meta.env.VITE_FLAPI_URL + '/user/' + id + '/avatar'
      try {
        const response = await axios.get(fetchUrl, {
          headers: {
            'ngrok-skip-browser-warning': 'true',
            'Content-Type': 'application/json',
          },
          withCredentials: false,
        })
        return response.data.avatarUrl
      } catch (e) {
        console.error('flAPI error:', e)
      }
    },

    async getSparkline(id) {
      const fetchUrl = import.meta.env.VITE_FLAPI_URL + '/user/' + id + '/sparkline'
      try {
        const response = await axios.get(fetchUrl)
        return response.data.sparkline
      } catch (e) {
        console.error('flAPI error:', e)
      }
    },

    async getElo(id) {
      const fetchUrl = import.meta.env.VITE_FLAPI_URL + '/user/' + id + '/elo'
      try {
        const response = await axios.get(fetchUrl)
        return response.data.elo
      } catch (e) {
        console.error('flAPI error:', e)
      }
    },

    async getEloGraph(id) {
      const fetchUrl = import.meta.env.VITE_FLAPI_URL + '/user/' + id + '/elo-graph'
      try {
        const response = await axios.get(fetchUrl)
        return response.data.eloGraph
      } catch (e) {
        console.error('flAPI error:', e)
      }
    },

    async getInventory() {
      const fetchUrl = import.meta.env.VITE_FLAPI_URL + '/user/' + this.discordId + '/inventory'
      try {
        const response = await axios.get(fetchUrl, {
          headers: {
            'ngrok-skip-browser-warning': 'true',
            'Content-Type': 'application/json',
          },
          withCredentials: false,
        })
        this.user_inventory = response.data.inventory
      } catch (e) {
        console.error('flAPI error:', e)
      }
    },

    async getActivePolls() {
      const fetchUrl = import.meta.env.VITE_FLAPI_URL + '/polls'
      try {
        const response = await axios.get(fetchUrl, {
          headers: {
            'ngrok-skip-browser-warning': 'true',
            'Content-Type': 'application/json',
          },
          withCredentials: false,
        })
        this.active_polls = response.data.activePolls
      } catch (e) {
        console.error('flAPI error:', e)
      }
    },

    async getActiveSlowmodes() {
      const fetchUrl = import.meta.env.VITE_FLAPI_URL + '/slowmodes'
      try {
        const response = await axios.get(fetchUrl, {
          headers: {
            'ngrok-skip-browser-warning': 'true',
            'Content-Type': 'application/json',
          },
          withCredentials: false,
        })
        this.active_slowmodes = response.data.slowmodes
      } catch (e) {
        console.error('flAPI error:', e)
      }
    },

    async changeNickname() {
      this.showCommandToast('Changement du pseudo...')
      try {
        const response = await axios.post(import.meta.env.VITE_FLAPI_URL + '/change-nickname', {
          userId: this.nicknameForm.id,
          nickname: this.nicknameForm.nickname,
        })
        this.showSuccessOrWarningToast(response.data.message, false)
      } catch (e) {
        this.showErrorToast(e.response.data.message)
      }
    },

    async spamPing() {
      this.showCommandToast('Envoi de la commande')
      try {
        const response = await axios.post(import.meta.env.VITE_FLAPI_URL + '/spam-ping', {
          userId: this.spamPingForm.id,
        })
        this.showSuccessOrWarningToast(response.data.message, false)
      } catch (e) {
        this.showErrorToast(e.response.data.message)
      }
    },

    async timeoutVote(voteKey, voteFor) {
      this.showCommandToast('Envoi du vote...')
      try {
        const response = await axios.post(import.meta.env.VITE_FLAPI_URL + '/timeout/vote', {
          voteKey: voteKey,
          voteFor: voteFor,
        })
        this.showSuccessOrWarningToast(response.data.message, false)
      } catch (e) {
        this.showErrorToast(e.response.data.message)
      }
    },

    async slowmode() {
      this.showCommandToast('Envoi de la commande...')
      try {
        const response = await axios.post(import.meta.env.VITE_FLAPI_URL + '/slowmode', {
          userId: this.slowmodeForm.id,
        })
        this.showSuccessOrWarningToast(response.data.message, false)
      } catch (e) {
        this.showErrorToast(e.response.data.message)
      }
    },

    async timeout() {
      this.showCommandToast('Envoi de la commande...')
      try {
        const response = await axios.post(import.meta.env.VITE_FLAPI_URL + '/timeout', {
          userId: this.timeoutForm.id,
        })
        this.showSuccessOrWarningToast(response.data.message, false)
      } catch (e) {
        this.showErrorToast(e.response.data.message)
      }
    },

    async startPredi() {
      this.showCommandToast('Création de la prédiction...')
      try {
        const response = await axios.post(import.meta.env.VITE_FLAPI_URL + '/start-predi', {
          label: this.prediForm.label,
          options: this.prediForm.options,
          closingTime: this.prediForm.closingTime,
          payoutTime: this.prediForm.payoutTime,
        })
        this.showSuccessOrWarningToast(response.data.message, false)
      } catch (e) {
        this.showErrorToast(e.response.data.message)
      }
    },

    async getActivePredis() {
      try {
        const response = await axios.get(import.meta.env.VITE_FLAPI_URL + '/predis', {
          headers: {
            'ngrok-skip-browser-warning': 'true',
            'Content-Type': 'application/json',
          },
          withCredentials: false,
        })
        this.active_predis = response.data.predis
      } catch (e) {
        console.error('flAPI error:', e)
      }
    },

    async prediVote() {
      this.showCommandToast('Prise en compte du vote...')
      try {
        const response = await axios.post(import.meta.env.VITE_FLAPI_URL + '/vote-predi', {
          predi: this.selectedPrediKey,
          amount: this.prediVoteForm.amount,
          option: this.selectedOption,
        })
        this.showSuccessOrWarningToast(response.data.message, false)
      } catch (e) {
        this.showErrorToast(e.response.data.message)
      }
    },

    async endPredi(confirm, winningOption) {
      this.showCommandToast('Fermeture de la prédiction...')
      if (this.discordId !== this.devId) {
        this.showErrorToast("Tu n'as pas les permissions requises")
        return
      }
      try {
        const response = await axios.post(import.meta.env.VITE_FLAPI_URL + '/end-predi', {
          predi: this.selectedPrediKey,
          confirm: confirm,
          winningOption: winningOption,
        })
        this.showSuccessOrWarningToast(response.data.message, false)
      } catch (e) {
        this.showErrorToast(e.response.data.message)
      }

      await this.getActivePredis()
    },

    async addCoins() {
      try {
        await axios.post(import.meta.env.VITE_FLAPI_URL + '/add-coins')
      } catch (e) {
        console.log(e)
      }
    },

    async buyCoins(offerId) {
      try {
        this.loading = true

        // Call the new checkout session endpoint
        const response = await axios.post(
          import.meta.env.VITE_FLAPI_URL + '/create-checkout-session',
          {
            offerId: offerId,
          },
        )

        const { url } = response.data

        // Redirect to Stripe Checkout (Stripe.js v8 method)
        window.location.href = url
      } catch (e) {
        console.error('Error creating checkout session:', e)
        this.showErrorToast('Erreur lors de la création de la session de paiement')
      } finally {
        // this.loading = false will be handled on the success page after redirection
      }
    },

    async handleDailyQuery() {
      try {
        await axios.get(import.meta.env.VITE_FLAPI_URL + '/user/' + this.discordId + '/daily')
        this.user.dailyQueried = true
      } catch (e) {
        console.log(e)
      }
    },

    formatAmount(amount) {
      if (amount >= 1000000000) {
        amount /= 1000000000
        return (
          amount
            .toFixed(2)
            .toString()
            .replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + 'Md'
        )
      }
      if (amount >= 1000000) {
        amount /= 1000000
        return (
          amount
            .toFixed(2)
            .toString()
            .replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + 'M'
        )
      }
      if (amount >= 10000) {
        amount /= 1000
        return (
          amount
            .toFixed(2)
            .toString()
            .replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + 'K'
        )
      }
      return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
    },

    async isTimedOut() {
      try {
        const response = await axios.post(import.meta.env.VITE_FLAPI_URL + '/timedout')
        this.user_isTimedOut = response.data.isTimedOut
      } catch (e) {
        console.log(e)
      }
    },

    setSelectedPredi(predi, key) {
      this.selectedPredi = predi
      this.selectedPrediKey = key
    },

    prediModalClose() {
      this.prediModal = false
      this.prediForm = {
        label: null,
        options: [],
        closingTime: 300,
        payoutTime: 300,
      }
    },

    rankIcon(elo) {
      if (elo < 900) {
        return ''
      } else if (elo < 1100) {
        return '/ranks_icons/bronze.svg'
      } else if (elo < 1300) {
        return '/ranks_icons/silver.svg'
      } else if (elo < 1600) {
        return '/ranks_icons/gold.svg'
      } else if (elo < 2000) {
        return '/ranks_icons/diamond.svg'
      } else if (elo >= 2000) {
        return '/ranks_icons/master.svg'
      } else {
        return ''
      }
    },

    rankDiv(elo) {
      if (!elo) {
        return ''
      }
      if (elo < 900) {
        return ''
      } else if (elo < 1100) {
        if (elo < 950) {
          return 'I'
        } else if (elo < 1000) {
          return 'II'
        } else if (elo < 1050) {
          return 'III'
        } else {
          return 'IV'
        }
      } else if (elo < 1300) {
        if (elo < 1150) {
          return 'I'
        } else if (elo < 1200) {
          return 'II'
        } else if (elo < 1250) {
          return 'III'
        } else {
          return 'IV'
        }
      } else if (elo < 1600) {
        if (elo < 1375) {
          return 'I'
        } else if (elo < 1450) {
          return 'II'
        } else if (elo < 1525) {
          return 'III'
        } else {
          return 'IV'
        }
      } else if (elo < 2000) {
        if (elo < 1700) {
          return 'I'
        } else if (elo < 1800) {
          return 'II'
        } else if (elo < 1900) {
          return 'III'
        } else {
          return 'IV'
        }
      } else if (elo >= 2000) {
        return ''
      } else {
        return ''
      }
    },

    rankColor(elo) {
      if (!elo) {
        return ''
      }
      if (elo < 900) {
        return '#ddddddaa'
      } else if (elo < 1100) {
        return '#C58A48'
      } else if (elo < 1300) {
        return '#BDC3C5'
      } else if (elo < 1600) {
        return '#FED833'
      } else if (elo < 2000) {
        return '#A6D5E9'
      } else if (elo >= 2000) {
        return '#77BB77'
      } else {
        return ''
      }
    },
  },
}
</script>

<style>
button {
  padding: 12px 24px;
  background: #6772e5;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.predi-vote-options {
  gap: 1em;
  place-content: center;
}

.error {
  color: #ff3860;
  margin-top: 12px;
}
.discord-logout {
  position: absolute;
  top: 2em;
  right: 2em;
  background: #a12829;
  color: white;
  padding: 5px 17px;
  border-radius: 10px;
  border: none;
  text-decoration: none;
  display: inline-block;
  cursor: pointer;
  z-index: 10;
  transition: 0.2s ease-in-out;
}
.discord-logout:hover {
  background: #aa3e3e;
  box-shadow: 0 0 32px 0 #a1282955;
}
.buy-btn {
  z-index: 1;
  /*border-radius: 10px !important;*/
  background:
    radial-gradient(
      ellipse farthest-corner at right bottom,
      #fedb37 0%,
      #fdb931 8%,
      #9f7928 30%,
      #8a6e2f 40%,
      transparent 200%
    ),
    radial-gradient(
      ellipse farthest-corner at left top,
      #ffffff 0%,
      #ffffac 8%,
      #d1b464 25%,
      #5d4a1f 62.5%,
      #5d4a1f 100%
    );
  transition:
    0.3s ease-in-out,
    0.6s ease-in-out box-shadow;
  box-shadow: 0 0 0 0 transparent;
}
.buy-btn:hover {
  box-shadow: 0 0 10px 0 #d1b46477;
}
.game-btn {
  z-index: 1;
  border-radius: 10px !important;
}
.user-tab {
  width: fit-content;
  margin-top: 5rem;
}
.leaderboard-container {
  width: fit-content;
  margin-top: 5rem;
}
.leaderboard {
  float: right;
  background: rgba(255, 255, 255, 0.05);
  border: solid 2px rgba(255, 255, 255, 0.2);
  border-radius: 15px;
  padding: 6px 5px;
  height: 885px;
  overflow-y: scroll;
  transition: 2s ease;
  position: relative;
}

/* Leaderboard transition animations */
.leaderboard-list-move {
  transition: 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.leaderboard-list-leave-active {
  position: absolute;
  opacity: 0 !important;
  width: 100%;
}

.inventory {
  display: flex;
  flex-direction: column;
  border-radius: 0 0 10px 10px;
  gap: 5px;
  overflow-y: scroll;
  padding: 8px 0;
}

.inventory-item {
  min-height: 40px;
  transition: 0.3s ease-in-out;
}
.skin-bg {
  position: absolute;
  width: 150%;
  height: 100%;
  top: 0;
  left: -50%;
  z-index: -1;
  border-radius: 10px;
  transition: 0.2s ease-in-out;
}
.skin-bg-no-hover {
  position: absolute;
  width: 150%;
  height: 100%;
  top: 0;
  left: -50%;
  z-index: -1;
  border-radius: 10px;
  transform: translateX(30%);
}
.skin-img {
  transition: 0.3s ease-in-out;
}

.inventory-item:hover .skin-bg {
  transform: translateX(30%);
}

@media (min-width: 1200px) {
  .inventory-item:hover {
    transition-delay: 0.3s;
    min-height: 100px;
  }
  .inventory-item:hover .skin-img {
    transition-delay: 0.3s;
    height: 85px !important;
    min-width: 200px !important;
  }
}

.bubble-text {
  position: relative;
  font-size: 0.8em;
  color: #eee;
  padding: 3px 10px;
  border-radius: 15px;
  margin-right: 10px;
}

.tabs {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 5px 5px 0 0;
  min-width: 800px;
}

.actions-container {
  height: 590px !important;
  overflow-y: scroll;
  border-radius: 0 0 15px 0;
}

.action-card {
  position: relative;
  margin-top: 10px;
  background: transparent !important;
  border-radius: 0 15px 15px 0 !important;
  border-left: 3px solid #fff !important;
}
.action-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -50%;
  width: 150%;
  height: 100%;
  background: radial-gradient(circle at -100% -300%, #5865f2, transparent 90%) !important;
  z-index: -1;
  transition: 0.2s ease-in-out;
}
.action-card:hover::before {
  transform: translateX(30%);
}

.red-action-card {
  position: relative;
  margin-top: 10px;
  background: transparent !important;
  border-radius: 0 15px 15px 0 !important;
  border-left: 3px solid #fff !important;
}
.red-action-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -50%;
  width: 150%;
  height: 100%;
  background: radial-gradient(circle at 5% 50%, #170201, #9b030222 200%) !important;
  transform: translateX(30%);
  z-index: -1;
  transition: 0.2s ease-in-out;
}
.red-action-card:hover::before {
  transform: translateX(20%);
}
.red-action-card::after {
  content: '';
  pointer-events: none;
  position: absolute;
  z-index: -2;
  top: 0;
  left: 0;
  width: 104%;
  height: 100%;
  background: url('/erynies_card_back.png') no-repeat center center;
  background-size: 100% auto;
}

.game-action-card {
  position: relative;
  margin-top: 10px;
  background: transparent !important;
  border-radius: 0 15px 15px 0 !important;
  border-left: 3px solid #fff !important;
}
.game-action-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -50%;
  width: 150%;
  height: 100%;
  background: radial-gradient(circle at -30% 0%, #5865f2, #010217aa 70%) !important;
  -webkit-backdrop-filter: blur(7px);
  backdrop-filter: blur(7px);
  transform: translateX(20%);
  z-index: -1;
  transition: 0.2s ease-in-out;
}
.game-action-card:hover::before {
  transform: translateX(30%);
}
.game-action-card::after {
  content: '';
  pointer-events: none;
  position: absolute;
  z-index: -2;
  top: 0;
  left: 0;
  width: 104%;
  height: 100%;
}
.ttt-action-card::after {
  background: url('/game_illu_ttt.png') no-repeat center center;
  background-size: 20% auto;
  transform: rotate(5deg);
}
.poker-action-card::after {
  background: url('/game_illu_poker.png') no-repeat center center;
  background-size: 80% auto;
  transform: rotate(-5deg);
}
.c4-action-card::after {
  background: url('/game_illu_c4.png') no-repeat center center;
  background-size: 20% auto;
  transform: rotate(5deg);
}
.sol-action-card::after {
  background: url('/game_illu_sol.png') no-repeat center center;
  background-size: 70% auto;
  transform: rotate(-5deg);
}
.bj-action-card::after {
  background: url('/game_illu_bj.png') no-repeat center center;
  background-size: 20% auto;
  transform: rotate(5deg);
}
.mg-action-card::after {
  background: url('/game_illu_mg.png') no-repeat center center;
  background-size: 30% auto;
  transform: rotate(-5deg);
}
.snake-action-card::after {
  background: url('/game_illu_snake.png') no-repeat center center;
  background-size: 30% auto;
  transform: rotate(5deg);
}

.disabled-card::after {
  content: 'Prochainement';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 200;
  background: radial-gradient(circle at 10% 0%, #5865f277, #0c131677 100%) !important;
  backdrop-filter: blur(10px) grayscale(1);
  border-radius: 0 15px 15px 0 !important;
  overflow: hidden;
  display: flex;
  place-content: center;
  place-items: center;
}

.modals {
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
}

.modals-blurry {
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.modal-card {
  position: relative;
  margin-top: 10px;
  background: transparent !important;
  border-radius: 15px !important;
}
.modal-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -50%;
  width: 150%;
  height: 100%;
  background: radial-gradient(circle at -100% -200%, #5865f2, #181818 100%) !important;
  z-index: -1;
}
.scroll-modal-card {
  max-height: 80vh !important;
}

.votes-containers {
  height: 390px;
  overflow-y: scroll;
  border-radius: 0 0 10px 10px;
}

.votes-card {
  position: relative;
  margin-top: 10px;
  background: transparent !important;
  border-radius: 15px !important;
}

.votes-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -50%;
  width: 150%;
  height: 100%;
  background: radial-gradient(circle at -100% -300%, #5865f2, transparent 90%) !important;
  z-index: -1;
  transition: 0.2s ease-in-out;
}
.votes-card:hover::before {
  transform: translateX(30%);
}

.predis-containers {
  overflow-y: scroll;
  border-radius: 0 0 10px 10px;
}

.coins-modal {
  max-width: 1100px;
}

.article-card {
  width: fit-content;
  background: transparent !important;
  box-shadow: 0 0 32px 0 #0c131677 !important;
}

.predi-option-card {
  width: 50%;
  border: 2px solid #dddddd22 !important;
  background: rgba(255, 255, 255, 0.1) !important;
  box-shadow: 0 0 10px 0 #dddddd22 !important;
}

/*.predi-option-card:hover {
  background: rgba(255, 255, 255, 0.2) !important;
  box-shadow: 0 0 10px 0 #dddddd55 !important;
}*/

@media (max-width: 1200px) {
  /*.tabs {
    min-width: auto;
  }*/
  .coins-modal {
    max-width: 511px;
  }
  .leaderboard {
    width: 100%;
    height: fit-content;
  }
  .leaderboard-container {
    width: 100%;
    margin-top: 0;
  }
  .user-tab {
    width: 100%;
    margin-bottom: 3rem;
  }
}

@media (max-width: 850px) {
  .modals {
    backdrop-filter: blur(50px);
    -webkit-backdrop-filter: blur(50px);
  }
  .modal-card::before {
    background: radial-gradient(circle at -100% -200%, #5865f2, #181818aa 100%) !important;
  }
  .user-tab {
    margin-top: 5rem;
  }

  .inventory {
    width: 100%;
  }
  .tabs {
    min-width: auto;
  }
  .coins-modal {
    max-width: 400px;
  }
  .article-card {
    width: 100%;
  }
  .predi-vote-options {
    flex-direction: column;
    gap: 1em;
    place-content: center;
  }
  .predi-option-card {
    width: 100%;
    max-height: 600px !important;
    border: 2px solid #dddddd22 !important;
    background: rgba(255, 255, 255, 0.1) !important;
    box-shadow: 0 0 10px 0 #dddddd22 !important;
  }
}

.new-tab::before {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, #5865f2, transparent 100%);
  z-index: -1;
}
</style>
