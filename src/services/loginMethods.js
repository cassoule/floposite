/**
 * Login Methods Registry
 *
 * Centralized registry for authentication methods.
 * To add a new login method, import `registerMethod` from this file
 * and call it anywhere in your app (e.g. in main.js or a plugin).
 *
 * Example:
 * ```js
 * import { registerMethod } from '@/services/loginMethods'
 *
 * registerMethod({
 *   id: 'discord',
 *   label: 'Discord',
 *   icon: 'fab fa-discord',
 *   authUrl: 'https://api.example.com/auth/discord',
 * })
 * ```
 */

/**
 * @typedef {Object} LoginMethod
 * @property {string} id - Unique identifier (e.g. 'discord', 'google')
 * @property {string} label - Human-readable label
 * @property {string} [icon] - CSS class for an icon (e.g. 'mdi mdi-discord')
 * @property {string} [authUrl] - URL to redirect for OAuth
 * @property {Function} [handler] - Custom login handler (overrides authUrl redirect)
 * @property {Function} [isDisabled] - Function(context) returning boolean
 * @property {Object} [meta] - Any extra data the method needs
 */

/** @type {LoginMethod[]} */
const _methods = []

/** @type {Set<Function>} */
const _subscribers = new Set()

/**
 * Register a new login method.
 * @param {LoginMethod} method
 */
export function registerMethod(method) {
  if (!method.id) throw new Error('[loginMethods] Method must have an id')
  const idx = _methods.findIndex((m) => m.id === method.id)
  if (idx !== -1) {
    _methods[idx] = { ..._methods[idx], ...method }
  } else {
    _methods.push(method)
  }
  _notify()
}

/**
 * Remove a login method by id.
 * @param {string} id
 */
export function unregisterMethod(id) {
  const idx = _methods.findIndex((m) => m.id === id)
  if (idx !== -1) {
    _methods.splice(idx, 1)
    _notify()
  }
}

/**
 * Get all registered login methods.
 * @returns {LoginMethod[]}
 */
export function getMethods() {
  return _methods
}

/**
 * Subscribe to changes in the methods list.
 * Returns an unsubscribe function.
 * @param {Function} callback
 * @returns {Function}
 */
export function subscribe(callback) {
  _subscribers.add(callback)
  return () => _subscribers.delete(callback)
}

function _notify() {
  _subscribers.forEach((cb) => cb(_methods))
}

/**
 * Default handler: redirect to authUrl.
 * @param {LoginMethod} method
 */
export function defaultHandler(method) {
  if (method.authUrl) {
    window.location = method.authUrl
  }
}
