<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold text-green-700">Gestión de Usuarios</h1>

    <div v-if="loading" class="text-center py-8">
      <p class="text-gray-500">Cargando usuarios...</p>
    </div>

    <div v-else class="bg-white rounded-lg shadow-md overflow-hidden">
      <table class="w-full">
        <thead class="bg-gray-50 border-b">
          <tr>
            <th class="text-left py-3 px-4">Nombre</th>
            <th class="text-left py-3 px-4">Email</th>
            <th class="text-left py-3 px-4">Rol</th>
            <th class="text-left py-3 px-4">Estado</th>
            <th class="text-right py-3 px-4">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id" class="border-b last:border-0">
            <td class="py-3 px-4">{{ user.full_name }}</td>
            <td class="py-3 px-4">{{ user.email }}</td>
            <td class="py-3 px-4">{{ user.role }}</td>
            <td class="py-3 px-4">
              <span :class="statusClass(user.status)">{{ user.status }}</span>
            </td>
            <td class="py-3 px-4 text-right space-x-2">
              <button
                v-if="user.status === 'PENDING'"
                @click="updateUserStatus(user.id, 'APPROVED')"
                class="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
              >
                Aprobar
              </button>
              <button
                v-if="user.status === 'APPROVED'"
                @click="updateUserStatus(user.id, 'BLOCKED')"
                class="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
              >
                Bloquear
              </button>
              <button
                v-if="user.status === 'BLOCKED'"
                @click="updateUserStatus(user.id, 'APPROVED')"
                class="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
              >
                Reactivar
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' });

const users = ref<any[]>([]);
const loading = ref(true);

onMounted(async () => {
  try {
    users.value = await $fetch<any[]>('/api/admin/users');
  } catch (error) {
    console.error('Error fetching users:', error);
  } finally {
    loading.value = false;
  }
});

async function updateUserStatus(userId: string, status: string) {
  try {
    await $fetch(`/api/admin/users/${userId}/status`, {
      method: 'PATCH',
      body: { status },
    });
    const user = users.value.find((u) => u.id === userId);
    if (user) user.status = status;
  } catch (error: any) {
    alert(error?.data?.statusMessage || error?.statusMessage || error?.message || 'Error al actualizar usuario');
  }
}

function statusClass(status: string) {
  switch (status) {
    case 'APPROVED': return 'text-green-600 font-medium';
    case 'PENDING': return 'text-yellow-600 font-medium';
    case 'BLOCKED': return 'text-red-600 font-medium';
    default: return 'text-gray-600';
  }
}
</script>
