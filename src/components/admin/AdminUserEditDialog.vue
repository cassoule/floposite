<template>
  <v-dialog
    :model-value="modelValue"
    max-width="540"
    transition="dialog-bottom-transition"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card class="edit-dialog-card rounded-xl">
      <!-- Header -->
      <v-card-title class="d-flex align-center px-7 py-6 pb-5">
        <v-icon color="#5b8ef0" class="mr-3" size="22">mdi-account-edit</v-icon>
        <span class="text-white dialog-title">Éditer l'utilisateur</span>
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

      <v-card-text class="px-7 py-6">
        <!-- User Profile -->
        <div class="profile-banner mb-8 d-flex align-center ga-4">
          <v-avatar size="56" class="avatar-border" rounded="lg">
            <v-img :src="editUser?.avatarUrl || '/anon.png'" cover />
          </v-avatar>
          <div class="profile-info">
            <h3 class="user-name">@{{ editUser?.username }}</h3>
            <p class="user-globalname">{{ editUser?.globalName || 'Aucun nom' }}</p>
            <v-chip size="x-small" class="id-chip mt-1" variant="tonal">
              {{ editUser?.id }}
            </v-chip>
          </div>
        </div>

       
        <!-- Section: Paramètres modifiables -->
        <div class="section-label mb-4">
          <v-icon size="14" class="mr-2 section-icon">mdi-tune-vertical</v-icon>
          Paramètres modifiables
        </div>

        <v-row dense class="mb-6">
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="form.coins"
              label="FlopoCoins"
              type="number"
              prepend-inner-icon="mdi-database"
              variant="outlined"
              density="comfortable"
              class="modern-input"
              hide-details
              rounded="lg"
            />
          </v-col>
        </v-row>

        <!-- Permissions & Rôles -->
        <div class="roles-container pa-5 rounded-lg mb-8">
          <div class="section-label mb-4">
            <v-icon size="14" class="mr-2 section-icon">mdi-shield-key</v-icon>
            Permissions & Rôles
          </div>
          <div class="d-flex ga-6 flex-wrap align-center">
            <v-switch
              v-model="form.isAkhy"
              label="Akhy"
              color="#5b8ef0"
              inset
              hide-details
              density="compact"
            />
            <v-switch
              v-model="form.isAdmin"
              label="Admin"
              color="#f0a93b"
              inset
              hide-details
              density="compact"
            />
            <v-switch
              v-model="form.isDev"
              label="Dev"
              color="#34c97d"
              inset
              hide-details
              density="compact"
            />
          </div>
        </div>

      </v-card-text>

      <v-divider class="border-opacity-10" />

      <!-- Footer Actions -->
      <v-card-actions class="px-7 py-5 bg-footer">
        <v-spacer />
        <v-btn
          variant="tonal"
          rounded="lg"
          class="cancel-btn px-5 mr-2"
          @click="$emit('update:modelValue', false)"
        >
          Annuler
        </v-btn>
        <v-btn
          color="#5b8ef0"
          variant="flat"
          rounded="lg"
          class="px-6 save-btn"
          :loading="saving"
          @click="save"
        >
          <v-icon start size="16">mdi-content-save</v-icon>
          Enregistrer
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import flapi from '@/services/flapi.js'
import { useToastStore } from '@/stores/toastStore.js'

export default {
  name: 'AdminUserEditDialog',

  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    user: {
      type: Object,
      default: null,
    },
    error: {
      type: String,
      default: '',
    },
  },

  emits: ['update:modelValue', 'saved', 'clear-error'],

  setup() {
    const toastStore = useToastStore()
    return {
      showSuccessToast: (message) => toastStore.showSuccessToast(message),
      showErrorToast: (message) => toastStore.showErrorToast(message),
    }
  },

  data() {
    return {
      form: {
        coins: 0,
        warns: 0,
        isAkhy: false,
        isAdmin: false,
        isDev: false,
      },
      saving: false,
    }
  },

  computed: {
    editUser() {
      return this.user
    },
  },

  watch: {
    user(user) {
      if (user) {
        this.form.coins = user.coins || 0
        this.form.warns = user.warns || 0
        this.form.isAkhy = user.isAkhy === 1
        this.form.isAdmin = user.isAdmin === 1
        this.form.isDev = user.isDev === 1
      }
    },
    modelValue(val) {
      if (val && this.user) {
        this.form.coins = this.user.coins || 0
        this.form.warns = this.user.warns || 0
        this.form.isAkhy = this.user.isAkhy === 1
        this.form.isAdmin = this.user.isAdmin === 1
        this.form.isDev = this.user.isDev === 1
      }
    },
  },

  methods: {
    async save() {
      if (!this.user) return
      this.saving = true

      try {
        const response = await flapi.put(`/admin/users/${this.user.id}`, {
          coins: parseInt(this.form.coins),
          warns: parseInt(this.form.warns),
          isAkhy: this.form.isAkhy,
          isAdmin: this.form.isAdmin,
          isDev: this.form.isDev,
        })
        this.$emit('saved', response.data.user)
        this.showSuccessToast('Utilisateur mis à jour avec succès !')
      } catch (e) {
        console.error('Error saving user:', e)
        this.showErrorToast('Erreur lors de la mise à jour de l\'utilisateur')
      } finally {
        this.saving = false
      }
    },
  },
}
</script>

<style scoped>
.edit-dialog-card {
  background: #252845 !important;
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.07);
  box-shadow: 0 32px 64px -16px rgba(0, 0, 0, 0.6) !important;
}

/* ===== Header ===== */
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

/* ===== Profile ===== */
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

/* ===== Section Labels ===== */
.section-label {
  display: flex;
  align-items: center;
  color: rgba(255, 255, 255, 0.3);
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.section-icon {
  opacity: 0.5;
}

/* ===== Info Grid ===== */
.info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
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

/* ===== Input Fields ===== */
.modern-input :deep(.v-field) {
  background: rgba(255, 255, 255, 0.04) !important;
  border-color: rgba(255, 255, 255, 0.08) !important;
  transition: border-color 0.2s ease;
}
.modern-input :deep(.v-field:hover) {
  border-color: rgba(255, 255, 255, 0.13) !important;
}
.modern-input :deep(.v-field--focused) {
  border-color: rgba(91, 142, 240, 0.5) !important;
  background: rgba(91, 142, 240, 0.04) !important;
}
.modern-input :deep(.v-label) {
  color: rgba(255, 255, 255, 0.35) !important;
}
.modern-input :deep(input) {
  color: #fff !important;
}

/* ===== Roles Container ===== */
.roles-container {
  background: rgba(0, 0, 0, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

/* ===== Switch labels ===== */
:deep(.v-switch .v-label) {
  color: rgba(255, 255, 255, 0.65) !important;
  font-size: 0.87rem;
}

/* ===== Footer ===== */
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

.save-btn {
  text-transform: none !important;
  font-weight: 500 !important;
  letter-spacing: 0 !important;
}
</style>
