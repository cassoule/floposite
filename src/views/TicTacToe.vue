<script>
import { io } from 'socket.io-client'

export default {
  mounted() {
    this.discordId = localStorage.getItem('discordId')
    if (!this.discordId) this.$router.push('/')

    this.initSocket()
  },

  data() {
    return {
      discordId: null,
      socket: null,
      playerName: null,

      allPlayersArray: [],
      oppName: null,
      value: null,

      foundLobby: null,
    }
  },

  methods: {
    initSocket() {
      this.socket = io(import.meta.env.VITE_FLAPI_URL, {
        withCredentials: false,
        extraHeaders: {
          'ngrok-skip-browser-warning': 'true',
        }
      })

      this.socket.on('find', (e) => {
        this.allPlayersArray = e.allPlayers
        console.log(this.allPlayersArray)

        this.foundLobby = this.allPlayersArray.find(obj => obj.p1.p1name === this.playerName || obj.p2.p2name === this.playerName)

        this.oppName = this.foundLobby.p1.p1name === this.playerName ? this.foundLobby.p2.p2name : this.foundLobby.p1.p1name
        this.value = this.foundLobby.p1.p1name === this.playerName ? this.foundLobby.p1.p1value : this.foundLobby.p2.p2value
      })

      this.socket.on('playing', (e) => {
        this.foundLobby = (e.allPlayers).find(obj => obj.p1.p1name === this.playerName || obj.p2.p2name === this.playerName)

        console.log(this.foundLobby)

        let p1id = this.foundLobby.p1.p1move
        let p2id = this.foundLobby.p2.p2move

        if (p1id !== '') {
          document.getElementById(`btn${p1id}`).innerText = 'X'
          document.getElementById(`btn${p1id}`).disabled = true
          document.getElementById(`btn${p1id}`).style.color = 'black'
        } else if (p2id !== '') {
          document.getElementById(`btn${p2id}`).innerText = 'O'
          document.getElementById(`btn${p2id}`).disabled = true
          document.getElementById(`btn${p2id}`).style.color = 'black'
        }

        this.check(this.playerName, this.foundLobby.sum)
      })
    },

    findPlayer() {
      if (this.playerName !== null) {
        this.socket.emit('find', { name: this.playerName, id: this.discordId })
      }
    },

    boxClick(boxId) {
      this.socket.emit('playing', { value: this.value, boxId: boxId, name: this.playerName })
    },

    check(name, sum) {
      let b1 = document.getElementById(`btn1`).innerText === '' ? 'a' : document.getElementById('btn1').innerText
      let b2 = document.getElementById(`btn2`).innerText === '' ? 'b' : document.getElementById('btn2').innerText
      let b3 = document.getElementById(`btn3`).innerText === '' ? 'c' : document.getElementById('btn3').innerText
      let b4 = document.getElementById(`btn4`).innerText === '' ? 'd' : document.getElementById('btn4').innerText
      let b5 = document.getElementById(`btn5`).innerText === '' ? 'e' : document.getElementById('btn5').innerText
      let b6 = document.getElementById(`btn6`).innerText === '' ? 'f' : document.getElementById('btn6').innerText
      let b7 = document.getElementById(`btn7`).innerText === '' ? 'g' : document.getElementById('btn7').innerText
      let b8 = document.getElementById(`btn8`).innerText === '' ? 'h' : document.getElementById('btn8').innerText
      let b9 = document.getElementById(`btn9`).innerText === '' ? 'i' : document.getElementById('btn9').innerText

      if (
        (b1 === b2 && b2 === b3) || (b4 === b5 && b5 === b6) || (b7 === b8 && b8 === b9)
      || (b1 === b4 && b4 === b7) || (b2 === b5 && b5 === b8) || (b3 === b6 && b6 === b9)
      || (b1 === b5 && b5 === b9) || (b3 === b5 && b5 === b7)
      ) {
        this.socket.emit('gameOver', { name: this.playerName })

        setTimeout(() => {
          this.foundLobby?.sum % 2 === 0 ? alert('X won !!') : alert('O won !!')

          setTimeout(() => {
            location.reload()
          }, 2000)
        }, 100)
      }
      else if (this.foundLobby?.sum === 10) {
        this.socket.emit('gameOver', { name: this.playerName })

        setTimeout(() => {
          alert("It's a draw !!")

          setTimeout(() => {
            location.reload()
          }, 2000)
        }, 100)
      }
    }
  }
}
</script>

<template>
  <v-layout>
    <v-main>
      <h1>Tic Tac Toe</h1>
      <div>
        <p id="userCont">You : <span id="user">{{playerName}}</span></p>
        <p id="oppNameCont">Opponent : <span id="oppName">{{oppName}}</span></p>
      </div>
      <p id="valueCont">You are playing as <span id="value"></span></p>
      <p id="whosTurn">{{this.foundLobby?.sum % 2 === 0 ? 'O' : 'X'}}'s turn</p>

      <div>
        <p id="enterName">Enter your name :</p>
        <v-text-field v-model="playerName" label="Name"></v-text-field>
      </div>

      <v-btn id="find" text="Search for a player" @click="findPlayer"></v-btn>

      <div id="bigCont">
        <div id="cont">
          <button v-for="i in 9" :id="'btn'+i" class="btn" @click="boxClick(i)"></button>
        </div>
      </div>
    </v-main>

  </v-layout>
</template>

<style scoped>
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
</style>