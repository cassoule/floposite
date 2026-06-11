<template>
  <div class="user-card" @click="$emit('select', user)">
    <div class="user-card-header">
      <div class="user-avatar-wrapper">
        <v-img
          :src="user.avatarUrl || '/anon.png'"
          width="48"
          height="48"
          rounded="circle"
          class="user-avatar"
        />
      </div>
      <div class="user-card-info">
        <div class="user-card-name">@{{ user.username }}</div>
        <div class="user-card-global">{{ user.globalName || 'Aucun nom' }}</div>
      </div>
      <v-spacer />
      <div class="d-flex align-center">
        <v-btn icon variant="text" size="small" color="grey" class="user-card-menu">
          <v-icon>mdi-dots-vertical</v-icon>
        </v-btn>
      </div>
    </div>

    <div class="patch-note-divider mt-3 mb-3"></div>

    <div class="user-card-actions">
      <v-btn
        size="small"
        variant="tonal"
        color="white"
        prepend-icon="mdi-eye"
        rounded="lg"
        class="action-btn-modern"
        @click.stop="$emit('view', user)"
      >
        Voir
      </v-btn>

      <v-btn
        size="small"
        variant="tonal"
        color="white"
        prepend-icon="mdi-pencil"
        rounded="lg"
        class="action-btn-modern"
        @click.stop="$emit('edit', user)"
      >
        Éditer
      </v-btn>

      <v-spacer></v-spacer>

      <v-btn
        size="small"
        variant="flat"
        color="error"
        prepend-icon="mdi-delete"
        rounded="lg"
        class="action-btn-modern ban-btn"
        @click.stop="$emit('delete', user)"
      >
        Ban
      </v-btn>
    </div>
  </div>
</template>

<script>
import { formatAmount } from '@/utils/format.js'

export default {
  name: 'AdminUserCard',
  props: {
    user: {
      type: Object,
      required: true,
    },
  },
  emits: ['select', 'view', 'delete', 'edit'],

  methods: {
    formatAmount,
  },
}
</script>

<style scoped>
.fw-bold {
  font-weight: bold !important;
}

.v-icon.fix-aspect {
  aspect-ratio: 1 / 1 !important;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0 !important;
  line-height: 1 !important;
}

.user-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  padding: 1.25rem;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.user-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(88, 101, 242, 0.3), transparent);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.user-card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.user-avatar-wrapper {
  position: relative;
  flex-shrink: 0;
}

.user-avatar {
  border: 2px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.user-card-info {
  min-width: 0;
  flex: 1;
}

.user-card-name {
  font-weight: 600;
  color: white;
  font-size: 0.95rem;
}

.user-card-global {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.4);
}

.user-card-menu {
  opacity: 0;
  transition: all 0.3s ease;
}

.user-card-details {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
  background: rgba(255, 255, 255, 0.03);
  padding: 0.3rem 0.6rem;
  border-radius: 8px;
}

.detail-item .v-icon {
  font-size: 0.85rem !important;
}

.user-card-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  align-items: center;
}

.patch-note-divider {
  height: 1px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.08), transparent);
  margin-bottom: 0.5rem;
}

.action-btn-modern {
  text-transform: none !important;
  letter-spacing: 0 !important;
  font-weight: 600 !important;
  color: #ffffff !important;
  background: rgba(255, 255, 255, 0.12) !important;
}
.action-btn-modern:hover {
  background: rgba(255, 255, 255, 0.2) !important;
}

.ban-btn {
  color: white !important;
  background-color: #e53935 !important;
  margin-left: 0.5rem !important;
}

.warn-chip {
  font-weight: 600 !important;
  font-size: 0.75rem !important;
}

@media (max-width: 850px) {
  .user-card-menu {
    opacity: 1;
  }
}
</style>
