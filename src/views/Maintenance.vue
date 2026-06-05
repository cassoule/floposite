<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMaintenanceStore } from '@/stores/maintenanceStore.js'
import flapi from '@/services/flapi.js'

const router = useRouter()
const maintenanceStore = useMaintenanceStore()
let pollInterval = null

async function checkMaintenance() {
  try {
    const { data } = await flapi.get('/check')
    
    if (data.status === 'OK') {
      maintenanceStore.setMaintenance(false)
      router.replace({ path: '/' })
    }
  } catch (err) {
    const isMaintenanceError = err.response?.status === 503 || err.response?.data?.error === 'maintenance'
    
    if (!isMaintenanceError) {
      console.warn('Polling check failed due to unexpected error:', err.message)
    }
  }
}

onMounted(() => {
  checkMaintenance()
  pollInterval = setInterval(checkMaintenance, 10000)
})

onUnmounted(() => {
  if (pollInterval) {
    clearInterval(pollInterval)
    pollInterval = null
  }
})
</script>

<template>
  <div class="landing-page">
    <section class="chat-section">
      <div class="chat-content">
        <h1 class="chat-title">Floposite</h1>

        <div class="chat-description">
  <p>Nous effectuons actuellement une maintenance afin d'améliorer votre expérience. Le site sera de retour dans les plus brefs délais.</p>
  <p>Merci de votre patience.</p>
</div>
      </div>

      <div class="chat-image-container">
        <img
          src="/flopobot_Maintenance.webp"
          alt="Flopo Bot en maintenance"
          class="chat-img"
          width="350"
          height="350"
        />
      </div>
    </section>
  </div>
</template>

<style>
html,
body {
  margin: 0;
  padding: 0;
  height: 100%;
  overflow: hidden;
}
</style>

<style scoped>
.landing-page {
  width: 100%;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-section {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;

  width: 100%;
  max-width: 1200px;
  height: 100%;

  margin: 0 auto;
  padding: 0 48px;
  box-sizing: border-box;
  gap: 60px;
}

.chat-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 24px;
}

.chat-title {
  margin: 0;

  color: #ffffff;
  font-family: "Poppins", sans-serif;
  font-size: clamp(64px, 8vw, 100px);
  font-weight: 600;
  line-height: 1;
}

.chat-description {
  margin: 0;
  max-width: 560px;

  color: rgba(255, 255, 255, 0.85);
  font-family: "Poppins", sans-serif;
  font-size: 24px;
  font-weight: 500;
  line-height: 1.6;
}

.chat-image-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  max-width: 350px;
}

.chat-img {
  width: 100%;
  max-width: 350px;
  height: auto;
  object-fit: contain;
}

@media (max-width: 968px) {
  .chat-section {
    flex-direction: column-reverse;
    justify-content: center;
    text-align: center;

    padding: 24px;
    gap: 32px;
  }

  .chat-title {
    font-size: clamp(48px, 12vw, 64px);
  }

  .chat-description {
    margin: 0 auto;
    font-size: 18px;
    line-height: 1.5;
  }

  .chat-image-container {
    max-width: 220px;
  }
}
</style>