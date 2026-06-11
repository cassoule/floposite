<template>
  <v-layout class="w-100">
    <v-main class="w-100" style="position: relative; min-height: 100vh">
      <HomeBtn />

      <template v-if="!loading">
        <div class="w-100 admin-content">
          <!-- Hero Header -->
          <AdminHeroHeader />

          <!-- Stats Cards -->
          <div class="mx-4 mx-md-8">
            <AdminStatsRow :users-count="users.length" :patch-notes-count="patchNotes.length" />
          </div>

          <!-- Tabs -->
          <div class="tabs-container mx-4 mx-md-8 mt-6">
            <v-tabs v-model="tab" color="primary" grow class="modern-tabs">
              <v-tab value="users" class="modern-tab">
                <div class="d-flex align-center justify-center w-100 h-100" style="gap: 6px">
                  <v-icon>mdi-account-group</v-icon>
                  <span>Utilisateurs</span>
                  <v-chip size="x-small" color="primary" class="tab-count ma-0">{{
                    users.length
                  }}</v-chip>
                </div>
              </v-tab>

              <v-tab value="notes" class="modern-tab">
                <div class="d-flex align-center justify-center w-100 h-100" style="gap: 6px">
                  <v-icon>mdi-note-text-outline</v-icon>
                  <span>Patch Notes</span>
                  <v-chip
                    v-if="patchNotes.length"
                    size="x-small"
                    color="primary"
                    class="tab-count ma-0"
                    >{{ patchNotes.length }}</v-chip
                  >
                </div>
              </v-tab>

              <v-tab value="stats" class="modern-tab">
                <div class="d-flex align-center justify-center w-100 h-100" style="gap: 6px">
                  <v-icon>mdi-chart-box-outline</v-icon>
                  <span>Statistiques</span>
                </div>
              </v-tab>
            </v-tabs>
          </div>

          <!-- Tab Content -->
          <div class="content-area mx-4 mx-md-8 mb-8">
            <v-window v-model="tab" class="tab-window">
              <!-- Users Tab -->
              <v-window-item value="users">
                <AdminUsersTab
                  :users="users"
                  @user-selected="selectedUser = $event"
                  @view-user="openViewUser"
                  @edit-user="openEditUser"
                  @delete-user="confirmDeleteUser"
                />
              </v-window-item>

              <!-- Patch Notes Tab -->
              <v-window-item value="notes">
                <AdminPatchNotesTab
                  :patch-notes="patchNotes"
                  :show-form="showPatchNoteForm"
                  :form-data="patchNoteForm"
                  :is-editing="!!editingPatchNote"
                  :saving="savingPatchNote"
                  :error="patchNoteError"
                  @open-new="openNewPatchNote"
                  @save="savePatchNote"
                  @cancel-form="closePatchNoteForm"
                  @clear-error="patchNoteError = ''"
                  @edit="editPatchNote"
                  @toggle-publish="togglePublish"
                  @delete="confirmDeletePatchNote"
                />
              </v-window-item>

              <!-- Stats Tab -->
              <v-window-item value="stats">
                <AdminStatsTab :users-count="users.length" />
              </v-window-item>
            </v-window>
          </div>
        </div>

        <!-- Delete Confirmation Dialog -->
        <AdminDeleteDialog
          v-model="deleteDialog"
          :target="deleteTarget"
          :type="deleteType"
          :loading="deleting"
          @confirm="handleDelete"
        />

        <!-- User Edit Dialog -->
        <AdminUserEditDialog v-model="editDialog" :user="editingUser" @saved="handleUserSaved" />

        <!-- User View Dialog -->
        <AdminUserViewDialog v-model="viewDialog" :user="viewingUser" />
      </template>

      <!-- Loading State -->
      <template v-else>
        <div class="w-100 d-flex justify-center pa-16">
          <div class="loading-container">
            <v-progress-circular :size="60" :width="8" color="primary" indeterminate />
            <p class="mt-4 text-grey">Chargement du panneau d'administration...</p>
          </div>
        </div>
      </template>
    </v-main>
  </v-layout>
</template>

<script>
import flapi from '@/services/flapi.js'

import HomeBtn from '@/components/HomeBtn.vue'
import AdminHeroHeader from '@/components/admin/AdminHeroHeader.vue'
import AdminStatsRow from '@/components/admin/AdminStatsRow.vue'
import AdminUsersTab from '@/components/admin/AdminUsersTab.vue'
import AdminPatchNotesTab from '@/components/admin/AdminPatchNotesTab.vue'
import AdminStatsTab from '@/components/admin/AdminStatsTab.vue'
import AdminDeleteDialog from '@/components/admin/AdminDeleteDialog.vue'
import AdminUserEditDialog from '@/components/admin/AdminUserEditDialog.vue'
import AdminUserViewDialog from '@/components/admin/AdminUserViewDialog.vue'

export default {
  name: 'AdminDashboard',

  components: {
    HomeBtn,
    AdminHeroHeader,
    AdminStatsRow,
    AdminUsersTab,
    AdminPatchNotesTab,
    AdminStatsTab,
    AdminDeleteDialog,
    AdminUserEditDialog,
    AdminUserViewDialog,
  },

  data() {
    return {
      loading: true,
      tab: 'users',
      users: [],
      isAdmin: false,
      selectedUser: null,

      // Edit User
      editDialog: false,
      editingUser: null,

      // View User
      viewDialog: false,
      viewingUser: null,

      // Patch Notes
      showPatchNoteForm: false,
      editingPatchNote: null,
      savingPatchNote: false,
      patchNoteError: '',
      patchNoteForm: {
        title: '',
        version: '',
        content: '',
      },
      patchNotes: [],
      deleteDialog: false,
      deleteTarget: null,
      deleteType: 'patch-note',
      deleting: false,
    }
  },

  computed: {},

  async mounted() {
    await this.checkAdmin()
    if (!this.isAdmin) {
      this.$router.push('/dashboard')
      return
    }
    await this.fetchUsers()
    await this.fetchPatchNotes()
    this.loading = false
  },

  methods: {
    async checkAdmin() {
      try {
        const response = await flapi.get('/admin/check')
        this.isAdmin = response.data.isAdmin
      } catch (e) {
        console.error('Admin check error:', e)
        this.isAdmin = false
      }
    },

    async fetchUsers() {
      try {
        const response = await flapi.get('/admin/users')
        this.users = response.data.users
      } catch (e) {
        console.error('Fetch users error:', e)
      }
    },

    async fetchPatchNotes() {
      try {
        const response = await flapi.get('/admin/patch-notes')
        this.patchNotes = response.data.patchNotes || []
      } catch (e) {
        console.error('Fetch patch notes error:', e)
        this.patchNotes = []
      }
    },

    openViewUser(user) {
      this.viewingUser = user
      this.viewDialog = true
    },

    openEditUser(user) {
      this.editingUser = user
      this.editDialog = true
    },

    handleUserSaved(updatedUser) {
      const idx = this.users.findIndex((u) => u.id === updatedUser.id)
      if (idx !== -1) {
        this.users[idx] = { ...this.users[idx], ...updatedUser }
      }
    },

    openNewPatchNote() {
      this.editingPatchNote = null
      this.patchNoteForm = { title: '', version: '', content: '' }
      this.patchNoteError = ''
      this.showPatchNoteForm = true
    },

    editPatchNote(note) {
      this.editingPatchNote = note
      this.patchNoteForm = {
        title: note.title,
        version: note.version || '',
        content: note.content,
      }
      this.patchNoteError = ''
      this.showPatchNoteForm = true
    },

    closePatchNoteForm() {
      this.showPatchNoteForm = false
      this.editingPatchNote = null
      this.patchNoteForm = { title: '', version: '', content: '' }
      this.patchNoteError = ''
    },

    async savePatchNote(data) {
      this.savingPatchNote = true
      this.patchNoteError = ''

      try {
        const payload = {
          title: data.title,
          version: data.version || null,
          content: data.content,
          published: true,
        }

        if (this.editingPatchNote) {
          await flapi.put(`/admin/patch-notes/${this.editingPatchNote.id}`, payload)
        } else {
          await flapi.post('/admin/patch-notes', payload)
        }

        await this.fetchPatchNotes()
        this.closePatchNoteForm()
      } catch (e) {
        console.error('Save patch note error:', e)
        this.patchNoteError =
          e.response?.data?.error || 'Erreur lors de la sauvegarde du patch note.'
      } finally {
        this.savingPatchNote = false
      }
    },

    async togglePublish(note) {
      try {
        await flapi.put(`/admin/patch-notes/${note.id}`, {
          published: !note.published,
        })
        await this.fetchPatchNotes()
      } catch (e) {
        console.error('Toggle publish error:', e)
      }
    },

    confirmDeleteUser(user) {
      this.deleteType = 'user'
      this.deleteTarget = user
      this.deleteDialog = true
    },

    confirmDeletePatchNote(note) {
      this.deleteType = 'patch-note'
      this.deleteTarget = note
      this.deleteDialog = true
    },

    async handleDelete() {
      if (!this.deleteTarget) return
      this.deleting = true

      try {
        if (this.deleteType === 'user') {
          await flapi.delete(`/admin/users/${this.deleteTarget.id}`)
          await this.fetchUsers()
        } else {
          await flapi.delete(`/admin/patch-notes/${this.deleteTarget.id}`)
          await this.fetchPatchNotes()
        }
        this.deleteDialog = false
        this.deleteTarget = null
      } catch (e) {
        console.error(`Delete ${this.deleteType} error:`, e)
      } finally {
        this.deleting = false
      }
    },
  },
}
</script>

<style scoped>
/* ===== Layout ===== */
.admin-content {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

/* ===== Tabs ===== */
.tabs-container {
  margin-top: 0;
}

.modern-tabs {
  background: rgba(255, 255, 255, 0.03) !important;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  backdrop-filter: blur(10px);
}

.modern-tab {
  text-transform: none !important;
  font-weight: 600 !important;
  letter-spacing: 0 !important;
  font-size: 0.9rem !important;
  padding: 16px 20px !important;
  transition: all 0.3s ease !important;
}

.modern-tab:hover {
  background: rgba(255, 255, 255, 0.03) !important;
}

.tab-count {
  font-weight: 700 !important;
  font-size: 0.7rem !important;
}

/* ===== Content Area ===== */
.content-area {
  margin-top: 1.5rem;
}

/* ===== Loading ===== */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
}

/* ===== Responsive ===== */
@media (max-width: 850px) {
  .modern-tab {
    font-size: 0.8rem !important;
    padding: 12px 10px !important;
  }

  .content-area {
    margin-left: 0.75rem !important;
    margin-right: 0.75rem !important;
  }

  .tabs-container {
    margin-left: 0.75rem !important;
    margin-right: 0.75rem !important;
  }
}
</style>
