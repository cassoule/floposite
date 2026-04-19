<script>
/* global localStorage, setInterval, clearInterval, fetch, location */
import flapi, { FLAPI_BASE } from '@/services/flapi.js'
import { getSocket } from '@/services/socket.js'
import { rankIcon, rankDiv } from '@/utils/rank.js'
import GameOverDialog from '@/components/GameOverDialog.vue'
import HomeBtn from '@/components/HomeBtn.vue'

export default {
  components: { GameOverDialog, HomeBtn },
  beforeRouteLeave(to, from, next) {
    this.leaveQueueSync({ reason: 'route-leave' })
    next()
  },

  data() {
    return {
      discordId: null,
      socket: null,
      playerName: null,

      allPlayersArray: [],
      queue: [],
      oppName: null,
      oppAvatar: null,
      value: null,

      foundLobby: null,
      inQueue: false,

      now: Date.now(),

      title: null,
      message: null,
      endGameDialog: false,

      elo: null,
      oppElo: null,
      elo_graph: [],
      eloBeforeGame: null,
      eloAfterGame: null,
      gamesPlayedAfter: null,
    }
  },

  computed: {
    timeLeft() {
      if (this.endGameDialog) {
        return 0
      }
      return Math.min(
        Math.floor((((this.now - (this.foundLobby?.lastmove || this.now)) / 1000) * 100) / 60),
        100,
      )
    },
  },

  watch: {
    timeLeft(newVal) {
      if (newVal === 100 && !this.endGameDialog) {
        const winner = this.foundLobby?.sum % 2 === 0 ? this.foundLobby.p1 : this.foundLobby.p2
        const loser =
          this.foundLobby?.sum % 2 === 0 ? this.foundLobby.p2.name : this.foundLobby.p1.name

        this.title = winner.id === this.discordId ? 'Victoire' : 'Défaite'
        this.message = `Temps écoulé pour ${loser}`
        this.socket.emit('tictactoegameOver', { playerId: this.discordId, winner: winner.id })
      }
    },
  },
  async mounted() {
    this.discordId = localStorage.getItem('discordId')
    if (!this.discordId) this.$router.push('/')

    this.initSocket()

    this.elo = await this.getElo(this.discordId)
    this.elo_graph = await this.getEloGraph(this.discordId)
  },

  created() {
    this._boundHandleUnload = (e) => this.handleUnload(e)

    window.addEventListener('beforeunload', this._boundHandleUnload)
    window.addEventListener('pagehide', this._boundHandleUnload)

    this.interval = setInterval(() => {
      this.now = Date.now()
    }, 1000)
  },

  beforeUnmount() {
    window.removeEventListener('beforeunload', this._boundHandleUnload)
    window.removeEventListener('pagehide', this._boundHandleUnload)

    this.leaveQueueSync({ reason: 'component-destroy' })

    if (this.socket) {
      if (this._onQueue) this.socket.off('tictactoequeue', this._onQueue)
      if (this._onPlaying) this.socket.off('tictactoeplaying', this._onPlaying)
      if (this._onGameOver) this.socket.off('tictactoegameOver', this._onGameOver)
    }

    clearInterval(this.interval)
  },

  methods: {
    handleUnload() {
      this.leaveQueueSync({ reason: 'unload' })
    },

    leaveQueueSync(meta = {}) {
      const payload = {
        game: 'tictactoe',
        ...meta,
      }

      if (!this.inQueue) return
      const url = `${FLAPI_BASE}/queue/leave`
      const token = localStorage.getItem('token')
      try {
        fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payload),
          keepalive: true,
        }).catch(() => {})
      } catch {
        // Ignore errors during page unload
      }

      if (this.socket?.connected) {
        try {
          this.socket.emit('tictactoe:queue:leave', payload)
        } catch {
          // Ignore errors during page unload
        }
      }
    },

    initSocket() {
      this.socket = getSocket()

      this.socket.emit('tictactoeconnection', { id: this.discordId })

      this._onQueue = async (e) => {
        this.allPlayersArray = e.allPlayers
        this.queue = e.queue

        this.foundLobby = this.allPlayersArray.find(
          (obj) => obj.p1.id === this.discordId || obj.p2.id === this.discordId,
        )

        this.oppName =
          this.foundLobby?.p1.id === this.discordId
            ? this.foundLobby?.p2.name
            : this.foundLobby?.p1.name
        this.oppAvatar =
          this.foundLobby?.p1.id === this.discordId
            ? this.foundLobby?.p2.avatar
            : this.foundLobby?.p1.avatar
        this.playerName =
          this.foundLobby?.p1.id === this.discordId
            ? this.foundLobby?.p1.name
            : this.foundLobby?.p2.name
        this.value =
          this.foundLobby?.p1.id === this.discordId
            ? this.foundLobby?.p1.val
            : this.foundLobby?.p2.val

        this.inQueue = this.inQueue && (this.foundLobby === null || this.foundLobby === undefined)

        this.oppElo = await this.getElo(
          this.foundLobby?.p1.id === this.discordId
            ? this.foundLobby?.p2.id
            : this.foundLobby?.p1.id,
        )

        this.foundLobby?.xs.forEach((x) => {
          document.getElementById(`btn${x}`).innerText = 'X'
          document.getElementById(`btn${x}`).disabled = true
          document.getElementById(`btn${x}`).style.color = 'black'
        })
        this.foundLobby?.os.forEach((o) => {
          document.getElementById(`btn${o}`).innerText = 'O'
          document.getElementById(`btn${o}`).disabled = true
          document.getElementById(`btn${o}`).style.color = 'black'
        })
      }
      this.socket.on('tictactoequeue', this._onQueue)

      this._onPlaying = (e) => {
        this.foundLobby = e.allPlayers.find(
          (obj) => obj.p1.id === this.discordId || obj.p2.id === this.discordId,
        )

        console.log(this.foundLobby)

        let p1id = this.foundLobby.p1.move
        let p2id = this.foundLobby.p2.move

        if (p1id !== '') {
          document.getElementById(`btn${p1id}`).innerText = 'X'
          document.getElementById(`btn${p1id}`).disabled = true
          document.getElementById(`btn${p1id}`).style.color = 'black'
        } else if (p2id !== '') {
          document.getElementById(`btn${p2id}`).innerText = 'O'
          document.getElementById(`btn${p2id}`).disabled = true
          document.getElementById(`btn${p2id}`).style.color = 'black'
        }

        this.check(this.discordId, this.foundLobby.sum)
      }
      this.socket.on('tictactoeplaying', this._onPlaying)

      this._onGameOver = (data) => {
        if (!this.foundLobby) return
        if (data.eloChanges && data.eloChanges[this.discordId]) {
          const myElo = data.eloChanges[this.discordId]
          this.eloBeforeGame = myElo.oldElo
          this.eloAfterGame = myElo.newElo
          this.gamesPlayedAfter = myElo.gamesPlayed
        }
        if (!this.endGameDialog) {
          // Fallback: if check() didn't set title/message (e.g. opponent won)
          if (!this.title) {
            const winner = data.winner
            if (winner === null) {
              this.title = 'Égalité'
              this.message = 'Personne ne gagne'
            } else {
              this.title = winner === this.discordId ? 'Victoire' : 'Défaite'
              const winnerName =
                this.foundLobby.p1.id === winner ? this.foundLobby.p1.name : this.foundLobby.p2.name
              this.message = `Victoire de ${winnerName}`
            }
          }
        }
        this.endGameDialog = true
      }
      this.socket.on('tictactoegameOver', this._onGameOver)
    },

    async getElo(id) {
      try {
        const response = await flapi.get('/user/' + id + '/elo')
        return response.data.elo
      } catch (e) {
        console.error('flAPI error:', e)
      }
    },

    async getEloGraph(id) {
      try {
        const response = await flapi.get('/user/' + id + '/elo-graph')
        return response.data.eloGraph
      } catch (e) {
        console.error('flAPI error:', e)
      }
    },

    findPlayer() {
      if (this.discordId !== null) {
        this.socket.emit('tictactoequeue', { playerId: this.discordId })
        this.inQueue = true
      }
    },

    boxClick(boxId) {
      if (this.foundLobby?.p2.id === this.discordId && this.foundLobby?.sum % 2 === 0) {
        this.socket.emit('tictactoeplaying', {
          value: this.value,
          boxId: boxId,
          playerId: this.discordId,
        })
      } else if (this.foundLobby?.p1.id === this.discordId && this.foundLobby?.sum % 2 === 1) {
        this.socket.emit('tictactoeplaying', {
          value: this.value,
          boxId: boxId,
          playerId: this.discordId,
        })
      }
    },

    check() {
      let b1 =
        document.getElementById(`btn1`).innerText === ''
          ? 'a'
          : document.getElementById('btn1').innerText
      let b2 =
        document.getElementById(`btn2`).innerText === ''
          ? 'b'
          : document.getElementById('btn2').innerText
      let b3 =
        document.getElementById(`btn3`).innerText === ''
          ? 'c'
          : document.getElementById('btn3').innerText
      let b4 =
        document.getElementById(`btn4`).innerText === ''
          ? 'd'
          : document.getElementById('btn4').innerText
      let b5 =
        document.getElementById(`btn5`).innerText === ''
          ? 'e'
          : document.getElementById('btn5').innerText
      let b6 =
        document.getElementById(`btn6`).innerText === ''
          ? 'f'
          : document.getElementById('btn6').innerText
      let b7 =
        document.getElementById(`btn7`).innerText === ''
          ? 'g'
          : document.getElementById('btn7').innerText
      let b8 =
        document.getElementById(`btn8`).innerText === ''
          ? 'h'
          : document.getElementById('btn8').innerText
      let b9 =
        document.getElementById(`btn9`).innerText === ''
          ? 'i'
          : document.getElementById('btn9').innerText

      if (
        (b1 === b2 && b2 === b3) ||
        (b4 === b5 && b5 === b6) ||
        (b7 === b8 && b8 === b9) ||
        (b1 === b4 && b4 === b7) ||
        (b2 === b5 && b5 === b8) ||
        (b3 === b6 && b6 === b9) ||
        (b1 === b5 && b5 === b9) ||
        (b3 === b5 && b5 === b7)
      ) {
        if (this.foundLobby?.sum % 2 === 0) {
          this.title = this.foundLobby?.p1.id === this.discordId ? 'Victoire' : 'Défaite'
          this.message = `Victoire de ${this.foundLobby?.p1.id === this.discordId ? this.playerName : this.oppName}`
        } else {
          this.title = this.foundLobby?.p2.id === this.discordId ? 'Victoire' : 'Défaite'
          this.message = `Victoire de ${this.foundLobby?.p2.id === this.discordId ? this.playerName : this.oppName}`
        }
        let winner = this.foundLobby?.sum % 2 === 0 ? this.foundLobby?.p1 : this.foundLobby?.p2
        this.socket.emit('tictactoegameOver', { playerId: this.discordId, winner: winner.id })
      } else if (this.foundLobby?.sum === 10) {
        this.title = 'égalité'
        this.message = 'Personne ne gagne'
        this.socket.emit('tictactoegameOver', { playerId: this.discordId, winner: null })
      }
    },

    reload() {
      location.reload()
    },

    rankIcon,
    rankDiv,
  },
}
</script>

<template>
  <v-layout>
    <v-main
      class="d-flex"
      style="place-items: center; place-content: center; gap: 2em; flex-wrap: wrap"
    >
      <div class="mt-8">
        <h1 class="text-white" style="position: relative">Tic Tac Toe</h1>

        <v-btn
          v-if="!oppName"
          id="find"
          class="my-2"
          color="primary"
          text="Chercher un joueur"
          :loading="inQueue"
          :disabled="foundLobby !== null && foundLobby !== undefined"
          style="border-radius: 10px"
          @click="findPlayer"
        />
        <p v-if="!oppName" class="mb-3">
          {{ !oppName && queue.length > 0 ? `Dans la file d'attente :` : '&nbsp;' }}
          <span v-for="(p, index) in queue" :key="p">
            {{ index > 1 ? ',' : '' }}
            {{ p }}
          </span>
        </p>

        <div id="bigCont">
          <div id="cont">
            <v-btn
              v-for="i in 9"
              :id="'btn' + i"
              :key="i"
              class="btn text-black"
              :color="oppName ? 'primary' : '#ddd'"
              :disabled="!oppName"
              @click="boxClick(i)"
            ></v-btn>
          </div>
        </div>
      </div>
      <div class="mt-0" style="width: 300px">
        <p
          class="mb-3"
          style="display: flex; justify-content: start; align-items: center; gap: 1em"
        >
          <v-img v-if="elo" :src="rankIcon(elo)" max-width="20" height="20">
            <div
              :style="`position: absolute; display: flex; width: 100%; height: 100%; place-items: center; place-content: center; font-size: .8em; color: #222`"
            >
              <p style="font-weight: 400">{{ rankDiv(elo) }}</p>
            </div>
          </v-img>
          {{ elo ? elo + ' Elo' : 'Non Classé' }}
        </p>
        <div>
          <p v-if="oppName" id="oppNameCont" class="d-flex" style="place-items: end">
            Tu joues contre
            <span id="oppName" class="text-primary ml-1">@{{ oppName }}</span>
            <v-img
              :src="oppAvatar"
              class="ml-1"
              :min-width="25"
              :max-width="25"
              :height="25"
              rounded="xl"
            ></v-img>
          </p>
          <span
            v-if="oppName"
            class="font-italic"
            style="display: flex; align-items: center; justify-content: start; gap: 1em"
          >
            <v-img v-if="oppElo" :src="rankIcon(oppElo)" max-width="20" height="20">
              <div
                :style="`position: absolute; display: flex; width: 100%; height: 100%; place-items: center; place-content: center; font-size: .8em; color: #222`"
              >
                <p style="font-weight: 400">{{ rankDiv(oppElo) }}</p>
              </div>
            </v-img>
            {{ oppElo ? `${oppElo} Elo` : 'Non classé' }}
          </span>
        </div>
        <p v-if="oppName" id="valueCont">
          Tu joues les <span id="value" class="text-primary">{{ value }}</span>
        </p>
        <p v-if="oppName" id="whosTurn" class="pt-6">
          {{
            (foundLobby?.p2.id === discordId && foundLobby?.sum % 2 === 0) ||
            (foundLobby?.p1.id === discordId && foundLobby?.sum % 2 === 1)
              ? "C'est ton tour"
              : `C'est au tour de ${oppName}`
          }}
        </p>
      </div>
    </v-main>
    <v-progress-linear
      v-if="oppName && !title"
      v-model="timeLeft"
      style="position: fixed; left: 0"
    />

    <GameOverDialog
      :model-value="endGameDialog"
      :title="title"
      :message="message"
      :old-elo="eloBeforeGame"
      :new-elo="eloAfterGame"
      :games-played="gamesPlayedAfter"
      @close="reload"
    />

    <home-btn />
  </v-layout>
</template>

<style scoped>
#bigCont {
  border-radius: 20px;
  overflow: hidden;
  width: fit-content;
}
#cont {
  display: grid;
  width: fit-content;
  grid-template-columns: 1fr 1fr 1fr;
}
.btn {
  font-size: 2rem;
  width: 100px;
  height: 100px;
  cursor: pointer;
  margin: 0;
  border-radius: 0;
  border: 1px solid #18181877;
}

.back-btn {
  position: absolute;
  top: 1rem;
  left: 1rem;
  border-radius: 12px;
}
</style>
