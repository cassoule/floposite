<template>
  <div class="patch-note-card">
    <div class="patch-note-header">
      <div class="patch-note-title-row">
        <v-icon size="22" color="primary" class="fix-aspect">mdi-file-document-outline</v-icon>
        <span class="patch-note-title">{{ note.title }}</span>

        <v-chip
          v-if="note.version"
          size="small"
          color="primary"
          variant="elevated"
          elevation="1"
          class="ml-2"
        >
          {{ note.version }}
        </v-chip>

        <v-chip
          v-if="!note.published"
          size="small"
          color="warning"
          variant="flat"
          prepend-icon="mdi-pencil-lock"
          class="ml-2 fw-bold"
        >
          Brouillon
        </v-chip>
        <v-chip
          v-else
          size="small"
          color="success"
          variant="tonal"
          prepend-icon="mdi-check-all"
          class="ml-2"
        >
          Publié
        </v-chip>
      </div>
      <div class="patch-note-meta">
        <div class="patch-note-date">
          <v-icon small class="fix-aspect">mdi-calendar-month-outline</v-icon>
          <span>{{ formatDate(note.createdAt) }}</span>
        </div>
        <span v-if="note.author" class="patch-note-author">
          <v-icon small class="fix-aspect">mdi-account-outline</v-icon>
          {{ note.author.username }}
        </span>
      </div>
    </div>

    <div class="patch-note-divider"></div>
    <div class="patch-note-content" v-html="renderMarkdown(note.content)"></div>
    <div class="patch-note-divider"></div>

    <div class="patch-note-actions">
      <v-btn
        size="small"
        variant="tonal"
        color="white"
        prepend-icon="mdi-pencil"
        rounded="lg"
        class="action-btn-modern btn-white"
        @click="$emit('edit', note)"
      >
        Modifier
      </v-btn>

      <v-btn
        size="small"
        variant="tonal"
        color="white"
        :prepend-icon="note.published ? 'mdi-eye-off' : 'mdi-eye'"
        rounded="lg"
        class="action-btn-modern btn-white"
        @click="$emit('togglePublish', note)"
      >
        {{ note.published ? 'Dépublier' : 'Publier' }}
      </v-btn>

      <v-spacer></v-spacer>

      <v-btn
        size="small"
        variant="tonal"
        color="white"
        prepend-icon="mdi-delete"
        rounded="lg"
        class="action-btn-modern btn-white"
        @click="$emit('delete', note)"
      >
        Supprimer
      </v-btn>
    </div>
  </div>
</template>

<script>
import { marked } from 'marked'

export default {
  name: 'AdminPatchNoteCard',
  props: {
    note: {
      type: Object,
      required: true,
    },
  },
  emits: ['edit', 'togglePublish', 'delete'],
  methods: {
    formatDate(dateStr) {
      if (!dateStr) return 'N/A'
      const date = new Date(dateStr)
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    },
    renderMarkdown(content) {
      if (!content) return ''
      try {
        const formattedContent = content.replace(/\\n/g, '\n')
        return marked.parse(formattedContent)
      } catch (e) {
        return content
      }
    },
  },
}
</script>

<style scoped>
.fw-bold {
  font-weight: bold !important;
}

.fix-aspect {
  aspect-ratio: 1 / 1 !important;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0 !important;
  line-height: 1 !important;
}

.patch-note-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  transition: all 0.3s ease;
}

.patch-note-card:hover {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.1);
}

.patch-note-header {
  margin-bottom: 0.75rem;
}

.patch-note-title-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.patch-note-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: white;
}

.patch-note-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 0.6rem;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.4);
}

.patch-note-date,
.patch-note-author {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.patch-note-divider {
  height: 1px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.08), transparent);
  margin-bottom: 0.5rem;
}

.patch-note-content {
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.6;
  padding: 0.75rem 0;
}

.patch-note-content :deep(h1),
.patch-note-content :deep(h2),
.patch-note-content :deep(h3) {
  color: white;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
}

.patch-note-content :deep(h1) {
  font-size: 1.5rem;
}
.patch-note-content :deep(h2) {
  font-size: 1.3rem;
}
.patch-note-content :deep(h3) {
  font-size: 1.1rem;
}

.patch-note-content :deep(p) {
  margin-bottom: 0.5rem;
}

.patch-note-content :deep(ul),
.patch-note-content :deep(ol) {
  padding-left: 1.5rem;
  margin-bottom: 0.5rem;
}

.patch-note-content :deep(li) {
  margin-bottom: 0.25rem;
}

.patch-note-content :deep(strong) {
  font-weight: 700;
  color: white;
}

.patch-note-content :deep(a) {
  color: #5865f2;
  text-decoration: underline;
}

.patch-note-content :deep(code) {
  background: rgba(255, 255, 255, 0.08);
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  font-size: 0.9em;
}

.patch-note-content :deep(pre) {
  background: rgba(0, 0, 0, 0.3);
  padding: 1rem;
  border-radius: 8px;
  overflow-x: auto;
  margin-bottom: 0.75rem;
}

.patch-note-content :deep(blockquote) {
  border-left: 3px solid #5865f2;
  padding-left: 1rem;
  margin: 0.5rem 0;
  color: rgba(255, 255, 255, 0.6);
}

.patch-note-actions {
  display: flex;
  gap: 0.75rem;
  padding-top: 0.75rem;
  flex-wrap: wrap;
  align-items: center;
}

.action-btn-modern {
  text-transform: none !important;
  letter-spacing: 0 !important;
  font-weight: 600 !important;
}

.btn-white {
  color: #ffffff !important;
  background: rgba(255, 255, 255, 0.12) !important;
}
.btn-white:hover {
  background: rgba(255, 255, 255, 0.2) !important;
}
</style>
