<template>
  <v-layout>
    <v-main class="d-flex" style="place-items: start; place-content: start; gap: 2em; flex-wrap: wrap">
      <div class="mt-8">
        <h1 class="text-white" style="position: relative;">Puissance 4</h1>

          <v-btn
            v-if="!foundLobby"
            id="find"
            class="my-2 "
            color="primary"
            text="Chercher un joueur"
            :loading="inQueue"
            :disabled="foundLobby !== null && foundLobby !== undefined"
            style="border-radius: 10px"
            @click="joinQueue"
          />
          <p v-if="!foundLobby && queue.length > 0" class="mb-3">
            {{ !foundLobby && queue.length > 0 ? `Dans la file d'attente :` : '&nbsp' }}
            <span v-for="(p, index) in queue" :key="p">
              {{index > 1 ? ',' : ''}}
              {{ p }}
            </span>
          </p>

        <div v-if="foundLobby" class="game-section">
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
        </div>
      </div>
    </v-main>

    <v-progress-linear v-if="foundLobby" v-model="timeLeft" style="position: fixed; left: 0"/>

    <v-dialog v-model="endGameDialog" persistent max-width="250">
      <v-card color="primary" style="border-radius: 15px">
        <v-card-title class="text-uppercase pt-4 pb-0">
          {{ title }}
        </v-card-title>
        <v-card-text class="px-4 py-0 font-weight-light">
          {{ message }}
        </v-card-text>
        <v-card-actions>
          <v-btn class="rounded-lg" text="Ok" variant="tonal" @click="reload"></v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-btn class="back-btn text-none" text="Retour" variant="tonal" color="#ddd" @click="$router.push('/dashboard')"></v-btn>
  </v-layout>
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
      endGameDialog: false,
      title: null,
      message: null,
      now: Date.now(),
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
    },
    timeLeft() {
      if (this.endGameDialog) {
        return 0
      }
      let tl = Math.min(
        Math.floor((((this.now - (this.foundLobby?.lastmove || this.now)) / 1000) * 100) / 60),
        100,
      )
      if (tl === 100) {
        let winner = this.foundLobby?.sum % 2 === 0 ? this.foundLobby.p1 : this.foundLobby.p2
        let loser = this.foundLobby?.sum % 2 === 0 ? this.foundLobby.p2.name : this.foundLobby.p1.name

        this.title = winner.id === this.discordId ? 'Victoire' : 'Défaite'
        this.message = `Temps écoulé pour ${loser}`
        this.socket.emit('connect4NoTime', { playerId: this.discordId, winner: winner.id })
        this.endGameDialog = true
        clearInterval(this.interval)
        tl = 0
      }
      return tl
    },
  },
  methods: {
    reload() {
      location.reload()
    },
    joinQueue() {
      this.inQueue = true;
      this.socket.emit('connect4queue', { playerId: this.discordId });
    },
    dropPiece(colIndex) {
      if (!this.isMyTurn || this.gameOver) return;

      // Check if column is full
      if (this.board[0][colIndex]) {
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
  created() {
    this.interval = setInterval(() => {
      this.now = Date.now()
    }, 1000)
  },
  beforeDestroy() {
    clearInterval(this.interval)
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

    this.socket.on('connect4gameOver', async (data) => {
      if (this.foundLobby && this.foundLobby.msgId === data.game.msgId) {
        this.gameOver = true;
        this.winner = data.winner;
        this.foundLobby.winningPieces = data.game.winningPieces; // Get winning pieces
        this.title = this.winner === 'draw' ? 'Égalité' : (this.winner === this.discordId ? 'Victoire' : 'Défaite')
        this.message = this.winner === 'draw' ? 'Personne ne gagne' : (this.foundLobby.p1.id === this.winner ? `Victoire de ${this.foundLobby.p1.name}` : `Victoire de ${this.foundLobby.p2.name}`)
        setTimeout(() => {
          this.endGameDialog = true
        }, 250)
      }
    });

    this.socket.emit('connect4connection', { id: this.discordId })
  },
  beforeUnmount() {
    if (this.socket) {
      this.socket.disconnect();
    }
  },
};
</script>

<style scoped>
.back-btn {
  position: absolute;
  top: 1rem;
  left: 1rem;
  border-radius: 12px;
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
  border: 2px solid white;
  transform: scale(1.2);
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