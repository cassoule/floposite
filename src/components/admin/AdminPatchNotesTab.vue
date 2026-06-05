<template>
  <div class="glass-card">
    <div class="d-flex align-center flex-wrap pa-4 pa-md-6" style="gap: 1rem">
      <div class="d-flex align-center" style="gap: 0.75rem">
        <v-icon color="primary">mdi-note-edit</v-icon>
        <h2 class="section-title">Patch Notes</h2>
      </div>
      <v-spacer />
      <v-btn
        v-if="!showForm"
        color="primary"
        prepend-icon="mdi-plus"
        rounded="lg"
        class="add-btn"
        @click="$emit('openNew')"
      >
        Nouveau Patch Note
      </v-btn>
    </div>
    <v-divider class="mx-4 mx-md-6" />

    <div class="pa-4 pa-md-6">
      <v-expand-transition>
        <div v-if="showForm">
          <AdminPatchNoteForm
            :form-data="formData"
            :is-editing="isEditing"
            :loading="saving"
            :error="error"
            @save="(data) => $emit('save', data)"
            @cancel="$emit('cancelForm')"
            @clear-error="$emit('clearError')"
          />
        </div>
      </v-expand-transition>

      <!-- Empty state -->
      <div v-if="patchNotes.length === 0" class="empty-state">
        <v-icon size="64" color="grey" class="mb-4">mdi-note-off</v-icon>
        <h3 class="text-grey mb-2">Aucun patch note</h3>
        <p class="text-grey-darken-1">Publiez le premier patch note de la plateforme !</p>
      </div>

      <!-- Patch Notes List -->
      <div v-else class="patch-notes-list">
        <AdminPatchNoteCard
          v-for="note in patchNotes"
          :key="note.id"
          :note="note"
          @edit="(n) => $emit('edit', n)"
          @toggle-publish="(n) => $emit('togglePublish', n)"
          @delete="(n) => $emit('delete', n)"
        />
      </div>
    </div>
  </div>
</template>

<script>
import AdminPatchNoteForm from './AdminPatchNoteForm.vue'
import AdminPatchNoteCard from './AdminPatchNoteCard.vue'

export default {
  name: 'AdminPatchNotesTab',
  components: { AdminPatchNoteForm, AdminPatchNoteCard },
  props: {
    patchNotes: {
      type: Array,
      required: true,
    },
    showForm: {
      type: Boolean,
      default: false,
    },
    formData: {
      type: Object,
      default: () => ({ title: '', version: '', content: '' }),
    },
    isEditing: {
      type: Boolean,
      default: false,
    },
    saving: {
      type: Boolean,
      default: false,
    },
    error: {
      type: String,
      default: '',
    },
  },
  emits: ['openNew', 'save', 'cancelForm', 'clearError', 'edit', 'togglePublish', 'delete'],
}
</script>

<style scoped>
.glass-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 20px;
  backdrop-filter: blur(20px);
  overflow: hidden;
  transition: all 0.3s ease;
}

.section-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: white;
}

.add-btn {
  text-transform: none !important;
  letter-spacing: 0 !important;
  font-weight: 600 !important;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}
</style>
