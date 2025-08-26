import axios from 'axios';

// IMPORTANT: Replace this with your actual backend URL
// For local development, it might be 'http://localhost:25578'
const API_URL = import.meta.env.VITE_FLAPI_URL || 'http://localhost:3000/api';

export default {
  getRankings() {
    return axios.get(`${API_URL}/solitaire/sotd/rankings`);
  },
  startNewGame(userId, userSeed, hardMode = false) {
    return axios.post(`${API_URL}/solitaire/start`, { userId, userSeed, hardMode });
  },
  startSOTD(userId) {
    return axios.post(`${API_URL}/solitaire/start/sotd`, { userId });
  },
  resetGame(userId) {
    return axios.post(`${API_URL}/solitaire/reset`, { userId })
  },
  /**
   * Gets the current game state for a user.
   * Creates a new game if one doesn't exist.
   * @param {string} userId - The ID of the user.
   * @returns {Promise<Object>} The game state.
   */
  getGameState(userId) {
    return axios.get(`${API_URL}/solitaire/state/${userId}`);
  },

  /**
   * Makes a move API call.
   * @param {Object} moveData - The details of the move.
   * @returns {Promise<Object>} The updated game state.
   */
  moveCard(moveData) {
    // The backend expects a body with userId and move details
    const payload = {
      ...moveData,
    };
    return axios.post(`${API_URL}/solitaire/move`, payload);
  },

  /**
   * Makes a draw card API call.
   * @param {string} userId - The ID of the user.
   * @returns {Promise<Object>} The updated game state.
   */
  drawCard(userId) {
    return axios.post(`${API_URL}/solitaire/draw`, { userId });
  },

  undoMove(userId) {
    return axios.post(`${API_URL}/solitaire/undo`, { userId });
  }
};