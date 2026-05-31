import flapi from './flapi.js'

export default {
  // --- Solitaire ---
  getRankings() {
    return flapi.get('/solitaire/sotd/rankings')
  },
  getSotdResetVotes() {
    return flapi.get('/solitaire/sotd/reset-votes')
  },
  voteSotdReset() {
    return flapi.post('/solitaire/sotd/reset-vote')
  },
  startNewGame(userSeed, hardMode = false) {
    return flapi.post('/solitaire/start', { userSeed, hardMode })
  },
  startSOTD() {
    return flapi.post('/solitaire/start/sotd')
  },
  resetGame(gameId = null) {
    return flapi.post('/solitaire/reset', { gameId })
  },
  getGameState(userId) {
    return flapi.get(`/solitaire/state/${userId}`)
  },
  moveCard(moveData) {
    return flapi.post('/solitaire/move', moveData)
  },
  drawCard(gameId = null) {
    return flapi.post('/solitaire/draw', { gameId })
  },
  undoMove(gameId = null) {
    return flapi.post('/solitaire/undo', { gameId })
  },
  claimSolitaireSubmission(submissionToken) {
    return flapi.post('/solitaire/claim-submission', { submissionToken })
  },

  // --- Sudoku ---

  getSudokuRankings() {
    return flapi.get('/sudoku/sotd/rankings')
  },
  startSudoku(difficulty) {
    return flapi.post('/sudoku/start', { difficulty })
  },
  startSudokuSOTD() {
    return flapi.post('/sudoku/start/sotd')
  },
  resetSudoku(gameId) {
    return flapi.post('/sudoku/reset', { gameId })
  },
  getSudokuState(userId) {
    return flapi.get(`/sudoku/state/${userId}`)
  },
  submitSudoku(gameId, grid, timeTaken) {
    return flapi.post('/sudoku/submit', { gameId, grid, timeTaken })
  },
  saveSudokuProgress(gameId, grid, notes) {
    return flapi.post('/sudoku/progress', { gameId, grid, notes })
  },
  claimSudokuSubmission(submissionToken) {
    return flapi.post('/sudoku/claim-submission', { submissionToken })
  },
}
