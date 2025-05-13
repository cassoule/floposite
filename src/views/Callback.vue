<script setup>
import axios from 'axios'
import { useToastStore } from '../stores/toastStore'
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Toast from '@/components/Toast.vue'

const toastStore = useToastStore()
const router = useRouter()
const route = useRoute()

const showLoginToast = () => {
  toastStore.showLoginToast()
}

const showSuccessOrWarningToast = (message, warning) => {
  toastStore.showSuccessOrWarningToast(message, warning)
}

onMounted(async () => {
  showLoginToast()
  try {
    const code = route.query.code
    const DEV = import.meta.env.VITE_DEV_ENV ?? false
    const endpoint = DEV ? import.meta.env.VITE_CLIENT_URI + '/auth' : '/.netlify/functions/auth'

    const response = await axios.get(endpoint, {
      params: { code },
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.data.discordId) {
      throw new Error('No Discord ID in response')
    }

    localStorage.setItem('discordId', response.data.discordId)
    showSuccessOrWarningToast('Coucou ^^', false)
    await router.push('/dashboard')
  } catch (error) {
    console.error('Authentication failed:', error.response?.data || error.message)
    showSuccessOrWarningToast('Erreur d\'authentification', true)
    await router.push('/')
  }
})
</script>

<template>
  <div class="callback">
    <p>Connexion...</p>
  </div>
  <toast v-if="toastStore.show" :key="toastStore.toastKey" />
</template>