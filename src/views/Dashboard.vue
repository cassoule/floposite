<template>
  <div v-if="user" class="user-tab">
    <div style="margin-top: 1rem">
      <v-img
        :src="avatar"
        lazy-src="anon.png"
        width="70"
        color="transparent"
        style="border-radius: 50%; width: 70px; height: 70px"
      />
      <h1>
        Salut <span style="color: #5865f2">@{{ user?.globalName }}</span>
      </h1>
      <span
        v-if="
          active_slowmodes && Object.values(active_slowmodes).find((s) => s.userId === discordId)
        "
        class="bubble-text"
        style="background: #ff8c0077"
        >
        slowmode
      </span>
      <span v-if="user_isTimedOut" class="bubble-text" style="background: #aa3e3e77">
        timed out
      </span>
      <span class="bubble-text" style="opacity: 0" />
      <p class="d-flex mt-2" style="place-items: baseline">{{ user?.coins.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') }} <v-img src="star.svg" class="ml-2" max-width="12px" height="12px"/></p>
      <p>
        {{ user_inventory?.length }} skins
        <span style="color: rgba(255, 255, 255, 0.3)">({{ inventoryValue }}€)</span>
      </p>
      <p>
        {{ user?.warns }} warns
        <span style="color: rgba(255, 255, 255, 0.3)">({{ user?.allTimeWarns }} all time)</span>
      </p>
    </div>

    <div v-if="discordId === devId">
      <div class="mt-5 d-flex align-center" style="gap: 1rem">
        <v-text-field
          v-model="message"
          variant="outlined"
          placeholder="Envoyer un message"
          density="compact"
          rounded="lg"
          hide-details
        ></v-text-field>
        <v-btn
          text="10 coins"
          append-icon="mdi mdi-play"
          class="text-capitalize"
          color="primary"
          variant="flat"
          rounded="lg"
          :disabled="user?.coins < 10 || !message"
          @click="sendMessage"
        ></v-btn>
      </div>
      <div class="mt-5 d-flex align-center" style="gap: 1rem">
        <v-btn
          text="+1000"
          append-icon="mdi mdi-play"
          class="text-capitalize"
          color="primary"
          variant="flat"
          rounded="lg"
          @click="addCoins"
        ></v-btn>
      </div>
    </div>
    <div class="mt-5 d-flex align-center">
      <v-btn
        text="Ajouter des coins"
        append-icon=""
        class="text-none buy-btn"
        color="primary"
        variant="flat"
        rounded="lg"
        @click="coinsModal = true"
      >
        <template #append>
          <v-img src="star.svg" width="12px" height="12px"/>
        </template>
      </v-btn>
    </div>

    <v-tabs v-model="tab" variant="tonal" color="white" align-tabs="center" grow class="tabs w-100 mt-5">
      <v-tab value="predictions" icon><i class="mdi mdi-tooltip-question-outline" /></v-tab>
      <v-tab value="commandes" icon><i class="mdi mdi-slash-forward-box" /></v-tab>
      <v-tab value="skins" icon><i class="mdi mdi-pistol" /></v-tab>
      <v-tab value="votes" icon>
        <i class="mdi mdi-timer-outline" />
        <v-badge v-if="active_polls && unseenActivePoll" dot color="primary" />
      </v-tab>
    </v-tabs>

    <v-tabs-window v-model="tab" class="w-100">
      <v-tabs-window-item value="predictions">
        <div
          style="height: 390px"
          :style="discordId === devId ? 'height: 333px;' : 'height: 388px;'"
        >
          <div class="pt-16 pl-5">
            <p class="pt-16 w-100 text-center text-h4">Prédictions</p>
            <p class="pt-8 w-100 text-center">Bientôt disponible</p>
          </div>
        </div>
      </v-tabs-window-item>

      <v-tabs-window-item value="commandes">
        <div
          class="actions-container"
          :style="discordId === devId ? 'height: 333px;' : 'height: 388px;'"
        >
          <v-card class="action-card" variant="tonal">
            <v-card-title>Modif Pseudo</v-card-title>
            <v-card-subtitle>
              <p>Modifie le pseudo de quelqu'un</p>
            </v-card-subtitle>
            <v-card-text class="d-flex justify-end">
              <v-btn
                text="1K coins"
                class="text-none"
                append-icon="mdi-play"
                color="primary"
                variant="flat"
                rounded="lg"
                style="border-radius: 10px !important;"
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
                text="10K coins"
                class="text-none"
                append-icon="mdi-play"
                color="primary"
                variant="flat"
                rounded="lg"
                style="border-radius: 10px !important;"
                :disabled="user?.coins < 10000"
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
                text="10K coins"
                class="text-none"
                append-icon="mdi-play"
                color="primary"
                variant="flat"
                rounded="lg"
                style="border-radius: 10px !important;"
                :disabled="user?.coins < 10000"
                @click="slowmodeModal = true"
              />
            </v-card-text>
          </v-card>

          <v-card class="action-card disabled-card" variant="tonal" disabled>
            <v-card-title>Time-Out</v-card-title>
            <v-card-subtitle>
              <p>Time-out quelqu'un pendant 6 heures</p>
            </v-card-subtitle>
            <v-card-text class="d-flex justify-end">
              <v-btn
                text="100K coins"
                class="text-none"
                append-icon="mdi-play"
                color="primary"
                variant="flat"
                rounded="lg"
                style="border-radius: 10px !important;"
                :disabled="user?.coins < 100000"
              />
            </v-card-text>
          </v-card>
        </div>
      </v-tabs-window-item>

      <v-tabs-window-item value="skins">
        <div class="inventory" :style="discordId === devId ? 'height: 333px;' : 'height: 388px;'">
          <div
            v-for="skin in user_inventory"
            :key="skin.id"
            class="inventory-item"
            :style="`border-radius: 10px;`"
          >
            <div
              style="
                display: flex;
                place-content: space-between;
                min-width: 300px;
                width: 100%;
                padding: 0.5em 1em;
              "
            >
              <div style="display: flex; width: 70%; gap: 1em">
                <v-img
                  :src="skin.displayIcon"
                  class="skin-img"
                  height="25"
                  min-width="70"
                  max-width="70"
                />
                <span
                  style="
                    color: #ddd;
                    overflow: hidden;
                    white-space: nowrap;
                    text-overflow: ellipsis;
                  "
                  >{{ skin.displayName }}</span
                >
              </div>
              <span style="font-weight: bold">{{ skin.currentPrice.toFixed(2) }}€</span>
            </div>
            <div
              class="skin-bg"
              :style="`background: radial-gradient(circle at -50% 0%, #${skin.tierColor}, transparent 80%)`"
            ></div>
          </div>
        </div>
      </v-tabs-window-item>

      <v-tabs-window-item value="votes">
        <div
          class="votes-containers"
          :style="discordId === devId ? 'height: 333px;' : 'height: 388px;'"
        >
          <v-card
            v-for="[key, poll] in Object.entries(active_polls)"
            :key="key"
            class="votes-card"
            :variant="poll.voters.includes(discordId) ? 'plain' : 'tonal'"
          >
            <div v-if="poll.requiredMajority - poll.for > 0">
              <v-card-title
                ><span style="font-weight: bold">{{ poll.username.username }}</span> propose de
                timeout
                <span style="font-weight: bold">{{ poll.toUsername.username }}</span></v-card-title
              >
              <v-card-subtitle
                >Pendant
                <span style="font-weight: bold">{{
                  poll.time_display.replaceAll('*', '')
                }}</span></v-card-subtitle
              >
              <v-card-subtitle
                >Il manque {{ poll.requiredMajority - poll.for }} vote(s)</v-card-subtitle
              >
              <v-card-text class="d-flex align-end">
                {{ ((new Date(poll.endTime).getTime() - Date.now()) / 1000).toFixed() }}s restantes
                <v-spacer />
                <div v-if="!poll.voters.includes(discordId)">
                  <v-btn
                    text="Oui"
                    color="primary"
                    variant="flat"
                    rounded="lg"
                    class="mr-2"
                    @click="timeoutVote(key, true)"
                  />
                  <v-btn
                    text="Non"
                    color="primary"
                    variant="tonal"
                    style="border: 1px solid #5865f2"
                    rounded="lg"
                    @click="timeoutVote(key, false)"
                  />
                </div>
                <div v-else>Tu as voté !</div>
              </v-card-text>
            </div>
            <div v-else>
              <v-card-title
                ><span style="font-weight: bold">{{ poll.toUsername.username }}</span> a été
                timeout</v-card-title
              >
              <v-card-subtitle
                >Pendant
                <span style="font-weight: bold">{{
                  poll.time_display.replaceAll('*', '')
                }}</span></v-card-subtitle
              >
              <v-card-subtitle class="pb-3">{{ poll.for }} ont voté pour</v-card-subtitle>
            </div>
          </v-card>
          <div v-if="Object.keys(active_polls)?.length === 0" class="pt-16 pl-5">
            <p class="pt-16 w-100 text-center">Aucun vote en cours</p>
          </div>
        </div>
      </v-tabs-window-item>
    </v-tabs-window>
    <p v-if="tab === 'skins'" class="mt-2">Valeur totale : {{ inventoryValue }}€</p>
    <p v-else class="d-flex mt-2" style="place-items: center">{{ formatAmount(user?.coins) }} coins <v-img src="star.svg" class="ml-2" max-width="12px" height="12px"/></p>

    <button class="discord-logout" @click="logout">Déconnexion</button>
  </div>

  <div v-else-if="users" style="width: fit-content; margin-top: 5rem; margin-bottom: 3rem">
    <div>
      <v-img
        v-if="avatar"
        :src="avatar"
        lazy-src="anon.webp"
        width="70"
        style="border-radius: 50%"
      />
      <h1 class="mb-3">
        Salut <span style="color: #5865f2">{{ discordId }}</span> (⊙_⊙)？
      </h1>
      <p>Je crois qu'on ne se connait pas...</p>
    </div>

    <button class="discord-logout" @click="logout">Déconnexion</button>
  </div>

  <div v-if="users" class="leaderboard-container">
    <h2 style="display: flex; place-content: space-between">Classement</h2>
    <div class="leaderboard">
      <div
        v-for="akhy in users"
        :key="akhy.id"
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
        >
          <span style="color: #ddd">@{{ akhy?.globalName }}</span> {{ formatAmount(akhy.coins) }}
        </div>
      </div>
    </div>
  </div>
  <toast v-if="toastStore.show" :key="toastStore.toastKey" />

  <v-dialog v-model="coinsModal" class="modals" :max-width="coinsModalMaxWidth" scrollable>
    <v-card class="modal-card overflow-scroll coins-modal" variant="tonal">
      <v-card-title class="pt-4">
        Achat de coins
      </v-card-title>
      <v-card-subtitle class="pb-1">
        <p>Recharge tes coins !</p>
      </v-card-subtitle>
      <v-card-text class="d-flex px-4 py-16" style="gap: 1em; place-content: start; flex-wrap: wrap; height: fit-content">
        <v-card class="article-card" color="transparent" style="border-radius: 12px" :disabled="paymentModal">
          <v-card-item>
            <v-img src="100Kbg.png" min-height="200px" min-width="200" width="100%" contain></v-img>
          </v-card-item>
          <v-card-subtitle>
            +100 000 coins
          </v-card-subtitle>
          <v-card-actions>
            <v-btn class="text-none" color="primary" variant="flat" rounded="lg" block @click="buyCoinsForm = { price: 99, coins: 100000 }" @click.stop="paymentModal = true" :disabled="loading">
              0.99€
            </v-btn>
          </v-card-actions>
        </v-card>
        <v-card class="article-card" color="transparent" style="border-radius: 12px" :disabled="paymentModal">
          <v-card-item>
            <v-img src="1Mbg.png" min-height="200px" min-width="200" width="100%" contain></v-img>
          </v-card-item>
          <v-card-subtitle>
            +1 000 000 coins
          </v-card-subtitle>
          <v-card-actions>
            <v-btn class="text-none" color="primary" variant="flat" rounded="lg" block @click="buyCoinsForm = { price: 499, coins: 1000000 }" @click.stop="paymentModal = true" :disabled="loading">
              4.99€
            </v-btn>
          </v-card-actions>
        </v-card>
        <v-card class="article-card" color="transparent" style="border-radius: 12px" :disabled="paymentModal">
          <v-card-item>
            <v-img src="10Mbg.png" min-height="200px" min-width="200" width="100%" contain></v-img>
          </v-card-item>
          <v-card-subtitle>
            +10 000 000 coins
          </v-card-subtitle>
          <v-card-actions>
            <v-btn class="text-none" color="primary" variant="flat" rounded="lg" block @click="buyCoinsForm = { price: 2499, coins: 10000000 }" @click.stop="paymentModal = true" :disabled="loading">
              24.99€
            </v-btn>
          </v-card-actions>
        </v-card>
        <v-card class="article-card" color="transparent" style="border-radius: 12px" :disabled="paymentModal">
          <v-card-item>
            <v-img src="100Mbg.png" min-height="200px" min-width="200" width="100%" contain></v-img>
          </v-card-item>
          <v-card-subtitle>
            +100 000 000 coins
          </v-card-subtitle>
          <v-card-actions>
            <v-btn class="text-none" color="primary" variant="flat" rounded="lg" block @click="buyCoinsForm = { price: 12499, coins: 100000000 }" @click.stop="paymentModal = true" :disabled="loading">
                124.99€
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-card-text>
      <v-card-text class="pt-1 pb-4 px-5" style="color: #ddddddaa; text-align: right; overflow: hidden">
        Non remboursable
      </v-card-text>


      <v-dialog v-model="paymentModal" max-width="600" style="backdrop-filter: blur(100px); background: radial-gradient(circle at -100% 50%, #5865f2, transparent 100%)" scrollable>
        <v-card color="white" style="border-radius: 20px;">
          <v-card-title class="pt-4">Achat de {{formatAmount(buyCoinsForm.coins)}} coins ({{buyCoinsForm.price/100}}€)</v-card-title>
          <v-card-subtitle>Les coins seront crédités instantanément une fois le paiement effectué</v-card-subtitle>
          <v-card-item class="px-4 pt-6 pb-4">
            <StripePaymentForm :amount="buyCoinsForm.price" @payment-success="handleSuccess" />
          </v-card-item>
        </v-card>

      </v-dialog>
    </v-card>
  </v-dialog>

  <v-dialog v-model="nicknameModal" class="modals" max-width="800">
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
          :items="users"
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
          text="1K coins"
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

  <v-dialog v-model="spamPingModal" class="modals" max-width="800">
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
          :items="users"
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
          text="10K coins"
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

  <v-dialog v-model="slowmodeModal" class="modals" max-width="800">
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
          :items="users"
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
          text="10K coins"
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
</template>

<script>
import axios from 'axios'
import { io } from 'socket.io-client'
import Toast from '../components/Toast.vue'
import { useToastStore } from '../stores/toastStore.js'
import { computed } from 'vue'
import { loadStripe } from '@stripe/stripe-js'
import StripePaymentForm from '../components/StripePaymentForm.vue'

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
      if (!this.user_inventory) return null
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
    }
  },

  data() {
    return {
      windowWidth: window.innerWidth,

      tab: null,
      message: null,
      discordId: null,
      users: null,
      avatar: null,
      socket: null,
      user_inventory: null,
      user_isTimedOut: false,

      active_polls: null,
      active_slowmodes: null,

      coinsModal: false,
      paymentModal: false,
      nicknameModal: false,
      spamPingModal: false,
      slowmodeModal: false,

      avatars: {},
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

    //this.stripePromise = loadStripe(import.meta.env.VITE_APP_STRIPE_PUBLIC_KEY)

    this.avatar = await this.getAvatar(this.discordId)
    this.fetchAvatars()
    await this.getInventory()
    await this.getActivePolls()
    await this.getActiveSlowmodes()
    await this.isTimedOut()

    this.initSocket()
    window.addEventListener('resize', this.updateWindowWidth)
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

    initSocket() {
      // Connect to your bot's Socket.IO server
      this.socket = io(import.meta.env.VITE_FLAPI_URL, {
        withCredentials: false,
        extraHeaders: {
          'ngrok-skip-browser-warning': 'true',
        },
      })

      // Handle connection events
      this.socket.on('connect', () => {
        console.log('Connected to WebSocket server')
      })

      // Listen for data updates
      this.socket.on('data-updated', (data) => {
        console.log('Database updated:', data)
        this.getUsers() // Refresh data when updates occur
      })

      this.socket.on('new-poll', (data) => {
        console.log('New Poll:', data.action)
        this.getActivePolls()
      })

      this.socket.on('new-slowmode', (data) => {
        console.log('New Slowmode:', data.action)
        this.getActiveSlowmodes()
      })

      this.socket.on('disconnect', () => {
        console.log('Disconnected from WebSocket server')
      })
    },

    fetchAvatars() {
      this.users.forEach(async (user) => {
        this.avatars[user.id] = await this.getAvatar(user.id)
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
        console.log(fetchUrl)
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
    },

    async getAvatar(id) {
      const fetchUrl = import.meta.env.VITE_FLAPI_URL + '/user/' + id + '/avatar'
      try {
        console.log(fetchUrl)
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

    async getInventory() {
      const fetchUrl = import.meta.env.VITE_FLAPI_URL + '/user/' + this.discordId + '/inventory'
      try {
        console.log(fetchUrl)
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
        console.log(fetchUrl)
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
        console.log(fetchUrl)
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

    async sendMessage() {
      let msg = this.message
      this.message = null
      this.showSendingToast()
      try {
        const response = await axios.post(import.meta.env.VITE_FLAPI_URL + '/send-message', {
          userId: this.discordId,
          channelId: '1368908514545631262',
          message: msg,
        })
        this.showSentToast()
      } catch (e) {
        this.showErrorToast(e.response.data.error)
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
        console.log(response)
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
        console.log(response)
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
        console.log(response)
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
        console.log(response)
        this.showSuccessOrWarningToast(response.data.message, false)
      } catch (e) {
        this.showErrorToast(e.response.data.message)
      }
    },

    async addCoins() {
      try {
        const response = await axios.post(import.meta.env.VITE_FLAPI_URL + '/add-coins', {
          commandUserId: this.discordId,
        })
        console.log(response)
      } catch (e) {
        console.log(e)
      }
    },

    async buyCoins() {
      try {
        const response = await axios.post(import.meta.env.VITE_FLAPI_URL + '/buy-coins', {
          commandUserId: this.discordId,
          coins: this.buyCoinsForm.coins
        })
        console.log(response)
      } catch (e) {
        console.log(e)
      }
    },

    formatAmount(amount) {
      if (amount >= 1000000000) {
        amount /= 1000000000
        return (
          amount
            .toFixed(1)
            .toString()
            .replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + 'Md'
        )
      }
      if (amount >= 1000000) {
        amount /= 1000000
        return (
          amount
            .toFixed(1)
            .toString()
            .replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + 'M'
        )
      }
      if (amount >= 10000) {
        amount /= 1000
        return (
          amount
            .toFixed(1)
            .toString()
            .replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + 'K'
        )
      }
      return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
    },

    async isTimedOut() {
      try {
        const response = await axios.post(import.meta.env.VITE_FLAPI_URL + '/timedout', {
          userId: this.discordId,
        })
        console.log(response)
        this.user_isTimedOut = response.data.isTimedOut
      } catch (e) {
        console.log(e)
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

.error {
  color: #ff3860;
  margin-top: 12px;
}
.discord-logout {
  position: fixed;
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
  transition: 0.2s ease-in-out;
}
.discord-logout:hover {
  background: #aa3e3e;
  box-shadow: 0 0 32px 0 #a1282955;
}
.buy-btn {
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
  background: rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px 0 #5865f211;
  border-radius: 15px;
  padding: 6px 5px;
  height: 700px;
  overflow-y: scroll;
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
  position: relative;
  overflow: hidden;
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
  border-radius: 10px 10px 0 0;
  min-width: 800px;
}

.actions-container {
  height: 390px;
  overflow-y: scroll;
  border-radius: 0 0 10px 10px;
}

.action-card {
  position: relative;
  margin-top: 10px;
  background: transparent !important;
  border-radius: 15px !important;
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

.disabled-card::after {
  content: 'Bientôt disponible';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at 150% 50%, #0c1316cc, #0c131677 200%) !important;
  display: flex;
  place-content: center;
  place-items: center;
}

.modals {
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
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

.coins-modal {
  max-width: 1100px;
}

.article-card {
  width: fit-content;
  background: transparent !important;
  box-shadow: 0 0 32px 0 #0c131677 !important;
}

@media (max-width: 1200px) {
  .tabs {
    min-width: 450px;
  }
  .coins-modal {
    max-width: 511px;
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
  .leaderboard {
    width: 100%;
  }
  .leaderboard-container {
    width: 100%;
    margin-top: 0;
  }
  .user-tab {
    width: 100%;
    margin-top: 0;
    margin-bottom: 3rem;
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
}
</style>