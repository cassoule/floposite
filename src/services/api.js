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

  // Sudoku
  getSudokuRankings() {
    return axios.get(`${API_URL}/sudoku/sotd/rankings`)
  },
  startSudoku(difficulty) {
    return axios.post(`${API_URL}/sudoku/start`, { difficulty })
  },
  startSudokuSOTD() {
    return axios.post(`${API_URL}/sudoku/start/sotd`)
  },
  resetSudoku() {
    return axios.post(`${API_URL}/sudoku/reset`)
  },
  getSudokuState(userId) {
    return axios.get(`${API_URL}/sudoku/state/${userId}`)
  },
  submitSudoku(grid) {
    return axios.post(`${API_URL}/sudoku/submit`, { grid })
  },
  saveSudokuProgress(grid, notes) {
    return axios.post(`${API_URL}/sudoku/progress`, { grid, notes })
  },
}
