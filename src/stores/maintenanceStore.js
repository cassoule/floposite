import { defineStore } from 'pinia'

export const useMaintenanceStore = defineStore('maintenance', {
  state: () => ({
    active: false,
    estimatedEnd: null,
    scheduledStart: null,
  }),
  actions: {
    setMaintenance(active, estimatedEnd = null) {
      this.active = active
      this.estimatedEnd = estimatedEnd
      if (!active) {
        this.scheduledStart = null
      }
    },
    setScheduled(startsAt, estimatedEnd = null) {
      this.scheduledStart = startsAt
      this.estimatedEnd = estimatedEnd
    },
    clear() {
      this.active = false
      this.estimatedEnd = null
      this.scheduledStart = null
    },
  },
})
