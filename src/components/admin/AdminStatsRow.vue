<template>
  <div class="stats-row mt-6">
    <div class="stat-card">
      <div class="stat-icon users-icon">
        <v-icon>mdi-account-group</v-icon>
      </div>
      <div class="stat-info">
        <span class="stat-value">{{ usersCount }}</span>
        <span class="stat-label">Utilisateurs</span>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon notes-icon">
        <v-icon>mdi-note-text</v-icon>
      </div>
      <div class="stat-info">
        <span class="stat-value">{{ patchNotesCount }}</span>
        <span class="stat-label">Patch Notes</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AdminStatsRow',
  props: {
    usersCount: {
      type: Number,
      default: 0,
    },
    patchNotesCount: {
      type: Number,
      default: 0,
    },
  },
}
</script>

<style scoped>
.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
}

.stat-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.stat-card:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(88, 101, 242, 0.2);
  transform: translateY(-2px);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.users-icon {
  background: linear-gradient(135deg, rgba(88, 101, 242, 0.2), rgba(88, 101, 242, 0.05));
  color: #5865f2;
}

.notes-icon {
  background: linear-gradient(135deg, rgba(46, 213, 115, 0.2), rgba(46, 213, 115, 0.05));
  color: #2ed573;
}

.online-icon {
  background: linear-gradient(135deg, rgba(0, 210, 255, 0.2), rgba(0, 210, 255, 0.05));
  color: #00d2ff;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: white;
  line-height: 1.2;
}

.stat-label {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.4);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

@media (max-width: 850px) {
  .stats-row {
    grid-template-columns: 1fr;
  }
}
</style>
