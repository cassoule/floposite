<template>
  <nav class="navbar">
    
    <button class="hamburger" @click="menuOpen = !menuOpen" aria-label="Menu">
      <span class="hamburger-line" :class="{ open: menuOpen }"></span>
      <span class="hamburger-line" :class="{ open: menuOpen }"></span>
      <span class="hamburger-line" :class="{ open: menuOpen }"></span>
    </button>

    <ul class="nav-links" :class="{ open: menuOpen }">
      <li v-for="link in links" :key="link.section">
        <a :href="'#' + link.section" class="nav-item" @click.prevent="menuOpen = false; scrollTo(link.section)">
          {{ link.name }}
        </a>
      </li>
    </ul>

    <div class="nav-actions">
      <button
        v-if="isLoggedIn"
        class="login-btn jouer-btn"
        @click="goToDashboard"
      >
        Jouer
      </button>
      <button
        v-else
        class="login-btn"
        @click="emit('open-login')"
      >
        Login
      </button>
    </div>

    <!-- Overlay mobile -->
    <div v-if="menuOpen" class="nav-overlay" @click="menuOpen = false"></div>

  </nav>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const menuOpen = ref(false)

defineProps({
  links: {
    type: Array,
    required: true
  },
  isLoggedIn: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['open-login'])
const router = useRouter()

const scrollTo = (sectionId) => {
  const el = document.getElementById(sectionId)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

const goToDashboard = () => {
  router.push('/dashboard')
}
</script>

<style scoped>
.navbar {
  display: flex;
  align-items: center;
  width: 100%;
  box-sizing: border-box;
  padding: 20px 48px;  
  background-color: transparent;
}

/* Partie Logo  (pour plus tard) */
/*
.logo-container {
  display: flex;
  align-items: center;
}
.logo-img {
  height: 40px;
  width: auto;
}
*/

.nav-links {
  display: flex;
  align-items: center;
  gap: 40px; /* gap: 10 dans Tailwind (40px) */
  list-style: none;
  margin: 0;
  padding: 0;
  margin-right: auto; 
}

.nav-item {
  font-family: 'Poppins', sans-serif;
  font-size: 20px;
  font-weight: 600;
  font-style: normal;
  line-height: normal;
  color: #e1dcdccd !important;
  text-decoration: none;
  transition: opacity 0.2s ease;
  opacity: 0.9;
}

.nav-item:hover, 
.router-link-active {
  opacity: 1;
}

.nav-actions {
  display: flex;
  align-items: center;
}

.login-btn {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  
  width: 184px;
  height: 40px;
  
  background: #FFFFFF;
  border-radius: 20px;
  border: none;
  
  box-shadow: 0px 4px 4px 0px rgba(0, 0, 0, 0.25);
  
  font-family: 'Poppins', sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: #000000 !important;
  text-decoration: none;
  
  cursor: pointer;
  transition: transform 0.1s ease;
}

.login-btn:active {
  transform: scale(0.98);
}

/* ─── Hamburger ─── */
.hamburger {
  display: none;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  z-index: 1100;
}

.hamburger-line {
  display: block;
  width: 24px;
  height: 2px;
  background: #fff;
  border-radius: 2px;
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.hamburger-line.open:nth-child(1) {
  transform: translateY(7px) rotate(45deg);
}
.hamburger-line.open:nth-child(2) {
  opacity: 0;
}
.hamburger-line.open:nth-child(3) {
  transform: translateY(-7px) rotate(-45deg);
}

/* ─── Overlay mobile ─── */
.nav-overlay {
  display: none;
}

/* ─── Mobile (≤ 968px) ─── */
@media (max-width: 968px) {
  .navbar {
    padding: 16px 24px;
    position: relative;
  }

  .hamburger {
    display: flex;
  }

  .nav-links {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100dvh;
    flex-direction: column;
    justify-content: center;
    gap: 32px;
    background: rgba(10, 10, 30, 0.97);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    z-index: 1050;
    margin-right: 0;
    transform: translateX(-100%);
    transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .nav-links.open {
    transform: translateX(0);
  }

  .nav-item {
    font-size: 24px;
    text-align: center;
    display: block;
    padding: 8px 0;
  }

  .nav-actions {
    margin-left: auto;
    z-index: 1100;
  }

  .login-btn {
    width: 130px;
    height: 36px;
    font-size: 14px;
  }

  .nav-overlay {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 1040;
  }
}
</style>
