<script setup>
/* global localStorage */
import axios from 'axios'
import { useToastStore } from '../stores/toastStore'
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

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
    const token = route.query.token

    if (!token) {
      throw new Error('No token in URL')
    }

    // Store the JWT token
    localStorage.setItem('token', token)

    // Fetch user info using the token
    const response = await axios.get(import.meta.env.VITE_FLAPI_URL + '/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!response.data.discordId) {
      throw new Error('No Discord ID in response')
    }

    localStorage.setItem('discordId', response.data.discordId)
    showSuccessOrWarningToast('Coucou ^^', false)
    await router.push('/dashboard')
  } catch (error) {
    console.error('Authentication failed:', error.response?.data || error.message)
    localStorage.removeItem('token')
    localStorage.removeItem('discordId')
    showSuccessOrWarningToast("Erreur d'authentification", true)
    await router.push('/')
  }
})
</script>

<template>
  <div class="callback">
    <p>Connexion...</p>
  </div>

</template>
