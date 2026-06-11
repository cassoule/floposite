<template>
  <v-dialog
    :model-value="modelValue"
    max-width="420"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card class="delete-dialog-card">
      <v-card-title class="d-flex align-start delete-dialog-title" style="gap: 0.75rem">
        <v-icon :color="iconColor" class="mt-1">mdi-alert-circle</v-icon>
        <span>{{ title }}</span>
      </v-card-title>

      <v-card-text class="delete-dialog-text">
        <span v-if="type === 'user'">
          Êtes-vous sûr de vouloir supprimer l'utilisateur
          <strong>"{{ target?.username }}"</strong> ?
        </span>
        <span v-else>
          Êtes-vous sûr de vouloir supprimer le patch note <strong>"{{ target?.title }}"</strong> ?
        </span>
        <br />
        <span class="irreversible-warning">Cette action est irréversible.</span>
      </v-card-text>

      <v-card-actions class="pa-4 pt-0">
        <v-spacer />
        <v-btn variant="outlined" rounded="lg" @click="$emit('update:modelValue', false)">
          Annuler
        </v-btn>
        <v-btn
          :color="btnColor"
          rounded="lg"
          :loading="loading"
          :class="type === 'user' ? 'delete-user-btn' : ''"
          @click="$emit('confirm')"
        >
          Supprimer
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: 'AdminDeleteDialog',
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    target: {
      type: Object,
      default: null,
    },
    loading: {
      type: Boolean,
      default: false,
    },
    type: {
      type: String,
      default: 'patch-note', // 'patch-note' or 'user'
    },
  },
  emits: ['update:modelValue', 'confirm'],
  computed: {
    title() {
      return this.type === 'user'
        ? "Confirmer la suppression de l'utilisateur"
        : 'Confirmer la suppression'
    },
    iconColor() {
      return this.type === 'user' ? 'warning' : 'error'
    },
    btnColor() {
      return this.type === 'user' ? 'error' : 'error'
    },
  },
}
</script>

<style scoped>
.delete-dialog-card {
  /* Couleur de fond modifiée pour un bleu nuit plus clair */
  background: #2a344f !important;
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.delete-dialog-title {
  /* Ajout de marges et autorisation du retour à la ligne */
  padding: 24px 24px 16px 24px !important;
  white-space: normal !important;
  word-break: break-word;
  line-height: 1.4;
}

.delete-dialog-text {
  /* Ajustement des marges internes du texte */
  padding: 0 24px 24px 24px !important;
  line-height: 1.6;
}

.irreversible-warning {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.85rem;
  margin-top: 0.5rem;
  display: inline-block;
}

.delete-user-btn {
  color: white !important;
  background-color: #e53935 !important;
}
</style>
