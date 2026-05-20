import flapi from './flapi.js'

export default {
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
  resetGame() {
    return flapi.post('/solitaire/reset')
  },
  getGameState(userId) {
    return flapi.get(`/solitaire/state/${userId}`)
  },
  moveCard(moveData) {
    return flapi.post('/solitaire/move', moveData)
  },
  drawCard() {
    return flapi.post('/solitaire/draw')
  },
  undoMove() {
    return flapi.post('/solitaire/undo')
  },

  // Sudoku
  getSudokuRankings() {
    return flapi.get('/sudoku/sotd/rankings')
  },
  startSudoku(difficulty) {
    return flapi.post('/sudoku/start', { difficulty })
  },
  startSudokuSOTD() {
    return flapi.post('/sudoku/start/sotd')
  },
  resetSudoku() {
    return flapi.post('/sudoku/reset')
  },
  getSudokuState(userId) {
    return flapi.get(`/sudoku/state/${userId}`)
  },
  submitSudoku(grid) {
    return flapi.post('/sudoku/submit', { grid })
  },
  saveSudokuProgress(grid, notes) {
    return flapi.post('/sudoku/progress', { grid, notes })
  },

  // Mots Fléchés
  getMotsFlechesRankings() {
    return flapi.get('/mots-fleches/sotd/rankings')
  },
  getMotsFlechesArchive(limit = 60) {
    return flapi.get(`/mots-fleches/archive?limit=${limit}`)
  },
  startMotsFlechesSOTD() {
    return flapi.post('/mots-fleches/start/sotd')
  },
  startMotsFlechesArchive(date) {
    return flapi.post('/mots-fleches/start/archive', { date })
  },
  getMotsFlechesState(userId) {
    return flapi.get(`/mots-fleches/state/${userId}`)
  },
  saveMotsFlechesProgress(filledGrid) {
    return flapi.post('/mots-fleches/progress', { filledGrid })
  },
  submitMotsFleches(filledGrid) {
    return flapi.post('/mots-fleches/submit', { filledGrid })
  },
  resetMotsFleches() {
    return flapi.post('/mots-fleches/reset')
  },
}
