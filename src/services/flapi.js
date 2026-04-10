/* global localStorage */
import axios from 'axios'
import router from '@/router'

/**
 * Central axios instance for the flAPI backend.
 *
 * Replaces the scattered
 *   axios.get(import.meta.env.VITE_FLAPI_URL + '/path', {
 *     headers: { 'ngrok-skip-browser-warning': 'true', ... },
 *     withCredentials: false,
 *   })
 * boilerplate that lived in every view.
 */

export const FLAPI_BASE = import.meta.env.VITE_FLAPI_URL
export const SOCKET_URL = (FLAPI_BASE || '').replace(/\/api$/, '')

const flapi = axios.create({
  baseURL: FLAPI_BASE,
  withCredentials: false,
  headers: {
    'ngrok-skip-browser-warning': 'true',
    'Content-Type': 'application/json',
  },
})

// Attach the auth token to every request if present.
flapi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auto-logout on 401 responses (mirrors the global axios interceptor in main.js).
flapi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('discordId')
      router.push('/')
    }
    return Promise.reject(error)
  },
)

export default flapi
