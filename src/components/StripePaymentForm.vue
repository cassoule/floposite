<template>
  <div class="payment-form">
    <form @submit.prevent="handleSubmit">
      <div v-show="ready" id="payment-element" ref="paymentElement"></div>
      <div v-show="!ready" class="py-16 my-16">
        <v-progress-circular class="w-100" :size="50" width="10" color="primary" indeterminate />
      </div>
<!--      <div v-if="errorMessage" class="error">{{ errorMessage }}</div>-->
      <button :disabled="loading || !ready">
        {{ loading ? 'Traitement en cours...' : 'Payer' }}
      </button>

    </form>
  </div>
</template>

<script>
import { loadStripe } from '@stripe/stripe-js';

export default {
  props: {
    amount: {
      type: Number,
      required: true
    }
  },
  data() {
    return {
      loading: false,
      errorMessage: '',
      stripe: null,
      elements: null,
      paymentElement: null,
      ready: false,
    };
  },
  async mounted() {
    // Initialize Stripe
    this.stripe = await loadStripe(import.meta.env.VITE_APP_STRIPE_PUBLIC_KEY);

    // Create payment intent
    try {
      const response = await fetch(import.meta.env.VITE_CLIENT_URI + '/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: this.amount })
      });

      const { clientSecret } = await response.json();

      // Initialize elements
      this.elements = this.stripe.elements({
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#3f51b5',
            borderRadius: '8px'
          }
        }
      });

      // Create and mount payment element
      this.paymentElement = this.elements.create('payment');
      this.paymentElement.mount('#payment-element');
      this.ready = true
    } catch (error) {
      this.errorMessage = 'Failed to initialize payment form';
    }
  },
  methods: {
    async handleSubmit() {
      this.loading = true;
      this.errorMessage = '';

      try {
        const { error } = await this.stripe.confirmPayment({
          elements: this.elements,
          confirmParams: {
            return_url: `${window.location.origin}/payment-complete`,
          },
          redirect: 'if_required'
        });

        if (error) throw error;

        this.$emit('payment-success');

      } catch (error) {
        this.errorMessage = error.message;
      } finally {
        this.loading = false;
      }
    }
  },
  beforeUnmount() {
    if (this.paymentElement) {
      this.paymentElement.destroy();
    }
  }
};
</script>

<style scoped>
.payment-form {
  margin: 0 auto;
  border-radius: 8px;
}

button {
  margin-top: 16px;
  background: #3f51b5;
  color: white;
  border: none;
  border-radius: 10px;
  width: 100%;
}

button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.error {
  color: #d32f2f;
  margin: 16px 0 0 0;
  padding: 4px 16px;
  background: white;
  border-radius: 10px;
}
</style>