import axios from 'axios'

const API_URL = import.meta.env.VITE_FLAPI_URL || 'http://localhost:3000/api'

export default {
  getRankings() {
    return axios.get(`${API_URL}/solitaire/sotd/rankings`)
  },
  startNewGame(userSeed, hardMode = false) {
    return axios.post(`${API_URL}/solitaire/start`, { userSeed, hardMode })
  },
  startSOTD() {
    return axios.post(`${API_URL}/solitaire/start/sotd`)
  },
  resetGame() {
    return axios.post(`${API_URL}/solitaire/reset`)
  },
  getGameState(userId) {
    return axios.get(`${API_URL}/solitaire/state/${userId}`)
  },
  moveCard(moveData) {
    return axios.post(`${API_URL}/solitaire/move`, moveData)
  },
  drawCard() {
    return axios.post(`${API_URL}/solitaire/draw`)
  },
  undoMove() {
    return axios.post(`${API_URL}/solitaire/undo`)
  },
}
