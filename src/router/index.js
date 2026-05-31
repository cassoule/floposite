import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Dashboard from '../views/Dashboard.vue'
import Callback from '../views/Callback.vue'
import TicTacToe from '../views/TicTacToe.vue'
import MonkeGame from '../views/MonkeGame.vue'
import Connect4 from '../views/Connect4.vue'
import PokerHome from '../views/PokerHome.vue'
import PokerRoom from '../views/PokerRoom.vue'
import Solitaire from '../views/Solitaire.vue'
import Sudoku from '../views/Sudoku.vue'
import Blackjack from '../views/Blackjack.vue'
import AkhyStats from '../views/AkhyStats.vue'
import Market from '../views/Market.vue'
import CaseOpening from '../views/CaseOpening.vue'
import SnakeMenu from '../views/SnakeMenu.vue'
import SnakeSolo from '../views/SnakeSolo.vue'
import SnakeVersus from '../views/SnakeVersus.vue'
import PaymentSuccess from '../views/PaymentSuccess.vue'
import CGV from '../views/CGV.vue'
import Privacy from '../views/Privacy.vue'
import TradeUp from '../views/TradeUp.vue'
import Inventory from '../views/Inventory.vue'
import Sicbo from '../views/SicboRoom.vue'
import Loadout from '../views/Loadout.vue'
import Crash from '../views/CrashRoom.vue'
import Maintenance from '../views/Maintenance.vue'
import { useMaintenanceStore } from '@/stores/maintenanceStore'


const routes = [
  { path: '/', component: Home },
  { path: '/dashboard', component: Dashboard },
  { path: '/auth/callback', name: 'auth-callback', component: Callback },
  { path: '/tic-tac-toe', component: TicTacToe },
  { path: '/monke-game', component: MonkeGame },
  { path: '/connect-4', component: Connect4 },
  { path: '/poker', component: PokerHome },
  { path: '/poker/:id', component: PokerRoom },
  { path: '/solitaire', component: Solitaire },
  { path: '/sudoku', component: Sudoku },
  { path: '/blackjack', component: Blackjack },
  { path: '/akhy/:id', component: AkhyStats },
  { path: '/market', component: Market },
  { path: '/cases', component: CaseOpening },
  { path: '/trade-up', component: TradeUp },
  { path: '/inventory', component: Inventory },
  { path: '/loadout', component: Loadout },
  { path: '/snake', component: SnakeMenu },
  { path: '/snake/solo', component: SnakeSolo },
  { path: '/snake/versus', component: SnakeVersus },
  { path: '/payment-success', component: PaymentSuccess },
  //{ path: '/erynies', component: EryniesHome },
  { path: '/cgv', component: CGV },
  { path: '/privacy', component: Privacy },
  { path: '/sicbo', component: Sicbo },
  { path: '/crash', component: Crash },
  { path: '/maintenance', name: 'Maintenance', component: Maintenance },

]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

// --- Global navigation guard for maintenance mode ---
router.beforeEach((to, from, next) => {
  const maintenanceStore = useMaintenanceStore()

  const allowedDuringMaintenance = ['Maintenance']

  if (maintenanceStore.active && !allowedDuringMaintenance.includes(to.name ?? '')) {
    next({ name: 'Maintenance' })
  } 
  else if (!maintenanceStore.active && to.name === 'Maintenance') {
    next({ path: '/' })
  } 
  // 3. Dans tous les autres cas, on laisse la navigation se faire normalement
  else {
    next()
  }
})
export default router
