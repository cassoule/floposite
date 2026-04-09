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
    <v-btn
      class="text-none"
      text="Retour"
      variant="tonal"
      color="#ddd"
      style="border-left: 2px solid #18181801"
      @click="$router.back()"
    ></v-btn>
  </v-btn-group>
</template>
