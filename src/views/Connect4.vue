<template>
  <div class="connect4-container">
    <h1 class="title">Connect 4</h1>

    <!-- Queue Section -->
    <div v-if="!foundLobby" class="queue-section">
      <button @click="joinQueue" class="join-button" :disabled="inQueue">
        {{ inQueue ? 'En attente d\'un adversaire...' : 'Jouer' }}
      </button>
      <div v-if="inQueue && queue.length > 0" class="queue-list">
        Dans la file d'attente :
        <span v-for="(p, index) in queue" :key="p">
          {{ index > 0 ? ', ' : '' }}{{ p }}
        </span>
      </div>
    </div>

    <!-- Game Section -->
    <div v-else class="game-section">
      <div class="game-info">
        <p>
          <span :class="['player-indicator', playerValue === 'R' ? 'red' : 'yellow']"></span>
          Tu joues contre <strong>{{ oppName }}</strong>
        </p>
        <p class="turn-indicator" :class="{ 'my-turn': isMyTurn }">
          {{ gameOver ? 'Partie terminée' : (isMyTurn ? "C'est ton tour" : `C'est au tour de ${oppName}`) }}
        </p>
      </div>

      <!-- Game Board -->
      <div class="board">
        <div v-for="(col, colIndex) in board[0]" :key="colIndex" class="column" @click="dropPiece(colIndex)">
          <div v-for="(cell, rowIndex) in board" :key="rowIndex" class="cell">
            <div
              :class="[
                'piece',
                board[rowIndex][colIndex] === 'R' ? 'red' : '',
                board[rowIndex][colIndex] === 'Y' ? 'yellow' : '',
                isWinningPiece(rowIndex, colIndex) ? 'win' : ''
              ]"
            ></div>
          </div>
        </div>
      </div>

      <!-- Game Over Message -->
      <div v-if="gameOver" class="game-over-message">
        <h2>{{ gameOverMessage }}</h2>
        <button @click="resetGame" class="join-button">Rejouer</button>
      </div>
    </div>
  </div>
</template>

<script>
import { io } from 'socket.io-client';

export default {
  name: 'Connect4',
  data() {
    return {
      socket: null,
      discordId: null,
      inQueue: false,
      queue: [],
      foundLobby: null,
      board: [],
      gameOver: false,
      winner: null,
    };
  },
  computed: {
    oppName() {
      if (!this.foundLobby) return '';
      return this.foundLobby.p1.id === this.discordId ? this.foundLobby.p2.name : this.foundLobby.p1.name;
    },
    playerValue() {
      if (!this.foundLobby) return null;
      return this.foundLobby.p1.id === this.discordId ? this.foundLobby.p1.val : this.foundLobby.p2.val;
    },
    isMyTurn() {
      if (!this.foundLobby || this.gameOver) return false;
      return this.foundLobby.turn === this.discordId;
    },
    gameOverMessage() {
      if (!this.gameOver) return '';
      if (this.winner === 'draw') return "Match nul !";
      if (this.winner === this.discordId) return "Victoire !";
      return "Défaite...";
    }
  },
  methods: {
    joinQueue() {
      this.inQueue = true;
      this.socket.emit('connect4queue', { playerId: this.discordId });
    },
    dropPiece(colIndex) {
      if (!this.isMyTurn || this.gameOver) return;

      // Check if column is full
      if (this.board[0][colIndex]) {
        console.log("This column is full.");
        return;
      }

      this.socket.emit('connect4playing', {
        playerId: this.discordId,
        col: colIndex,
      });
    },
    isWinningPiece(row, col) {
      if (!this.foundLobby?.winningPieces) return false;
      return this.foundLobby.winningPieces.some(p => p.row === row && p.col === col);
    },
    resetGame() {
      this.inQueue = false;
      this.foundLobby = null;
      this.board = [];
      this.gameOver = false;
      this.winner = null;
    }
  },
  mounted() {
    this.discordId = localStorage.getItem('discordId')
    if (!this.discordId) this.$router.push('/')
    // Make sure to replace with your actual API URL
    this.socket = io(import.meta.env.VITE_FLAPI_URL, {
      withCredentials: false,
      extraHeaders: {
        'ngrok-skip-browser-warning': 'true',
      },
    })

    this.socket.on('connect', () => {
      console.log('Connected to server with socket ID:', this.socket.id);
    });

    this.socket.on('connect4queue', (data) => {
      this.queue = data.queue;
      const myLobby = data.allPlayers.find(
        (lobby) => lobby.p1.id === this.discordId || lobby.p2.id === this.discordId
      );
      if (myLobby) {
        this.inQueue = false;
        this.foundLobby = myLobby;
        this.board = myLobby.board;
      }
    });

    this.socket.on('connect4playing', (data) => {
      const myLobby = data.allPlayers.find(
        (lobby) => lobby.p1.id === this.discordId || lobby.p2.id === this.discordId
      );
      if (myLobby) {
        this.foundLobby = myLobby;
        this.board = myLobby.board;
      }
    });

    this.socket.on('connect4gameOver', (data) => {
      if (this.foundLobby && this.foundLobby.msgId === data.game.msgId) {
        this.gameOver = true;
        this.winner = data.winner;
        this.foundLobby.winningPieces = data.game.winningPieces; // Get winning pieces
      }
    });
  },
  beforeUnmount() {
    if (this.socket) {
      this.socket.disconnect();
    }
  },
};
</script>

<style scoped>
.connect4-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: sans-serif;
  padding: 20px;
  background-color: #2c3e50;
  color: white;
  min-height: 100vh;
}

.title {
  margin-bottom: 2rem;
}

.join-button {
  padding: 10px 20px;
  font-size: 1.2rem;
  cursor: pointer;
  border: none;
  border-radius: 5px;
  background-color: #5865f2;
  color: white;
  transition: background-color 0.3s;
}

.join-button:disabled {
  background-color: #4a54c4;
  cursor: not-allowed;
}

.join-button:hover:not(:disabled) {
  background-color: #4a54c4;
}

.queue-section, .game-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.board {
  display: flex;
  flex-direction: row;
  background-color: #0077b6;
  padding: 10px;
  border-radius: 10px;
  border: 5px solid #023e8a;
}

.column {
  display: flex;
  flex-direction: column;
  cursor: pointer;
}

.column:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.cell {
  width: 60px;
  height: 60px;
  background-color: #2c3e50;
  margin: 5px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.piece {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.piece.red {
  background-color: #d90429;
}

.piece.yellow {
  background-color: #ffb703;
}

.piece.win {
  box-shadow: 0 0 20px 5px #fff;
  transform: scale(1.1);
}

.game-info {
  text-align: center;
  margin-bottom: 1rem;
}

.player-indicator {
  display: inline-block;
  width: 1em;
  height: 1em;
  border-radius: 50%;
  vertical-align: middle;
  margin-right: 0.5em;
}

.player-indicator.red { background-color: #d90429; }
.player-indicator.yellow { background-color: #ffb703; }

.turn-indicator.my-turn {
  font-weight: bold;
  color: #a7c957;
}

.game-over-message {
  margin-top: 1.5rem;
  text-align: center;
}
.game-over-message h2 {
  font-size: 2rem;
  margin-bottom: 1rem;
}
</style>