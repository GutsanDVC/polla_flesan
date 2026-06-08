<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold text-green-700">Panel de Administración</h1>

    <div class="grid md:grid-cols-3 gap-4">
      <NuxtLink to="/admin/matches" class="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
        <h3 class="font-semibold text-lg">Resultados</h3>
        <p class="text-gray-600 text-sm">Ingresar resultados de partidos</p>
      </NuxtLink>

      <NuxtLink to="/admin/users" class="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
        <h3 class="font-semibold text-lg">Usuarios</h3>
        <p class="text-gray-600 text-sm">Aprobar y gestionar usuarios</p>
      </NuxtLink>

      <NuxtLink to="/admin/bracket" class="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
        <h3 class="font-semibold text-lg">Emparejamientos</h3>
        <p class="text-gray-600 text-sm">Confirmar llaves de eliminatorias</p>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' });
</script>
