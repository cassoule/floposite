<template>
  <div class="patch-note-form mb-6">
    <div class="form-header">
      <v-icon color="primary">mdi-file-document-edit</v-icon>
      <span class="font-weight-medium">{{ isEditing ? 'Modifier' : 'Rédiger' }} un patch note</span>
    </div>

    <v-text-field
      v-model="form.title"
      label="Titre du patch note"
      variant="outlined"
      density="compact"
      hide-details
      class="mb-3"
      placeholder="Ex: Mise à jour majeure v2.0"
      rounded="lg"
    />

    <v-text-field
      v-model="form.version"
      label="Version (optionnelle)"
      variant="outlined"
      density="compact"
      hide-details
      class="mb-3"
      placeholder="Ex: v2.0.1"
      rounded="lg"
    />

    <v-textarea
      v-model="form.content"
      label="Contenu (Markdown supporté)"
      variant="outlined"
      hide-details
      class="mb-3"
      placeholder="Écrivez votre patch note en Markdown ici...

Exemple:
# Titre
## Sous-titre
- **gras**, *italique*
- Liste d'éléments"
      rows="10"
      rounded="lg"
    />

    <div class="text-caption text-grey mb-4 d-flex align-center" style="gap: 0.5rem">
      <v-icon small>mdi-information-outline</v-icon>
      <span>Markdown supporté : **gras**, *italique*, - listes, # Titres, etc.</span>
    </div>

    <v-alert
      v-if="error"
      type="error"
      variant="tonal"
      density="compact"
      closable
      class="mb-3"
      @click:close="$emit('clearError')"
    >
      {{ error }}
    </v-alert>

    <div class="d-flex justify-end" style="gap: 0.75rem">
      <v-btn variant="outlined" rounded="lg" @click="$emit('cancel')"> Annuler </v-btn>
      <v-btn
        color="success"
        rounded="lg"
        prepend-icon="mdi-send"
        :loading="loading"
        :disabled="!form.title || !form.content"
        @click="$emit('save', { ...form })"
      >
        {{ isEditing ? 'Mettre à jour' : 'Publier' }}
      </v-btn>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AdminPatchNoteForm',
  props: {
    formData: {
      type: Object,
      default: () => ({ title: '', version: '', content: '' }),
    },
    isEditing: {
      type: Boolean,
      default: false,
    },
    loading: {
      type: Boolean,
      default: false,
    },
    error: {
      type: String,
      default: '',
    },
  },
  emits: ['save', 'cancel', 'clearError'],
  data() {
    return {
      form: { ...this.formData },
    }
  },
  watch: {
    formData: {
      handler(val) {
        this.form = { ...val }
      },
      deep: true,
    },
  },
}
</script>

<style scoped>
.patch-note-form {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 1.5rem;
}

.form-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
  color: white;
  font-size: 0.95rem;
}
</style>
