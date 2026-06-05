<template>
  <div class="glass-card">
    <div class="d-flex align-center flex-wrap pa-4 pa-md-6" style="gap: 1rem">
      <div class="d-flex align-center" style="gap: 0.75rem">
        <v-icon color="primary">mdi-account-search</v-icon>
        <h2 class="section-title">Utilisateurs</h2>
      </div>
      <v-spacer />
      <v-text-field
        v-model="search"
        prepend-inner-icon="mdi-magnify"
        label="Rechercher un utilisateur..."
        variant="outlined"
        density="compact"
        hide-details
        style="max-width: 320px"
        rounded="lg"
        clearable
        class="search-field"
      />
    </div>
    <v-divider class="mx-4 mx-md-6" />

    <div class="pa-4 pa-md-6">
      <v-row>
        <v-col
          v-for="user in filteredUsers"
          :key="user.id"
          cols="12"
          sm="6"
          lg="4"
          xl="3"
        >
          <AdminUserCard :user="user" @select="(u) => $emit('userSelected', u)" @view="(u) => $emit('viewUser', u)" @edit="(u) => $emit('editUser', u)" @delete="(u) => $emit('deleteUser', u)" />

        </v-col>
      </v-row>

      <div
        v-if="filteredUsers.length === 0"
        class="empty-state"
      >
        <v-icon size="64" color="grey" class="mb-4">mdi-account-off</v-icon>
        <h3 class="text-grey mb-2">Aucun utilisateur trouvé</h3>
        <p class="text-grey-darken-1">Essayez de modifier votre recherche.</p>
      </div>
    </div>
  </div>
</template>

<script>
import AdminUserCard from './AdminUserCard.vue'

export default {
  name: 'AdminUsersTab',
  components: { AdminUserCard },
  props: {
    users: {
      type: Array,
      required: true,
    },
  },
  emits: ['userSelected', 'viewUser', 'editUser', 'deleteUser'],

  data() {
    return {
      search: '',
    }
  },
  computed: {
    filteredUsers() {
      if (!this.search) return this.users
      const s = this.search.toLowerCase()
      return this.users.filter(
        (u) =>
          u.username?.toLowerCase().includes(s) ||
          u.globalName?.toLowerCase().includes(s),
      )
    },
  },
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

.search-field {
  --v-field-input-font-size: 0.9rem;
}

.search-field :deep(.v-field) {
  background: rgba(255, 255, 255, 0.03) !important;
  border-color: rgba(255, 255, 255, 0.1) !important;
  transition: all 0.3s ease;
}

.search-field :deep(.v-field:hover) {
  border-color: rgba(88, 101, 242, 0.4) !important;
}

.search-field :deep(.v-field--focused) {
  border-color: #5865f2 !important;
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
