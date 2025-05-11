import { defineStore } from 'pinia'

export const useToastStore = defineStore('toast', {
    state: () => ({
        key: Date.now(),
        show: false,
        text: null,
        timeout: 0,
        icon: null,
        color: null,
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
            setTimeout(() => {
                this.show = false
            }, 500)

            setTimeout(() => {
                this.key = Date.now()
                this.text = message
                this.icon = warning ? 'mdi mdi-alert-circle-outline' : 'mdi mdi-check-bold'
                this.color = warning ? 'warning' : 'primary'
                this.show = true
            }, 750)

            setTimeout(() => {
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
    },
})
