<template>
  <CoinsCounter v-if="userId" />
  <v-layout class="w-100 mt-16">
    <v-main class="d-flex w-100 mb-16 pb-16 mt-8" style="min-height: 100vh">
      <div class="w-100">
        <HomeBtn />

        <div
          class="text-white mb-6 d-flex flex-wrap w-100"
          style="position: relative; align-items: center; gap: 0.5em"
        >
          <div class="d-flex mr-2 align-center" style="gap: 0.5em">
            <v-icon size="28" color="white" class="fix-aspect">mdi-file-document-outline</v-icon>
            <h1 style="font-size: 1.8rem">Patch Notes</h1>
          </div>
          <v-spacer></v-spacer>
        </div>

        <div v-if="loading" class="loading-overlay">
          <v-progress-circular :size="60" :width="8" color="primary" indeterminate />
        </div>

        <div
          v-else-if="patchNotes.length === 0"
          class="w-100 d-flex flex-column align-center justify-center pa-16"
        >
          <v-icon size="64" color="grey" class="mb-4 fix-aspect">mdi-note-off-outline</v-icon>
          <h3 class="text-grey mb-2">Aucun patch note pour le moment</h3>
          <p class="text-grey-darken-1">Les dernières mises à jour apparaîtront ici.</p>
        </div>

        <div v-else class="patch-notes-container">
          <div v-for="note in patchNotes" :key="note.id" class="patch-note-card">
            <div class="patch-note-header">
              <div class="d-flex align-center flex-wrap" style="gap: 0.5rem">
                <v-icon size="22" color="primary" class="fix-aspect"
                  >mdi-file-document-outline</v-icon
                >
                <span class="patch-note-title">{{ note.title }}</span>
                <v-chip
                  v-if="note.version"
                  size="x-small"
                  color="primary"
                  variant="elevated"
                  elevation="1"
                >
                  {{ note.version }}
                </v-chip>
              </div>
              <div class="patch-note-meta">
                <div class="patch-note-date">
                  <v-icon size="16" class="meta-icon fix-aspect">mdi-calendar-month-outline</v-icon>
                  <span>{{ formatDate(note.createdAt) }}</span>
                </div>
                <span v-if="note.author" class="patch-note-author">
                  <v-icon size="16" class="meta-icon fix-aspect">mdi-account-outline</v-icon>
                  {{ note.author.username }}
                </span>
              </div>
            </div>
            <div class="patch-note-divider"></div>
            <div class="patch-note-body" v-html="renderMarkdown(note.content)"></div>
          </div>
        </div>
      </div>
    </v-main>
  </v-layout>
</template>

<script>
import { marked } from 'marked'
import flapi from '@/services/flapi.js'
import CoinsCounter from '@/components/CoinsCounter.vue'
import HomeBtn from '@/components/HomeBtn.vue'

export default {
  name: 'PatchNotes',

  components: { CoinsCounter, HomeBtn },

  data() {
    return {
      loading: true,
      patchNotes: [],
      userId: localStorage.getItem('discordId'),
    }
  },

  async mounted() {
    await this.fetchPatchNotes()
    this.loading = false
  },

  methods: {
    formatDate(dateStr) {
      if (!dateStr) return 'N/A'
      const date = new Date(dateStr)
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
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
    async fetchPatchNotes() {
      try {
        const response = await flapi.get('/patch-notes')
        this.patchNotes = response.data.patchNotes || []
      } catch (e) {
        console.error('Fetch patch notes error:', e)
        this.patchNotes = []
      }
    },
  },
}
</script>

<style scoped>
.v-icon.fix-aspect {
  aspect-ratio: 1 / 1 !important;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0 !important;
  line-height: 1 !important;
}

.loading-overlay {
  display: flex;
  justify-content: center;
  padding: 4rem 0;
}

.patch-notes-container {
  max-width: 900px;
  margin: 0 auto;
}

.patch-note-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.patch-note-card:hover {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(88, 101, 242, 0.15);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.patch-note-header {
  margin-bottom: 0.75rem;
}

.patch-note-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: white;
}

.patch-note-meta {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  margin-top: 0.5rem;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
}

.patch-note-date,
.patch-note-author {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.meta-icon {
  color: rgba(255, 255, 255, 0.5);
}

.patch-note-divider {
  height: 1px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.08), transparent);
  margin-bottom: 1rem;
}

.patch-note-body {
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.7;
  font-size: 0.95rem;
}

.patch-note-body :deep(h1),
.patch-note-body :deep(h2),
.patch-note-body :deep(h3),
.patch-note-body :deep(h4) {
  color: white;
  margin-top: 1.25rem;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.patch-note-body :deep(h1) {
  font-size: 1.5rem;
}
.patch-note-body :deep(h2) {
  font-size: 1.3rem;
}
.patch-note-body :deep(h3) {
  font-size: 1.1rem;
}
.patch-note-body :deep(h4) {
  font-size: 1rem;
}

.patch-note-body :deep(p) {
  margin-bottom: 0.5rem;
}

.patch-note-body :deep(ul),
.patch-note-body :deep(ol) {
  padding-left: 1.5rem;
  margin-bottom: 0.5rem;
}

.patch-note-body :deep(li) {
  margin-bottom: 0.25rem;
}

.patch-note-body :deep(strong) {
  font-weight: 700;
  color: white;
}

.patch-note-body :deep(a) {
  color: #5865f2;
  text-decoration: underline;
  transition: color 0.2s ease;
}

.patch-note-body :deep(a:hover) {
  color: #7986f5;
}

.patch-note-body :deep(code) {
  background: rgba(255, 255, 255, 0.08);
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  font-size: 0.9em;
  font-family: 'Courier New', monospace;
}

.patch-note-body :deep(pre) {
  background: rgba(0, 0, 0, 0.3);
  padding: 1rem;
  border-radius: 8px;
  overflow-x: auto;
  margin-bottom: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.patch-note-body :deep(pre code) {
  background: none;
  padding: 0;
  font-size: 0.9em;
}

.patch-note-body :deep(blockquote) {
  border-left: 3px solid #5865f2;
  padding: 0.5rem 0 0.5rem 1rem;
  margin: 0.5rem 0;
  color: rgba(255, 255, 255, 0.6);
  background: rgba(88, 101, 242, 0.05);
  border-radius: 0 4px 4px 0;
}

.patch-note-body :deep(img) {
  max-width: 100%;
  border-radius: 8px;
  margin: 0.5rem 0;
}

.patch-note-body :deep(hr) {
  border: none;
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
  margin: 1.5rem 0;
}

.patch-note-body :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 0.5rem 0;
}

.patch-note-body :deep(th),
.patch-note-body :deep(td) {
  padding: 0.5rem 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  text-align: left;
}

.patch-note-body :deep(th) {
  background: rgba(255, 255, 255, 0.05);
  color: white;
  font-weight: 600;
}
</style>
