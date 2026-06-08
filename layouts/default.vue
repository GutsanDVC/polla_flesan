<template>
  <div class="min-h-screen flex flex-col">
    <header class="bg-green-700 text-white shadow-lg sticky top-0 z-50">
      <nav class="container mx-auto px-4 py-3">
        <div class="flex items-center justify-between">
          <NuxtLink to="/" class="text-xl font-bold">
            {{ appName }}
          </NuxtLink>

          <div v-if="auth.isApproved" class="hidden md:flex items-center space-x-6">
            <NuxtLink to="/groups" class="hover:text-green-200 transition">Fase de Grupos</NuxtLink>
            <NuxtLink to="/bracket" class="hover:text-green-200 transition">Eliminatorias</NuxtLink>
            <NuxtLink to="/leaderboard" class="hover:text-green-200 transition">Clasificación</NuxtLink>
            <NuxtLink v-if="auth.isAdmin" to="/admin" class="bg-yellow-500 px-3 py-1 rounded text-sm hover:bg-yellow-600 transition">Admin</NuxtLink>
          </div>

          <div class="flex items-center space-x-4">
            <template v-if="auth.isAuthenticated">
              <div class="hidden md:flex items-center space-x-2">
                <img v-if="auth.user?.avatarUrl" :src="auth.user.avatarUrl" :alt="auth.user.fullName" class="w-8 h-8 rounded-full" />
                <span class="text-sm">{{ auth.user?.fullName }}</span>
                <button @click="auth.logout" class="text-sm hover:text-green-200">Salir</button>
              </div>
            </template>
            <template v-else>
              <NuxtLink to="/auth/login" class="text-sm hover:text-green-200 hidden md:block">Iniciar sesión</NuxtLink>
            </template>
            <button v-if="auth.isApproved" @click="toggleMobileMenu" class="md:hidden">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        <div v-if="mobileMenuOpen && auth.isApproved" class="md:hidden mt-4 pb-2 space-y-2">
          <NuxtLink to="/groups" class="block py-2 hover:text-green-200">Fase de Grupos</NuxtLink>
          <NuxtLink to="/bracket" class="block py-2 hover:text-green-200">Eliminatorias</NuxtLink>
          <NuxtLink to="/leaderboard" class="block py-2 hover:text-green-200">Clasificación</NuxtLink>
          <NuxtLink v-if="auth.isAdmin" to="/admin" class="block py-2 text-yellow-300">Admin</NuxtLink>
          <button @click="auth.logout" class="block py-2 text-left w-full">Cerrar sesión</button>
        </div>
      </nav>
    </header>

    <main class="flex-1 container mx-auto px-4 py-6">
      <slot />
    </main>

    <footer class="bg-gray-800 text-gray-400 py-4 text-center text-sm">
      <p>© 2026 {{ appName }} - FIFA World Cup</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
const config = useRuntimeConfig();
const appName = config.public.appName;
const auth = useAuthStore();
const mobileMenuOpen = ref(false);

function toggleMobileMenu() {
  mobileMenuOpen.value = !mobileMenuOpen.value;
}

if (import.meta.client && !auth.user && !auth.loading) {
  auth.fetchMe().catch(() => {});
}
</script>
