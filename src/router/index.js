import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Dashboard from '../views/Dashboard.vue'
import Callback from '../views/Callback.vue'
import TicTacToe from '../views/TicTacToe.vue'
import PokerHome from '../views/PokerHome.vue'
import PokerRoom from '../views/PokerRoom.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/dashboard', component: Dashboard },
  { path: '/callback', component: Callback },
  { path: '/tic-tac-toe', component: TicTacToe },
  { path: '/poker', component: PokerHome },
  { path: '/poker/:id', component: PokerRoom },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
