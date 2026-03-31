/* global setTimeout, clearTimeout */
import { defineStore } from 'pinia'

export const useToastStore = defineStore('toast', {
  state: () => ({
    key: Date.now(),
    show: false,
    text: null,
    timeout: 0,
    icon: null,
    color: null,
    showTimeout: null,
    initTimeout: null,
    hideTimeout: null,
  }),
  actions: {
    closeToast() {
      this.key = Date.now()
      this.show = false
    },
    showLoginToast() {
      this.key = Date.now()
      this.text = 'Connexion en cours...'
      this.icon = 'mdi mdi-login'
      this.color = '#181818'
      this.show = true
    },
    showSendingToast() {
      this.key = Date.now()
      this.text = 'Envoi en cours'
      this.icon = 'mdi mdi-send-outline'
      this.color = 'dark'
      this.show = true
    },
    showForbiddenToast(message) {
      setTimeout(() => {
        this.show = true
        this.key = Date.now()
        this.text = message
        this.icon = 'fa-ban'
        this.color = 'warning'
      }, 250)

      setTimeout(() => {
        this.show = false
      }, 2500)
    },
    showSentToast() {
      setTimeout(() => {
        this.show = false
      }, 500)

      setTimeout(() => {
        this.key = Date.now()
        this.text = 'Message envoyé !'
        this.icon = 'mdi mdi-check-bold'
        this.color = 'primary'
        this.show = true
      }, 750)

      setTimeout(() => {
        this.show = false
      }, 2000)
    },
    showSuccessToast(message) {
      setTimeout(() => {
        this.show = false
      }, 500)

      setTimeout(() => {
        this.key = Date.now()
        this.text = message
        this.icon = 'fa-circle-check'
        this.color = 'success'
        this.show = true
      }, 750)

      setTimeout(() => {
        this.show = false
      }, 3750)
    },
    showLogoutToast() {
      setTimeout(() => {
        this.key = Date.now()
        this.text = 'o7'
        this.icon = 'mdi mdi-logout'
        this.color = '#181818'
        this.show = true
      }, 150)

      setTimeout(() => {
        this.show = false
      }, 1500)
    },
    showCommandToast(message) {
      this.key = Date.now()
      this.text = message
      this.icon = 'mdi mdi-send-outline'
      this.color = 'dark'
      this.show = true
    },
    showSuccessOrWarningToast(message, warning) {
      clearTimeout(this.showTimeout)
      clearTimeout(this.initTimeout)
      clearTimeout(this.hideTimeout)

      this.show = false

      this.initTimeout = setTimeout(() => {
        this.key = Date.now()
        this.text = message
        this.icon = warning ? 'mdi mdi-alert-circle-outline' : 'mdi mdi-check-bold'
        this.color = warning ? 'warning' : 'primary'
        this.show = true
      }, 150)

      this.hideTimeout = setTimeout(() => {
        this.show = false
      }, 3000)
    },
    showErrorToast(message) {
      setTimeout(() => {
        this.show = false
      }, 500)
      setTimeout(() => {
        this.key = Date.now()
        this.text = message
        this.icon = 'mdi mdi-alert-circle-outline'
        this.color = 'dark'
        this.show = true
      }, 750)

      setTimeout(() => {
        this.show = false
      }, 3750)
    },
    showMaintenanceToast(estimatedEnd) {
      let text = 'Maintenance en cours'
      if (estimatedEnd) {
        const remaining = estimatedEnd - Date.now()
        if (remaining > 0) {
          text += `, retour dans ${this._formatDuration(remaining)}`
        }
      }
      this.key = Date.now()
      this.text = text
      this.icon = 'mdi mdi-wrench'
      this.color = 'warning'
      this.show = true

      setTimeout(() => {
        this.show = false
      }, 8000)
    },
    showMaintenanceScheduledToast(startsAt) {
      const remaining = startsAt - Date.now()
      if (remaining <= 0) return
      this.key = Date.now()
      this.text = `Maintenance prévue dans ${this._formatDuration(remaining)}`
      this.icon = 'mdi mdi-wrench-clock'
      this.color = 'warning'
      this.show = true

      setTimeout(() => {
        this.show = false
      }, 8000)
    },
    _formatDuration(ms) {
      const totalSeconds = Math.ceil(ms / 1000)
      if (totalSeconds < 60) return `${totalSeconds}s`
      const minutes = Math.ceil(ms / 60000)
      if (minutes >= 60) {
        const hours = Math.floor(minutes / 60)
        const mins = minutes % 60
        return `~${hours}h${mins > 0 ? mins.toString().padStart(2, '0') : ''}`
      }
      return `~${minutes}min`
    },
  },
})
