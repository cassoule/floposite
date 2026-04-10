import { useToastStore } from '@/stores/toastStore.js'

/**
 * Centralized accessor for the toast store.
 *
 * Every view used to declare its own `showXxxToast` wrappers inside `setup()`
 * (~30 lines of identical boilerplate). This helper returns the same shape
 * so views can spread it directly into the returned object.
 *
 * Usage in an Options API view:
 *
 *   setup() {
 *     return { ...useFlopoToasts() }
 *   }
 */
export function useFlopoToasts() {
  const store = useToastStore()
  return {
    toastStore: store.$state,
    showLoginToast: () => store.showLoginToast(),
    showLogoutToast: () => store.showLogoutToast(),
    showSuccessToast: (message) => store.showSuccessToast(message),
    showForbiddenToast: (message) => store.showForbiddenToast(message),
    showSendingToast: () => store.showSendingToast(),
    showSentToast: () => store.showSentToast(),
    showCommandToast: (message) => store.showCommandToast(message),
    showSuccessOrWarningToast: (message, warning) =>
      store.showSuccessOrWarningToast(message, warning),
    showErrorToast: (message) => store.showErrorToast(message),
    showMaintenanceToast: (estimatedEnd) => store.showMaintenanceToast(estimatedEnd),
    showMaintenanceScheduledToast: (startsAt) => store.showMaintenanceScheduledToast(startsAt),
  }
}
