<script>
export default {
  name: "EryniesHomePage",
}
</script>

<template>
  <div class="erynies-bg"></div>
  <v-layout>
    <v-main>
      <h1>Erynies</h1>
    </v-main>
  </v-layout>
</template>

<style scoped>
.erynies-bg {
  position: fixed;
  top: 0;
  left: 0;
  z-index: -1;
  height: 100vh;
  width: 100vw;
  background: url('/erynies_card_back.png') no-repeat center center;
  background-size: 100% auto;
}
.erynies-bg::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at -400% -300%,#3a0000dd,#181818ff 150%);
}
</style>