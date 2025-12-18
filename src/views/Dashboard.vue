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
            ? sparklines[discordId]?.map((entry) => entry.user_new_amount)
            : [0]
        "
        style="position: absolute; left: 0; top: 0; filter: blur(3px); z-index: -1; height: 100%; width: 100%"
      />
      <v-sparkline
        v-if="elo_graphs[discordId]?.length > 0"
        smooth
        auto-draw
        color="secondary"
        line-width="0.5"
        :model-value="elo_graphs[discordId]?.length > 0 ? elo_graphs[discordId] : [0]"
        style="position: absolute; left: 0; top: 0; filter: blur(3px); z-index: -1; height: 100%; width: 100%"
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
        Salut <span style="color: #5865f2">@{{ user?.globalName || anonUsername }}</span>
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
      <span class="bubble-text" style="opacity: 0" />
      <p class="d-flex mt-2" style="place-items: baseline">
        {{ user?.coins.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') }}
        <v-img src="star.svg" class="ml-2" max-width="12px" height="12px" />
      </p>
      <p v-if="user?.isAkhy">
        {{ user?.warns }} warns
        <span style="color: rgba(255, 255, 255, 0.3)">{{ user?.allTimeWarns }} all time</span>
      </p>

      <p class="mt-3">
        {{ elos[discordId] }} FlopoRank
        <span v-if="elo_graphs[discordId]" style="color: rgba(255, 255, 255, 0.3)">{{
          elos[discordId] < Math.max(...elo_graphs[discordId], 0)
            ? Math.max(...elo_graphs[discordId], 0) + ' PB'
            : 'PB'
        }}</span>
      </p>
    </div>

    <div
      class="mt-5 d-flex align-center"
      style="gap: 0.5rem; position: relative; place-content: space-between"
    >
      <div
        class="d-flex py-2"
        style="
          gap: 1rem;
          overflow-y: scroll;
          overflow-x: visible;
          padding-top: 0.6em;
          padding-right: 1em;
        "
      >
        <v-btn
          class="text-capitalize"
          text="FlopoMarket"
          append-icon="mdi-cart"
          color="primary"
          variant="flat"
          rounded="lg"
          @click="$router.push('/market')"
        />
        <v-btn
          class="text-capitalize"
          text="Caisses"
          color="primary"
          variant="flat"
          rounded="lg"
          @click="$router.push('/cases')"
        >
          <template #append>
            <v-icon class="mdi mdi-treasure-chest-outline mt-1"></v-icon>
          </template>
        </v-btn>
<!--        <v-btn
          text="Acheter"
          append-icon=""
          class="text-none buy-btn"
          color="white"
          variant="tonal"
          rounded="lg"
          @click="coinsModal = true"
        >
          <template #append>
            <v-img src="star.svg" width="12px" height="12px" />
          </template>
        </v-btn>-->
        <v-btn
          v-if="!user.dailyQueried"
          color="primary"
          variant="tonal"
          rounded="lg"
          style="border: 1px solid #5865f2"
          :key="Date.now() + '-daily-reward'"
          @click="handleDailyQuery"
        >
          <v-icon
            class="animate__animated animate__heartBeat animate__infinite animate__slow mdi mdi-gift"
            size="20"
            color="white"
          ></v-icon>
        </v-btn>
      </div>
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
      <v-tab v-if="user?.isAkhy" value="commandes" icon><i class="mdi mdi-slash-forward-box" /></v-tab>
      <v-tab v-if="user?.isAkhy" value="predictions" icon><i class="mdi mdi-tooltip-question-outline" /></v-tab>
    </v-tabs>

    <v-tabs-window v-model="tab" class="w-100">
      <v-tabs-window-item value="games">
        <div
          class="actions-container"
        >
          <v-card class="game-action-card ttt-action-card bg-black" variant="tonal">
            <v-card-title>
              Tic Tac Toe
              <v-chip size="small" style="float: right">1v1</v-chip>
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

          <v-card class="game-action-card poker-action-card bg-black" variant="tonal">
            <v-card-title>
              Flopoker
              <v-chip size="small" style="float: right">Multi</v-chip>
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

          <v-card class="game-action-card c4-action-card bg-black" variant="tonal">
            <v-card-title>
              Puissance 4
              <v-chip size="small" style="float: right">1v1</v-chip>
            </v-card-title>
            <v-card-subtitle style="text-wrap: wrap">
              <p>Joue une partie de puissance 4 contre un autre joueur, mais attention à ton FlopoRank.</p>
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

          <v-card class="game-action-card sol-action-card bg-black" variant="tonal">
            <v-card-title>
              Solitaire
              <v-chip size="small" style="float: right">Solo</v-chip>
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

          <v-card class="game-action-card bj-action-card bg-black" variant="tonal">
            <v-card-title>
              Blackjack
              <v-chip size="small" style="float: right">Multi</v-chip>
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

          <v-card class="red-action-card bg-black disabled-card" variant="flat">
            <v-card-title>Erynies</v-card-title>
            <v-card-subtitle style="text-wrap: wrap">
              <p>Joue une partie de ce loup-garou un peu particulier, à partir de 4 joueurs.</p>
            </v-card-subtitle>
            <v-card-text class="d-flex justify-end">
              <v-btn
                text="Jouer"
                class="text-none"
                append-icon="mdi-fire-circle"
                color="#520701"
                variant="flat"
                rounded="lg"
                style="border-radius: 10px !important"
                @click="$router.push('/erynies')"
              />
            </v-card-text>
          </v-card>

<!--
          <v-card class="action-card disabled-card" variant="tonal" disabled>
            <v-card-title>?</v-card-title>&lt;!&ndash;Chess&ndash;&gt;
            <v-card-subtitle style="text-wrap: wrap">
&lt;!&ndash;              <p>Joue une partie d'échecs contre un autre joueur, mais attention à ton FlopoRank.</p>&ndash;&gt;
            </v-card-subtitle>
            <v-card-text class="d-flex justify-end">
              <v-btn
                text="Jouer"
                class="text-none"
                append-icon="mdi-chess-king"
                color="primary"
                variant="flat"
                rounded="lg"
                style="border-radius: 10px !important"
              />
            </v-card-text>
          </v-card>-->
        </div>
      </v-tabs-window-item>

      <v-tabs-window-item v-if="user?.isAkhy" value="commandes">
        <div
          class="actions-container"
        >
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
                  vote(s) - Prédi de {{ users.find((u) => u.id === predi.creatorId).globalName }}
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

    <p v-if="tab === 'skins'" class="d-flex mt-2" style="place-items: center">Valeur totale : {{ formatAmount(inventoryValue?.toFixed(0)) }} <v-img src="star.svg" class="ml-2" min-width="12px" max-width="12px" height="12px" /></p>
    <p v-else class="d-flex mt-2" style="place-items: center">
      {{ formatAmount(user?.coins) }} Flopos
      <v-img src="star.svg" class="ml-2" max-width="12px" height="12px" />
    </p>

    <button class="discord-logout" @click="logout">Déconnexion</button>
  </div>

  <div v-else class="user-tab">
    <v-skeleton-loader class="mt-2 mb-2" type="avatar" color="transparent" style="min-width: 800px"></v-skeleton-loader>
    <v-skeleton-loader class="mb-6" type="heading" color="transparent" style="max-width: 300px"></v-skeleton-loader>
    <v-skeleton-loader class="" type="text@3" color="transparent" style="max-width: 300px"></v-skeleton-loader>
    <v-skeleton-loader class="mb-10" type="text" color="transparent" style="max-width: 300px"></v-skeleton-loader>
    <v-skeleton-loader class="px-0" type="heading" color="transparent" style="max-width: 800px"></v-skeleton-loader>
    <v-skeleton-loader type="image@3" color="transparent" style="border-radius: 20px; overflow: hidden"></v-skeleton-loader>
  </div>

  <div v-if="users" class="leaderboard-container">
    <h2 style="display: flex; place-content: space-between">
      Classement
      <span
        class="text-capitalize text-secondary cursor-pointer rounded-lg"
        style="user-select: none"
        @click="leaderboardSwitch"
        >
        {{ leaderboardType }}
      </span>
    </h2>
    <div class="leaderboard">
      <div
        v-for="akhy in leaderboardUsers"
        :key="akhy.id"
        class="animate__animated animate__fadeIn"
        style="border-radius: 10px"
        :style="
          akhy.id === discordId
            ? 'background: radial-gradient(circle at -100% -300%,#5865f2,transparent 100%)'
            : ''
        "
      >
        <div
          style="
            display: flex;
            place-content: space-between;
            min-width: 300px;
            width: 100%;
            padding: 0.5em 1em;
          "
          v-if="akhy"
        >
          <span style="color: #ddd; display: flex; place-items: center; gap: 0.7rem">
            <v-img
              :src="akhy.avatarUrl"
              color="transparent"
              style="border-radius: 50%; width: 20px; height: 20px"
            />
            @{{ akhy?.globalName }}&nbsp;
            <i v-if="akhy?.isAkhy" class="mdi mdi-check-decagram-outline" title="Akhy certifié"></i>
            <i v-if="akhy.id === devId" class="mdi mdi-crown-outline" title="FlopoDev"></i>
          </span>
          <div v-if="leaderboardType === 'coins'" style="display: flex; place-items: center;">
            {{ leaderboardType === 'coins' ? formatAmount(akhy.coins) : akhy.elo }}
          </div>
          <div v-else style="display: flex; place-items: center;">
            <v-img :src="rankIcon(akhy.elo)" width="20" height="20">
              <div :style="`position: absolute; display: flex; width: 100%; height: 100%; place-items: center; place-content: center; font-size: .8em; color: #222`">
                <p style="font-weight: 400;">{{rankDiv(akhy?.elo)}}</p>
              </div>
            </v-img>
          </div>

          <v-menu activator="parent" location="end" open-on-hover open-on-click transition="scale-transition">
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
                  {{ akhy?.globalName }}
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
                      ? sparklines[akhy.id]?.map((entry) => entry.user_new_amount)
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
                  :model-value="elo_graphs[akhy.id]?.length > 1 ? elo_graphs[akhy.id] : [0,0]"
                  style="position: absolute; left: 0; top: 0"
                  title="Evolution de l'elo"
                />
              </v-list-item>
              <v-list-item>
                <v-list-item-subtitle> {{ elos[akhy.id] ?? 0 }} FlopoRank </v-list-item-subtitle>
              </v-list-item>
              <v-list-item class="pb-1 px-3">
                <v-btn class="text-none" color="primary" block rounded density="comfortable" @click="$router.push('/akhy/' + akhy.id)">Voir plus</v-btn>
              </v-list-item>
            </v-list>
          </v-menu>
        </div>
      </div>
    </div>
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
      <v-skeleton-loader v-for="n in 19" type="text" color="transparent" style="min-width: 300px"></v-skeleton-loader>
    </div>
  </div>

  <toast v-if="toastStore.show" :key="toastStore.toastKey" />


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
        <h1 style="letter-spacing: .03em">Salut @{{anonUsername}} 👋</h1>
        <v-img src="public/flopobot.webp" style="position: absolute; right: 0; top: 1em" width="150"></v-img>
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
          @click="logout"
          :disabled="loading"
        >
          Quitter
        </v-btn>
        <v-btn
          class="text-none mt-4 px-4"
          density="default"
          color="primary"
          variant="flat"
          rounded="lg"
          @click="handleRegister"
          @click.stop="isRegistered = false"
          :disabled="loading"
        >
          +5000 FlopoCoins
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog
    v-model="coinsModal"
    class="modals"
    :max-width="coinsModalMaxWidth"
    scroll-strategy="reposition"
    scrollable
  >
    <v-card class="modal-card overflow-scroll coins-modal" variant="tonal">
      <v-card-title class="pt-4"> Achat de FlopoCoins </v-card-title>
      <v-card-subtitle class="pb-1">
        <p>Recharge tes FlopoCoins !</p>
      </v-card-subtitle>
      <v-card-text
        class="d-flex px-4 py-16"
        style="gap: 1em; place-content: start; flex-wrap: wrap; height: fit-content"
      >
        <v-card
          class="article-card"
          color="transparent"
          style="border-radius: 12px"
          :disabled="paymentModal"
        >
          <v-card-item>
            <v-img src="100Kbg.png" min-height="200px" min-width="200" width="100%" contain></v-img>
          </v-card-item>
          <v-card-subtitle> +100 000 FlopoCoins </v-card-subtitle>
          <v-card-actions>
            <v-btn
              class="text-none"
              color="primary"
              variant="flat"
              rounded="lg"
              block
              @click="buyCoinsForm = { price: 99, coins: 100000 }"
              @click.stop="paymentModal = true"
              :disabled="loading"
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
            <v-img src="1Mbg.png" min-height="200px" min-width="200" width="100%" contain></v-img>
          </v-card-item>
          <v-card-subtitle> +1 000 000 FlopoCoins </v-card-subtitle>
          <v-card-actions>
            <v-btn
              class="text-none"
              color="primary"
              variant="flat"
              rounded="lg"
              block
              @click="buyCoinsForm = { price: 499, coins: 1000000 }"
              @click.stop="paymentModal = true"
              :disabled="loading"
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
            <v-img src="10Mbg.png" min-height="200px" min-width="200" width="100%" contain></v-img>
          </v-card-item>
          <v-card-subtitle> +10 000 000 FlopoCoins </v-card-subtitle>
          <v-card-actions>
            <v-btn
              class="text-none"
              color="primary"
              variant="flat"
              rounded="lg"
              block
              @click="buyCoinsForm = { price: 2499, coins: 10000000 }"
              @click.stop="paymentModal = true"
              :disabled="loading"
            >
              24.99€
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
            <v-img src="100Mbg.png" min-height="200px" min-width="200" width="100%" contain></v-img>
          </v-card-item>
          <v-card-subtitle> +100 000 000 FlopoCoins </v-card-subtitle>
          <v-card-actions>
            <v-btn
              class="text-none"
              color="primary"
              variant="flat"
              rounded="lg"
              block
              @click="buyCoinsForm = { price: 12499, coins: 100000000 }"
              @click.stop="paymentModal = true"
              :disabled="loading"
            >
              124.99€
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-card-text>
      <v-card-text
        class="pt-1 pb-4 px-5"
        style="color: #ddddddaa; text-align: right; overflow: hidden"
      >
        Non remboursable
      </v-card-text>

      <v-dialog
        v-model="paymentModal"
        max-width="600"
        style="
          backdrop-filter: blur(100px);
          background: radial-gradient(circle at -100% 50%, #5865f2, transparent 100%);
        "
        scrollable
      >
        <v-card color="white" style="border-radius: 20px">
          <v-card-title class="pt-4"
            >Achat de {{ formatAmount(buyCoinsForm.coins) }} FlopoCoins ({{
              buyCoinsForm.price / 100
            }}€)</v-card-title
          >
          <v-card-subtitle
            >Les FlopoCoins seront crédités instantanément une fois le paiement
            effectué</v-card-subtitle
          >
          <v-card-item class="px-4 pt-6 pb-4">
            <StripePaymentForm :amount="buyCoinsForm.price" @payment-success="handleSuccess" />
          </v-card-item>
        </v-card>
      </v-dialog>
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
          :items="users.filter(u => u.isAkhy)"
          item-value="id"
          item-title="globalName"
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
                  <p>{{ item.raw.globalName }}</p>
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
          maxLength="20"
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
          :items="users.filter(u => u.isAkhy)"
          item-value="id"
          item-title="globalName"
          variant="outlined"
          class="text-white w-50"
          rounded="lg"
          density="comfortable"
        >
          <template #item="{ props, item }" style="background: transparent !important">
            <v-list-item v-bind="props" rounded="lg" color="primary">
              <template #title>
                <div style="display: flex; place-items: center; place-content: start; gap: 1em">
                  <v-img
                    :src="avatars[item.raw.id]"
                    color="transparent"
                    style="border-radius: 50%; max-width: 40px; height: 40px"
                  />
                  <p>{{ item.raw.globalName }}</p>
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
          :items="users.filter(u => u.isAkhy)"
          item-value="id"
          item-title="globalName"
          variant="outlined"
          class="text-white w-50"
          rounded="lg"
          density="comfortable"
          hint="Tu peux retirer ton slowmode en te mettant toi-même"
          persistent-hint
        >
          <template #item="{ props, item }" style="background: transparent !important">
            <v-list-item v-bind="props" rounded="lg" color="primary">
              <template #title>
                <div style="display: flex; place-items: center; place-content: start; gap: 1em">
                  <v-img
                    :src="avatars[item.raw.id]"
                    color="transparent"
                    style="border-radius: 50%; max-width: 40px; height: 40px"
                  />
                  <p>{{ item.raw.globalName }}</p>
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
          :items="users.filter(u => u.isAkhy)"
          item-value="id"
          item-title="globalName"
          variant="outlined"
          class="text-white w-50"
          rounded="lg"
          density="comfortable"
          hint="Tu peux retirer ton time-out en te mettant toi-même"
          persistent-hint
        >
          <template #item="{ props, item }" style="background: transparent !important">
            <v-list-item v-bind="props" rounded="lg" color="primary">
              <template #title>
                <div style="display: flex; place-items: center; place-content: start; gap: 1em">
                  <v-img
                    :src="avatars[item.raw.id]"
                    color="transparent"
                    style="border-radius: 50%; max-width: 40px; height: 40px"
                  />
                  <p>{{ item.raw.globalName }}</p>
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
          maxLength="64"
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
          maxLength="32"
          clearable
          variant="outlined"
          class="text-white w-50"
          rounded="lg"
          density="comfortable"
        />
        <v-text-field
          v-model="prediForm.options[1]"
          label="Option 2"
          maxLength="32"
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
    <v-card v-if="selectedPredi" class="modal-card" variant="tonal" :key="Date.now()">
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
import axios from 'axios'
import { io } from 'socket.io-client'
import Toast from '../components/Toast.vue'
import { useToastStore } from '../stores/toastStore.js'
import { computed, watch } from 'vue'
import { loadStripe } from '@stripe/stripe-js'
import StripePaymentForm from '../components/StripePaymentForm.vue'
import 'animate.css'

export default {
  components: {
    StripePaymentForm,
    Toast,
  },

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
    }
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

    this.isRegistered = !this.users?.find(u => u.id === this.discordId)

    this.initSocket()
    window.addEventListener('resize', this.updateWindowWidth)
  },

  watch: {
    prediVoteModal(newValue) {
      this.selectedOption = !newValue ? null : this.selectedOption
      this.getActivePredis()
    },
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

    initSocket() {
      // Connect to your bot's Socket.IO server
      this.socket = io(import.meta.env.VITE_FLAPI_URL.replace('/api', ''), {
        withCredentials: false,
        extraHeaders: {
          'ngrok-skip-browser-warning': 'true',
        },
      })

      this.socket.emit('user-connected', this.discordId)

      // Handle connection events
      this.socket.on('connect', () => {
        console.log('Connected to WebSocket server')
      })

      // Listen for data updates
      this.socket.on('data-updated', (data) => {
        console.log('Database updated:', data)
        this.getUsers() // Refresh data when updates occur
        this.fetchSparklines()
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
        if (data.userId === this.discordId) this.showSuccessOrWarningToast('+500 FlopoCoins, récompense journalière récupérée', false)
        await this.getUsers()
      })
    },

    async handleRegister() {
      const fetchUrl = import.meta.env.VITE_FLAPI_URL + '/register-user'
      try {
        const response = await axios.post(fetchUrl, {
          discordUserId: this.discordId,
        })
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
        return response.data?.user?.globalName
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
        return response.data.elo_graph
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
          commandUserId: this.discordId,
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
          commandUserId: this.discordId,
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
          commandUserId: this.discordId,
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
          commandUserId: this.discordId,
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
          commandUserId: this.discordId,
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
          commandUserId: this.discordId,
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
          commandUserId: this.discordId,
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
          commandUserId: this.discordId,
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
        const response = await axios.post(import.meta.env.VITE_FLAPI_URL + '/add-coins', {
          commandUserId: this.discordId,
        })
      } catch (e) {
        console.log(e)
      }
    },

    async buyCoins() {
      try {
        const response = await axios.post(import.meta.env.VITE_FLAPI_URL + '/buy-coins', {
          commandUserId: this.discordId,
          coins: this.buyCoinsForm.coins,
        })
      } catch (e) {
        console.log(e)
      }
    },

    async handleDailyQuery() {
      try {
        const response = await axios.get(
          import.meta.env.VITE_FLAPI_URL + '/user/' + this.discordId + '/daily',
        )
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
        const id = this.discordId
        const response = await axios.post(import.meta.env.VITE_FLAPI_URL + '/timedout', {
          userId: id,
        })
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
        return '';
      } else if (elo < 1100) {
        return '/ranks_icons/bronze.svg';
      } else if (elo < 1300) {
        return '/ranks_icons/silver.svg';
      } else if (elo < 1600) {
        return '/ranks_icons/gold.svg';
      } else if (elo < 2000) {
        return '/ranks_icons/diamond.svg';
      } else if (elo >= 2000) {
        return '/ranks_icons/master.svg';
      } else {
        return '';
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

  beforeUnmount() {
    // Clean up socket connection when component is destroyed
    if (this.socket) {
      this.socket.disconnect()
    }
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
  padding: 7px 17px;
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
  border-radius: 10px !important;
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
  height: 805px;
  overflow-y: scroll;
  transition: 2s ease;
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
  height: 438px !important;
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

.red-action-card{
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
  background: radial-gradient(circle at 5% 50%, #170201, #9B030222 200%) !important;
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
  background: radial-gradient(circle at -30% 0%, #5865f2, #010217AA 70%) !important;
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
</style>
