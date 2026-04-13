<template>
  <v-btn-group class="back-btn" density="compact">
    <v-btn
      class="text-none"
      text="Accueil"
      prepend-icon="mdi-home"
      variant="tonal"
      color="#ddd"
      @click="$router.push('/dashboard')"
    ></v-btn>
    <v-btn class="text-none" variant="tonal" color="#ddd" @click="$router.back()">
      <v-icon class="mdi mdi-arrow-u-left-top" size="18"></v-icon>
    </v-btn>
  </v-btn-group>
</template>

<style scoped>
.back-btn {
  position: absolute;
  top: 1rem;
  left: 1rem;
  border-radius: 12px;
}
</style>