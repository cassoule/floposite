<script>
import { io } from 'socket.io-client'
import axios from 'axios'

export default {
  async mounted() {
    this.discordId = localStorage.getItem('discordId')
    if (!this.discordId) this.$router.push('/')

    this.initSocket()

    this.elo = await this.getElo(this.discordId)
    this.elo_graph = await this.getEloGraph(this.discordId)
  },

  created() {
    this.interval = setInterval(() => {
      this.now = Date.now()
    }, 1000)
  },

  beforeDestroy() {
    clearInterval(this.interval)
  },

  data() {
    return {
      discordId: null,
      socket: null,
      playerName: null,

      allPlayersArray: [],
      queue: [],
      oppName: null,
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
    }
  },

  computed: {
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
        this.socket.emit('tictactoegameOver', { playerId: this.discordId, winner: winner.id })
        this.endGameDialog = true
      }
      return tl
    },
  },

  methods: {
    initSocket() {
      this.socket = io(import.meta.env.VITE_FLAPI_URL.replace('/api', ''), {
        withCredentials: false,
        extraHeaders: {
          'ngrok-skip-browser-warning': 'true',
        },
      })

      this.socket.emit('tictactoeconnection', { id: this.discordId })

      this.socket.on('tictactoequeue', async (e) => {
        this.allPlayersArray = e.allPlayers
        this.queue = e.queue

        this.foundLobby = this.allPlayersArray.find(
          (obj) => obj.p1.id === this.discordId || obj.p2.id === this.discordId,
        )

        this.oppName =
          this.foundLobby?.p1.id === this.discordId
            ? this.foundLobby?.p2.name
            : this.foundLobby?.p1.name
        this.playerName =
          this.foundLobby?.p1.id === this.discordId
            ? this.foundLobby?.p1.name
            : this.foundLobby?.p2.name
        this.value =
          this.foundLobby?.p1.id === this.discordId ? this.foundLobby?.p1.val : this.foundLobby?.p2.val

        this.inQueue = this.inQueue && (this.foundLobby === null || this.foundLobby === undefined)

        this.oppElo = await this.getElo(this.foundLobby?.p1.id === this.discordId ? this.foundLobby?.p2.id : this.foundLobby?.p1.id)

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
      })

      this.socket.on('tictactoeplaying', (e) => {
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
      })
    },

    async getElo(id) {
      const fetchUrl = import.meta.env.VITE_FLAPI_URL + '/user/' + id + '/elo'
      try {
        const response = await axios.get(fetchUrl)
        return response.data.elo
      } catch (e) {
        console.error('flAPI error:', e)
      }
    },

    async getEloGraph(id) {
      const fetchUrl = import.meta.env.VITE_FLAPI_URL + '/user/' + id + '/elo-graph'
      try {
        const response = await axios.get(fetchUrl)
        return response.data.elo_graph
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

    check(name, sum) {
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
        this.endGameDialog = true
      } else if (this.foundLobby?.sum === 10) {
        this.title = 'égalité'
        this.message = 'Personne ne gagne'
        this.socket.emit('tictactoegameOver', { playerId: this.discordId, winner: null })
        this.endGameDialog = true
      }
    },

    reload() {
      location.reload()
    }
  },
}
</script>

<template>
  <v-layout>
    <v-main class="d-flex" style="place-items: center; place-content: center; gap: 2em; flex-wrap: wrap">
      <div class="mt-8">

        <h1 class="text-white" style="position: relative;">
          Tic Tac Toe
        </h1>

        <v-btn
          v-if="!oppName"
          id="find"
          class="my-2 "
          color="primary"
          text="Chercher un joueur"
          :loading="inQueue"
          :disabled="foundLobby !== null && foundLobby !== undefined"
          style="border-radius: 10px"
          @click="findPlayer"
        />
        <p v-if="!oppName" class="mb-3">
          {{ !oppName && queue.length > 0 ? `Dans la file d'attente :` : '&nbsp' }}
          <span v-for="(p, index) in queue" :key="p">
            {{index > 1 ? ',' : ''}}
            {{ p }}
          </span>
        </p>

        <div id="bigCont">
          <div id="cont">
            <v-btn
              v-for="i in 9"
              :id="'btn' + i"
              class="btn text-black"
              :color="oppName ? 'primary' : '#ddd'"
              :disabled="!oppName"
              @click="boxClick(i)"
            ></v-btn>
          </div>
        </div>
      </div>
      <div class="mt-0" style="width: 300px">
        <p class="mb-3">FlopoElo : {{ this.elo ?? 'Non Classé' }}</p>
        <div>
          <p v-if="oppName" id="oppNameCont">
            Tu joues contre <span id="oppName" class="text-primary">{{ oppName }}</span>
          </p>
          <span v-if="oppName">{{ oppElo ? `${oppElo} FlopoElo` : 'non classé' }}</span>
        </div>
        <p v-if="oppName" id="valueCont">
          Tu joues les <span id="value" class="text-primary">{{ value }}</span>
        </p>
        <p v-if="oppName" id="whosTurn" class="pt-6">
          {{
            (this.foundLobby?.p2.id === this.discordId && this.foundLobby?.sum % 2 === 0) ||
            (this.foundLobby?.p1.id === this.discordId && this.foundLobby?.sum % 2 === 1)
              ? "C'est ton tour"
              : `C'est au tour de ${oppName}`
          }}
        </p>
      </div>
    </v-main>
    <v-progress-linear v-if="oppName && !title" v-model="timeLeft" style="position: fixed; left: 0"/>

    <v-dialog v-model="endGameDialog" persistent max-width="250">
      <v-card color="primary" style="border-radius: 15px">
        <v-card-title class="text-uppercase pt-4 pb-0">
          {{ title }}
        </v-card-title>
        <v-card-text class="px-4 py-0 font-weight-light">
          {{ message }}
        </v-card-text>
        <v-card-actions>
          <v-btn class="rounded-lg" text="Ok" variant="tonal" @click="endGameDialog = false" @click.stop="reload"></v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-btn class="back-btn text-none" text="Retour" variant="tonal" color="#ddd" @click="$router.push('/dashboard')"></v-btn>
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