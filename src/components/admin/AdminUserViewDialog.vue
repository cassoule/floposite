<template>
  <v-dialog
    :model-value="modelValue"
    max-width="700"
    transition="dialog-bottom-transition"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card class="view-dialog-card rounded-xl">
      <!-- Header -->
      <v-card-title class="d-flex align-center px-7 py-6 pb-5">
        <v-icon color="#5b8ef0" class="mr-3" size="22">mdi-account-eye</v-icon>
        <span class="text-white dialog-title">Détails de l'utilisateur</span>
        <v-spacer />
        <v-btn
          icon="mdi-close"
          variant="tonal"
          size="small"
          class="close-btn"
          @click="$emit('update:modelValue', false)"
        />
      </v-card-title>

      <v-divider class="mx-7 border-opacity-10" />

      <v-card-text class="px-7 py-6" v-if="loading">
        <div class="d-flex justify-center pa-8">
          <v-progress-circular :size="40" color="primary" indeterminate />
        </div>
      </v-card-text>

      <v-card-text class="px-7 py-6" v-else-if="expandedUser">
        <!-- User Profile Banner -->
        <div class="profile-banner mb-8 d-flex align-center ga-4">
          <v-avatar size="64" class="avatar-border" rounded="lg">
            <v-img :src="expandedUser.avatarUrl || '/anon.png'" cover />
          </v-avatar>
          <div class="profile-info">
            <h3 class="user-name">@{{ expandedUser.username }}</h3>
            <p class="user-globalname">{{ expandedUser.globalName || 'Aucun nom' }}</p>
            <v-chip size="x-small" class="id-chip mt-1" variant="tonal">
              {{ expandedUser.id }}
            </v-chip>
          </div>
        </div>

        <!-- Info Grid -->
        <div class="info-grid mb-6">
          <div class="info-card">
            <span class="info-label">FlopoCoins</span>
            <span class="info-value">{{ formatCoins(expandedUser.coins || 0) }}</span>
          </div>
          <div class="info-card">
            <span class="info-label">Warns</span>
            <span class="info-value">{{ expandedUser.warns || 0 }}</span>
          </div>
          <div class="info-card">
            <span class="info-label">Rôles</span>
            <div class="d-flex flex-wrap" style="gap: 3px">
              <v-chip
                v-if="expandedUser.isAkhy === 1"
                size="x-small"
                color="primary"
                variant="tonal"
                >Akhy</v-chip
              >
              <v-chip
                v-if="expandedUser.isAdmin === 1"
                size="x-small"
                color="warning"
                variant="tonal"
                >Admin</v-chip
              >
              <v-chip v-if="expandedUser.isDev === 1" size="x-small" color="success" variant="tonal"
                >Dev</v-chip
              >
              <span
                v-if="
                  expandedUser.isAkhy !== 1 &&
                  expandedUser.isAdmin !== 1 &&
                  expandedUser.isDev !== 1
                "
                class="info-value"
                style="font-size: 0.85rem"
                >Aucun</span
              >
            </div>
          </div>
          <div class="info-card">
            <span class="info-label">Skins CS</span>
            <span class="info-value">{{ csInventory.length }}</span>
          </div>
        </div>

        <!-- CS Skins -->
        <div class="section-title mb-3">
          <v-icon size="16" color="#e17055" class="mr-2">mdi-crosshairs-gps</v-icon>
          Inventaire CS
          <v-chip size="x-small" variant="tonal" class="ml-2 count-chip">{{
            csInventory.length
          }}</v-chip>
        </div>

        <div v-if="csInventory.length === 0" class="empty-section pa-4 rounded-lg mb-6">
          <p class="text-grey">Aucun skin CS</p>
        </div>
        <div v-else class="skin-grid mb-6">
          <div v-for="skin in csInventory" :key="skin.id" class="skin-card">
            <v-img
              :src="skin.imageUrl || '/flopo.png'"
              width="48"
              height="32"
              contain
              class="skin-img"
            />
            <div class="skin-info">
              <div class="skin-name">{{ skin.displayName }}</div>
              <div class="skin-price">{{ formatCoins(skin.price) }} FC</div>
            </div>
          </div>
        </div>
      </v-card-text>

      <v-divider class="border-opacity-10" />

      <v-card-actions class="px-7 py-5 bg-footer">
        <v-spacer />
        <v-btn
          variant="tonal"
          rounded="lg"
          class="cancel-btn px-5"
          @click="$emit('update:modelValue', false)"
        >
          Fermer
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import flapi from '@/services/flapi.js'
import { formatCoins } from '@/utils/format.js'

export default {
  name: 'AdminUserViewDialog',

  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    user: {
      type: Object,
      default: null,
    },
  },

  emits: ['update:modelValue'],

  setup() {
    return { formatCoins }
  },

  data() {
    return {
      expandedUser: null,
      inventory: [],
      csInventory: [],
      loading: false,
    }
  },

  watch: {
    modelValue(val) {
      if (val && this.user) {
        this.fetchUserDetails()
      }
    },
    user() {
      if (this.modelValue && this.user) {
        this.fetchUserDetails()
      }
    },
  },

  methods: {
    async fetchUserDetails() {
      if (!this.user) return
      this.loading = true
      try {
        const [userRes, invRes] = await Promise.all([
          flapi.get(`/user/${this.user.id}`),
          flapi.get(`/user/${this.user.id}/inventory`),
        ])
        this.expandedUser = userRes.data.user
        this.inventory = invRes.data.inventory || []
        this.csInventory = invRes.data.csInventory || []
      } catch (e) {
        console.error('Error fetching user details:', e)
        this.expandedUser = null
        this.inventory = []
        this.csInventory = []
      } finally {
        this.loading = false
      }
    },
  },
}
</script>

<style scoped>
.view-dialog-card {
  background: #252845 !important;
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.07);
  box-shadow: 0 32px 64px -16px rgba(0, 0, 0, 0.6) !important;
}

.dialog-title {
  font-size: 1rem;
  font-weight: 500;
  letter-spacing: 0.01em;
}

.close-btn {
  background: rgba(255, 255, 255, 0.05) !important;
  color: rgba(255, 255, 255, 0.4) !important;
  border-radius: 8px !important;
}
.close-btn:hover {
  background: rgba(255, 255, 255, 0.09) !important;
  color: #fff !important;
}

.avatar-border {
  border: 1.5px solid rgba(91, 142, 240, 0.25) !important;
  border-radius: 14px !important;
}

.user-name {
  color: #ffffff;
  font-size: 1.05rem;
  font-weight: 600;
  line-height: 1.3;
}

.user-globalname {
  color: rgba(255, 255, 255, 0.38);
  font-size: 0.82rem;
  margin-top: 2px;
}

.id-chip {
  background: rgba(91, 142, 240, 0.12) !important;
  color: #7aaaf7 !important;
  font-size: 0.68rem !important;
  letter-spacing: 0.02em;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

@media (max-width: 650px) {
  .info-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.info-card {
  background: rgba(255, 255, 255, 0.025);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  padding: 14px 12px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  transition: background 0.2s ease;
}

.info-card:hover {
  background: rgba(255, 255, 255, 0.04);
}

.info-value {
  font-weight: 600;
  font-size: 1rem;
  color: #ffffff;
  line-height: 1.2;
}

.info-label {
  font-size: 0.68rem;
  color: rgba(255, 255, 255, 0.28);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-top: 3px;
}

.section-title {
  display: flex;
  align-items: center;
  font-size: 0.85rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
}

.count-chip {
  font-weight: 600 !important;
  font-size: 0.7rem !important;
}

.empty-section {
  background: rgba(0, 0, 0, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.04);
  text-align: center;
}

.empty-section p {
  font-size: 0.85rem;
  margin: 0;
}

.skin-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 8px;
}

.skin-card {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255, 255, 255, 0.025);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 10px;
  padding: 8px 10px;
  transition: background 0.2s ease;
}

.skin-card:hover {
  background: rgba(255, 255, 255, 0.04);
}

.skin-img {
  flex-shrink: 0;
  border-radius: 4px;
}

.skin-info {
  min-width: 0;
  flex: 1;
}

.skin-name {
  font-size: 0.78rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.85);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.skin-price {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.35);
  margin-top: 1px;
}

.bg-footer {
  background: rgba(0, 0, 0, 0.18);
}

.cancel-btn {
  color: rgba(255, 255, 255, 0.6) !important;
  background: rgba(255, 255, 255, 0.06) !important;
  font-weight: 500 !important;
  text-transform: none !important;
  letter-spacing: 0 !important;
}
.cancel-btn:hover {
  background: rgba(255, 255, 255, 0.1) !important;
  color: #fff !important;
}
</style>
