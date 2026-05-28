<template>
  <div class="landing-page">
    
    <Navbar :links="navLinks" :is-logged-in="isLoggedIn" @open-login="showLogin = true" />

    <LoginModal :visible="showLogin" @close="showLogin = false" />

    <section class="chat-section">
      <div class="chat-content">
        <h1 class="chat-title">Floposite</h1>
        <p class="chat-description">
          La plateforme ultime de jeux en ligne. Jouez à des grands classiques, 
          défiez vos rivaux dans des duels intenses en 1v1, et ouvrez des caisses de récompenses 
          exclusives pour bâtir votre empire de FlopoCoins.
        </p>
      </div>

      <div class="chat-image-container">
        <img src="/flopobot.webp" alt="Flopo Cat" class="chat-img" />
      </div>

      <div class="scroll-indicator">
        <span class="scroll-label">Scroll</span>
        <div class="scroll-line"></div>
      </div>
    </section>

    <GameSection 
      id="games"
      title="Jeux du jour" 
      description="Découvrez notre collection de jeux solo gratuits. Que vous vouliez passer le temps ou vous creuser la tête, lancez-vous directement dans une partie de Solitaire ou de Sudoku — sans inscription, juste du pur plaisir !"
      :games="dailyGames"
      :is-logged-in="isLoggedIn"
      @open-login="showLogin = true"
    />

    <GameSection 
      id="multiplayer"
      title="Arène 1v1 & Classements" 
      description="Défiez d'autres joueurs dans des duels classiques en temps réel. Gagnez des matchs, grimpez dans le classement et améliorez votre FlopoRank pour prouver que vous êtes le meilleur."
      :games="arenaGames"
      :is-logged-in="isLoggedIn"
      @open-login="showLogin = true"
    />
    <GameSection 
      id="gambling"
        title="Flopo Casino" 
        description="L'arène des gros joueurs. Prenez des risques, domptez la courbe du Crash, etlessivez vos adversaires au Flopoker. Que vous soyez plutôt stratégie au Blackjack ou pure intuition au Sic-Bo, venez bâtir votre empire de FlopoCoins."
        :games="casinoGames"
        :is-logged-in="isLoggedIn"
        @open-login="showLogin = true"
        />

    <GameSection 
      id="loot-trade"
      title="Butinez, échangez et personnalisez" 
      description="Déballez des skins rares, gérez votre inventaire personnel et échangez des objets avec d'autres joueurs sur le FlopoMarket officiel."
      :games="lootTradeGames"
      :is-logged-in="isLoggedIn"
      @open-login="showLogin = true"
    />

    <footer class="home-footer">
      <p class="footer-copy">&copy; 2026 Floposite. Tous droits réservés.</p>
      <div class="footer-links">
        <a href="/cgv">Conditions Générales de Vente</a>
        <a href="/privacy">Politique de Confidentialité</a>
      </div>
    </footer>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import Navbar from '@/components/Navbar.vue'
import LoginModal from '@/components/LoginModal.vue'
import GameSection from '@/components/GameSection.vue'

const showLogin = ref(false)
const isLoggedIn = computed(() => {
  return !!(localStorage.getItem('discordId') && localStorage.getItem('token'))
})

const navLinks = ref([
  { name: 'Jeux', section: 'games' },
  { name: 'Multijoueur', section: 'multiplayer' },
  { name: 'Gambling', section: 'gambling' },
  { name: 'Loot & Trade', section: 'loot-trade' }
])

const dailyGames = ref([
  { title: 'Solitaire', image: '/game_illu_sol.png', buttonText: 'Jouer', buttonType: 'purple', to: '/solitaire' },
  { title: 'Sudoku', image: '/game_illu_sudoku.png', buttonText: 'Jouer', buttonType: 'purple', to: '/sudoku' },
])

const arenaGames = ref([
  { title: 'Puissance 4', image: '/game_illu_c4.png', buttonText: 'Jouer', buttonType: 'purple', to: '/connect-4', requiresAuth: true },
  { title: 'Morpion', image: '/game_illu_ttt.png', buttonText: 'Jouer', buttonType: 'purple', to: '/tic-tac-toe', requiresAuth: true },
  { title: 'Monke', image: '/game_illu_mg.png', buttonText: 'Jouer', buttonType: 'purple', to: '/monke-game', requiresAuth: true },
  { title: 'Snake', image: '/game_illu_snake.png', buttonText: 'Jouer', buttonType: 'purple', to: '/snake', requiresAuth: true }
])
const casinoGames = ref([
  { title: 'Blackjack', image: '/game_illu_bj.png', buttonText: 'Jouer', buttonType: 'purple', to: '/blackjack', requiresAuth: true },
  { title: 'Sic-Bo', image: '/game_illu_sicbo.png', buttonText: 'Jouer', buttonType: 'purple', to: '/sicbo', requiresAuth: true },
  { title: 'Crash', image: '/game_illu_crash.png', buttonText: 'Jouer', buttonType: 'purple', to: '/crash', requiresAuth: true },
  { title: 'Flopoker', image: '/game_illu_poker.png', buttonText: 'Jouer', buttonType: 'purple', to: '/poker', requiresAuth: true }
])

const lootTradeGames = ref([
  { title: 'Caisses', image: '/caisse_illu.png', buttonText: 'Ouvrir', buttonType: 'purple', to: '/cases', requiresAuth: true },
  { title: 'Skin Up', image: '/tradeup_illu.png', buttonText: 'Upgrader', buttonType: 'purple', to: '/trade-up', requiresAuth: true },
  { title: 'Market', image: '/market_illu.png', buttonText: 'Explorer', buttonType: 'purple', to: '/market', requiresAuth: true },
  { title: 'Inventaire', image: '/inventaire_illu.png', buttonText: 'Voir', buttonType: 'purple', to: '/inventory', requiresAuth: true }
])
</script>

<style scoped>
.landing-page { width: 100%; min-height: 100vh; display: flex; flex-direction: column; }
.chat-section { position: relative; display: flex; align-items: center; justify-content: space-between; width: 100%; max-width: 1200px; margin: 0 auto; padding: 0 48px; box-sizing: border-box; gap: 60px; height: calc(100vh - 80px); }
.chat-content { flex: 1; display: flex; flex-direction: column; gap: 32px; }
.chat-title { color: #FFF; font-family: 'Poppins', sans-serif; font-size: 100px; font-weight: 600; line-height: 1; margin: 0; }
.chat-description { color: #FFF; font-family: 'Poppins', sans-serif; font-size: 20px; font-weight: 500; line-height: 1.6; max-width: 560px; opacity: 0.75; margin: 0; }
.chat-image-container { flex: 1; display: flex; justify-content: center; align-items: center; max-width: 350px; }
.chat-img { width: 100%; max-width: 350px; height: auto; object-fit: contain; animation: float 4s ease-in-out infinite; }

@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-18px); } }

.scroll-indicator { position: absolute; bottom: 32px; left: 50%; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; gap: 8px; animation: fadeInUp 1s ease 0.6s both; }
.scroll-label { color: #fff; font-family: 'Poppins', sans-serif; font-size: 11px; font-weight: 500; letter-spacing: 0.2em; text-transform: uppercase; opacity: 0.45; }
.scroll-line { width: 1px; height: 48px; background: linear-gradient(to bottom, rgba(255,255,255,0.5), transparent); animation: scrollPulse 2s ease-in-out infinite; }

@keyframes scrollPulse { 0% { opacity: 0; transform: scaleY(0); transform-origin: top; } 50% { opacity: 1; transform: scaleY(1); } 100% { opacity: 0; transform: scaleY(1); transform-origin: bottom; } }
@keyframes fadeInUp { from { opacity: 0; transform: translateX(-50%) translateY(12px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }

.home-footer {
  width: 100%;
  margin-top: 80px;
  padding: 48px 48px 24px;
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: baseline;
}

.footer-copy {
  color: #ddd;
  font-family: 'Poppins', sans-serif;
  font-size: 14px;
  margin: 0;
  padding-right: 24px;
}

.home-footer .footer-links {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
}

.home-footer .footer-links a {
  color: #dddddd77;
  font-family: 'Poppins', sans-serif;
  font-size: 14px;
  text-decoration: none;
  line-height: 0.95em;
  transition: color 0.2s ease;
}

.home-footer .footer-links a:hover {
  color: #ddd;
}

/* ─── Mobile ─── */
@media (max-width: 968px) {
  .chat-section { flex-direction: column-reverse; text-align: center; padding: 20px 24px 80px; gap: 32px; height: calc(100svh - 70px); justify-content: center; }
  .chat-title { font-size: 64px; }
  .chat-description { margin: 0 auto; }
  .chat-image-container { max-width: 220px; }
  .scroll-indicator { bottom: 20px; }
  .home-footer { flex-direction: column; gap: 16px; padding: 32px 24px 16px; }
  .home-footer .footer-links { flex-direction: column; gap: 16px; }
}
</style>
