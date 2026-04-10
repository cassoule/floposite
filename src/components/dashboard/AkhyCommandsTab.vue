<template>
  <div>
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
            :items="akhyUsers"
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
            :items="akhyUsers"
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
            :items="akhyUsers"
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
            :items="akhyUsers"
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
  </div>
</template>

<script>
import flapi from '@/services/flapi.js'
import { useFlopoToasts } from '@/composables/useFlopoToasts.js'

export default {
  name: 'AkhyCommandsTab',
  props: {
    user: { type: Object, default: null },
    users: { type: Array, default: () => [] },
    avatars: { type: Object, default: () => ({}) },
  },
  setup() {
    return { ...useFlopoToasts() }
  },
  data() {
    return {
      nicknameModal: false,
      spamPingModal: false,
      slowmodeModal: false,
      timeoutModal: false,
      nicknameForm: { id: null, nickname: null },
      spamPingForm: { id: null },
      slowmodeForm: { id: null },
      timeoutForm: { id: null },
    }
  },
  computed: {
    akhyUsers() {
      return (this.users || []).filter((u) => u.isAkhy)
    },
  },
  methods: {
    async changeNickname() {
      this.showCommandToast('Changement du pseudo...')
      try {
        const response = await flapi.post('/change-nickname', {
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
        const response = await flapi.post('/spam-ping', { userId: this.spamPingForm.id })
        this.showSuccessOrWarningToast(response.data.message, false)
      } catch (e) {
        this.showErrorToast(e.response.data.message)
      }
    },
    async slowmode() {
      this.showCommandToast('Envoi de la commande...')
      try {
        const response = await flapi.post('/slowmode', { userId: this.slowmodeForm.id })
        this.showSuccessOrWarningToast(response.data.message, false)
      } catch (e) {
        this.showErrorToast(e.response.data.message)
      }
    },
    async timeout() {
      this.showCommandToast('Envoi de la commande...')
      try {
        const response = await flapi.post('/timeout', { userId: this.timeoutForm.id })
        this.showSuccessOrWarningToast(response.data.message, false)
      } catch (e) {
        this.showErrorToast(e.response.data.message)
      }
    },
  },
}
</script>
