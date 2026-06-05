<script setup>
import { RouterView, useRouter } from 'vue-router'
import { onMounted, onUnmounted } from 'vue'
import { useToastStore } from '@/stores/toastStore.js'
import { useMaintenanceStore } from '@/stores/maintenanceStore.js'
import { getSocket, disconnectSocket } from '@/services/socket.js'
import flapi from '@/services/flapi.js'
import Toast from '@/components/Toast.vue'

const toastStore = useToastStore()
const maintenanceStore = useMaintenanceStore()
const router = useRouter()
let socket = null

async function checkMaintenanceStatus() {
  try {
    const { data } = await flapi.get('/check')
    if (data.scheduledMaintenance) {
      maintenanceStore.setScheduled(data.scheduledMaintenance.startsAt, data.scheduledMaintenance.estimatedEnd)
    }
  } catch (err) {
    if (err.response?.data?.error === 'maintenance') {
      maintenanceStore.setMaintenance(true, err.response.data.estimatedEnd)
      router.replace({ name: 'Maintenance' })
    }
  }
}

const onMaintenanceUpdate = (data) => {
  if (data.active) {
    maintenanceStore.setMaintenance(true, data.estimatedEnd)
    toastStore.showMaintenanceToast(data.estimatedEnd)
    router.replace({ name: 'Maintenance' })
    } else {
      maintenanceStore.setMaintenance(false)
        router.replace({ path: '/' }) 
  }
}

const onMaintenanceScheduled = (data) => {
  if (data?.startsAt) {
    maintenanceStore.setScheduled(data.startsAt, data.estimatedEnd)
    toastStore.showMaintenanceScheduledToast(data.startsAt)
  }
}

onMounted(async () => {
  await checkMaintenanceStatus()
  socket = getSocket()
  socket.on('maintenance-update', onMaintenanceUpdate)
  socket.on('maintenance-scheduled', onMaintenanceScheduled)
})

onUnmounted(() => {
  if (socket) {
    socket.off('maintenance-update', onMaintenanceUpdate)
    socket.off('maintenance-scheduled', onMaintenanceScheduled)
  }
  disconnectSocket()
})
</script>

<template>
  <router-view />
  <toast v-if="toastStore.show" :key="toastStore.key" />
</template>

<style scoped>
header {
  line-height: 1.5;
  max-height: 100vh;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

nav {
  width: 100%;
  font-size: 12px;
  text-align: center;
  margin-top: 2rem;
}

nav a.router-link-exact-active {
  color: var(--color-text);
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
  border: 0;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }

  nav {
    text-align: left;
    margin-left: -1rem;
    font-size: 1rem;

    padding: 1rem 0;
    margin-top: 1rem;
  }
}
</style>
