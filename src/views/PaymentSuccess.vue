<template>
  <v-layout>
    <v-main class="payment-success">
      <v-card class="success-card" variant="tonal" max-width="500" rounded="xl">
        <v-card-title class="text-center pt-8 pb-4">
          <v-icon color="primary" size="120">mdi-check-circle-outline</v-icon>
        </v-card-title>
        <v-card-title class="text-left">Paiement réussi !</v-card-title>
        <v-card-text class="text-left pb-6">
          Vos FlopoCoins ont été ajoutés à votre compte.
        </v-card-text>
        <v-card-actions class="justify-center pb-4 px-4">
          <v-btn
            class="text-none"
            color="primary"
            variant="flat"
            rounded="lg"
            block
            @click="$router.push('/dashboard')"
          >
            Retour au Dashboard
            <template #append>
              <v-progress-circular
                :model-value="countdownProgress"
                class="ml-4"
                color="white"
                size="15"
                width="2"
              ></v-progress-circular>
            </template>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-main>
  </v-layout>
</template>

<script>
export default {
  name: 'PaymentSuccess',
  data() {
    return {
      countdown: 5000,
    }
  },
  computed: {
    countdownProgress() {
      return (this.countdown / 5000) * 100
    },
  },
  mounted() {
    let interval = setInterval(() => {
      if (this.countdown <= 0) {
        clearInterval(interval)
        this.$router.push('/dashboard')
      } else {
        this.countdown -= 100
      }
    }, 100)
  },
}
</script>

<style scoped>
.payment-success {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 50vh;
}

.success-card {
  margin: 20px;
}
</style>
