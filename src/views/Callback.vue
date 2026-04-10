<script setup>
/* global localStorage */
import flapi from '@/services/flapi.js'
import { useFlopoToasts } from '@/composables/useFlopoToasts.js'
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const { showLoginToast, showSuccessOrWarningToast } = useFlopoToasts()
const router = useRouter()
const route = useRoute()

onMounted(async () => {
  showLoginToast()
  try {
    const token = route.query.token

    if (!token) {
      throw new Error('No token in URL')
    }

    // Store the JWT token — the flapi interceptor will pick it up from localStorage.
    localStorage.setItem('token', token)

    const response = await flapi.get('/auth/me')

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
