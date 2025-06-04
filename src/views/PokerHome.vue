<script>

</script>

<template>
  <v-layout>
    <p>Poker Home</p>
    <v-btn class="back-btn text-none" text="Retour" variant="tonal" color="#ddd" @click="$router.push('/dashboard')"></v-btn>
  </v-layout>
</template>

<style scoped>
.back-btn {
  position: absolute;
  top: 1rem;
  left: 1rem;
  border-radius: 12px;
}
</style>