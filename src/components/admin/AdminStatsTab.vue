<template>
  <div class="glass-card pa-4 pa-md-6">
    <div class="d-flex align-center" style="gap: 0.75rem">
      <v-icon color="primary">mdi-chart-bar</v-icon>
      <h2 class="section-title">Statistiques</h2>
    </div>

    <v-divider class="mt-4 mb-6" />

    <div class="coming-soon-banner">
      <v-icon size="48" color="grey" class="mb-3">mdi-hammer-wrench</v-icon>
      <h3 class="text-grey mb-1">En cours de développement</h3>
      <p class="text-grey-darken-1 text-center" style="max-width: 400px">
        Des graphiques détaillés, des analyses de tendances et un tableau de bord interactif
        arriveront dans une prochaine mise à jour.
      </p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AdminStatsTab',
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

.coming-soon-banner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  background: rgba(255, 255, 255, 0.01);
  border: 1px dashed rgba(255, 255, 255, 0.08);
  border-radius: 16px;
}
</style>
