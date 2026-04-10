<template>
  <div>
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
        v-if="activePredis"
        class="predis-containers pt-12"
        :style="discordId === devId ? 'height: 333px;' : 'height: 388px;'"
      >
        <v-card
          v-for="[key, predi] in Object.entries(activePredis)"
          :key="key"
          class="votes-card"
          :variant="
            ((predi.endTime - Date.now()) / 1000).toFixed() < 0 || predi.closed ? 'plain' : 'tonal'
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
              <div style="display: flex; flex-direction: row-reverse; place-content: start; gap: 0">
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
                    ? ((predi.closingTime - Date.now()) / 1000).toFixed() + 's restantes pour voter'
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
                  :text="((predi.closingTime - Date.now()) / 1000).toFixed() > 0 ? 'Voter' : 'Voir'"
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
        <div v-if="Object.keys(activePredis)?.length === 0" class="pt-16 pl-5">
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
            :items="timeOptions"
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
            :items="timeOptions"
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
              <v-card-text class="font-weight-bold">{{
                selectedPredi.options[0].label
              }}</v-card-text>
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
              <v-card-text class="font-weight-bold">{{
                selectedPredi.options[1].label
              }}</v-card-text>
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
              ((selectedPredi.closingTime - Date.now()) / 1000).toFixed() > 0 &&
              !selectedPredi.closed
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
  </div>
</template>

<script>
import flapi from '@/services/flapi.js'
import { formatAmount } from '@/utils/format.js'
import { useFlopoToasts } from '@/composables/useFlopoToasts.js'
import 'animate.css'

export default {
  name: 'PredictionsTab',
  props: {
    activePredis: { type: Object, default: null },
    discordId: { type: String, default: null },
    devId: { type: String, default: null },
    avatars: { type: Object, default: () => ({}) },
    users: { type: Array, default: () => [] },
    user: { type: Object, default: null },
  },
  emits: ['refresh'],
  setup() {
    return { ...useFlopoToasts() }
  },
  data() {
    return {
      prediModal: false,
      prediVoteModal: false,
      processingVote: false,
      selectedPredi: null,
      selectedPrediKey: null,
      selectedOption: null,
      prediForm: {
        label: null,
        options: [],
        closingTime: 300,
        payoutTime: 300,
      },
      prediVoteForm: {
        amount: null,
      },
      timeOptions: [
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
      ],
    }
  },
  watch: {
    prediVoteModal(newValue) {
      this.selectedOption = !newValue ? null : this.selectedOption
      this.$emit('refresh')
    },
    activePredis() {
      if (this.selectedPrediKey && this.activePredis?.[this.selectedPrediKey]) {
        this.selectedPredi = this.activePredis[this.selectedPrediKey]
      }
    },
  },
  methods: {
    formatAmount,
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
    async startPredi() {
      this.showCommandToast('Création de la prédiction...')
      try {
        const response = await flapi.post('/start-predi', {
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
    async prediVote() {
      this.showCommandToast('Prise en compte du vote...')
      try {
        const response = await flapi.post('/vote-predi', {
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
        const response = await flapi.post('/end-predi', {
          predi: this.selectedPrediKey,
          confirm: confirm,
          winningOption: winningOption,
        })
        this.showSuccessOrWarningToast(response.data.message, false)
      } catch (e) {
        this.showErrorToast(e.response.data.message)
      }
      this.$emit('refresh')
    },
  },
}
</script>
