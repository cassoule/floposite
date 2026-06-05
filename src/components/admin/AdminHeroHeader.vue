<template>
  <div class="hero-header pa-6 pa-md-8">
    <div class="d-flex align-center flex-wrap" style="gap: 1rem">
      <div class="hero-text">
        <h1 class="hero-title">Administration</h1>
        <p class="hero-subtitle">Gérez les utilisateurs et les contenus de la plateforme</p>
      </div>
      <v-spacer />
      <v-chip
        class="admin-chip"
        variant="flat"
        size="small"
        prepend-icon="mdi-shield-check"
      >
        Admin
      </v-chip>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AdminHeroHeader',
}
</script>

<style scoped>
.hero-header {
  position: relative;
  overflow: hidden;
  padding-top: 6rem !important;
}

.hero-title {
  font-size: 2rem;
  font-weight: 700;
  background: linear-gradient(135deg, #fff 0%, rgba(255, 255, 255, 0.7) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.2;
}

.hero-subtitle {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.95rem;
  margin-top: 0.25rem;
}

.admin-chip {
  background: linear-gradient(135deg, #ff4757 0%, #ff6b81 100%) !important;
  color: white !important;
  font-weight: 600;
  letter-spacing: 0.02em;
}

@media (max-width: 850px) {
  .hero-header {
    padding: 5rem 1rem 1.5rem !important;
  }
  .hero-title {
    font-size: 1.5rem;
  }
}
</style>
