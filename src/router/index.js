import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Dashboard from '../views/Dashboard.vue'
import Callback from '../views/Callback.vue'
import Game from '../views/GamePage.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/dashboard', component: Dashboard },
  { path: '/callback', component: Callback },
  { path: '/game', component: Game }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
