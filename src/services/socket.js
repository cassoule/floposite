/* global localStorage */
import { io } from 'socket.io-client'
import { SOCKET_URL } from './flapi.js'

/**
 * Shared socket.io client.
 *
 * Before: every view called `io(...)` with the same options block,
 * resulting in 10+ parallel connections. Now a single connection is
 * shared, and views only attach/detach their own listeners.
 */

let sharedSocket = null

function createSocket() {
  return io(SOCKET_URL, {
    withCredentials: false,
    auth: { token: localStorage.getItem('token') },
    extraHeaders: {
      'ngrok-skip-browser-warning': 'true',
    },
  })
}

/**
 * Return the shared socket instance, creating it on first call.
 * If the previous instance was disconnected (e.g. after a logout),
 * a new one is created transparently.
 */
export function getSocket() {
  if (sharedSocket && sharedSocket.connected === false && sharedSocket.disconnected) {
    // Previously torn down — recreate.
    sharedSocket = createSocket()
    return sharedSocket
  }
  if (!sharedSocket) {
    sharedSocket = createSocket()
  }
  return sharedSocket
}

/**
 * Fully tear down the shared socket. Called by App.vue on unmount.
 * Individual views should NOT call this; they should only `socket.off(...)`
 * their own listeners.
 */
export function disconnectSocket() {
  if (sharedSocket) {
    sharedSocket.disconnect()
    sharedSocket = null
  }
}
