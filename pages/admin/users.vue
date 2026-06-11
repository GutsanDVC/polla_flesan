<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-green-700">Gestión de Usuarios</h1>
      <button
        @click="openIncompletePreview"
        :disabled="loadingPreview"
        :class="[
          'px-4 py-2 rounded-lg text-sm font-semibold transition',
          loadingPreview
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-orange-600 text-white hover:bg-orange-700'
        ]"
      >
        {{ loadingPreview ? 'Cargando...' : '📧 Notificar incompletos' }}
      </button>
    </div>

    <div v-if="notifyResult" :class="[
      'px-4 py-3 rounded text-sm',
      notifyResult.sent > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
    ]">
      {{ notifyResult.message }}
      <span v-if="notifyResult.total > 0" class="block text-xs mt-1 text-gray-500">
        {{ notifyResult.total }} usuario(s) con predicciones pendientes
      </span>
    </div>

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
            <th class="text-left py-3 px-4">Pago</th>
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
            <td class="py-3 px-4">
              <span :class="paymentClass(user.payment_status)">{{ user.payment_status }}</span>
              <a
                v-if="user.payment_receipt_url"
                :href="user.payment_receipt_url"
                target="_blank"
                class="ml-2 text-xs text-blue-600 underline"
              >ver comprobante</a>
            </td>
            <td class="py-3 px-4 text-right space-x-2">
              <button
                v-if="user.status === 'PENDING'"
                @click="openApproveModal(user)"
                class="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
              >
                Aprobar
              </button>
              <button
                v-if="user.status === 'APPROVED' && user.payment_status === 'UNPAID'"
                @click="openMarkPaidModal(user)"
                class="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
              >
                Marcar pagado
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

    <!-- Incomplete Users Preview Modal -->
    <div v-if="previewModal.show" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-lg space-y-4 max-h-[80vh] overflow-y-auto">
        <h3 class="text-lg font-semibold text-gray-800">Usuarios con predicciones pendientes</h3>

        <div v-if="previewModal.sending" class="text-center py-4">
          <p class="text-gray-500">Enviando correos...</p>
        </div>

        <template v-else-if="previewModal.users.length > 0">
          <p class="text-sm text-gray-600">
            Se enviará un correo de recordatorio a <strong>{{ previewModal.users.length }}</strong> usuario(s):
          </p>

          <table class="w-full text-sm">
            <thead>
              <tr class="text-xs text-gray-500 border-b">
                <th class="px-3 py-2 text-left">Nombre</th>
                <th class="px-3 py-2 text-left">Email</th>
                <th class="px-3 py-2 text-center">Pendientes</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in previewModal.users" :key="user.id" class="border-b last:border-0">
                <td class="px-3 py-2 font-medium text-gray-700">{{ user.full_name }}</td>
                <td class="px-3 py-2 text-gray-500">{{ user.email }}</td>
                <td class="px-3 py-2 text-center">
                  <span class="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs font-semibold">
                    {{ user.pending_matches - user.predicted_pending }} de {{ user.pending_matches }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </template>

        <div v-else class="text-center py-4">
          <p class="text-green-600 font-medium">Todos los usuarios tienen sus predicciones completas</p>
        </div>

        <div v-if="previewModal.result" :class="[
          'px-3 py-2 rounded text-sm',
          previewModal.result.sent > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
        ]">
          {{ previewModal.result.message }}
        </div>

        <div class="flex justify-end space-x-2 pt-2">
          <button
            @click="previewModal.show = false"
            class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            Cerrar
          </button>
          <button
            v-if="previewModal.users.length > 0 && !previewModal.result"
            @click="sendFromPreview"
            :disabled="previewModal.sending"
            :class="[
              'px-4 py-2 text-sm rounded font-semibold transition',
              previewModal.sending
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-orange-600 text-white hover:bg-orange-700'
            ]"
          >
            {{ previewModal.sending ? 'Enviando...' : 'Enviar correos' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Approve Modal -->
    <div v-if="approveModal.show" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-md space-y-4">
        <h3 class="text-lg font-semibold text-gray-800">Aprobar usuario</h3>
        <p class="text-sm text-gray-600">
          Aprobar a <strong>{{ approveModal.user?.full_name }}</strong> ({{ approveModal.user?.email }})
        </p>
        <div class="space-y-3">
          <label class="flex items-center space-x-2">
            <input
              v-model="approveModal.paid"
              type="checkbox"
              class="rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <span class="text-sm text-gray-700">Pago recibido</span>
          </label>
          <div v-if="approveModal.paid">
            <label class="block text-sm text-gray-600 mb-1">URL del comprobante (opcional)</label>
            <input
              v-model="approveModal.receiptUrl"
              type="url"
              placeholder="https://..."
              class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </div>
        <div class="flex justify-end space-x-2 pt-2">
          <button
            @click="approveModal.show = false"
            class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            Cancelar
          </button>
          <button
            @click="confirmApprove"
            class="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700"
          >
            Aprobar
          </button>
        </div>
      </div>
    </div>

    <!-- Mark Paid Modal -->
    <div v-if="markPaidModal.show" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-md space-y-4">
        <h3 class="text-lg font-semibold text-gray-800">Marcar como pagado</h3>
        <p class="text-sm text-gray-600">
          Registrar pago de <strong>{{ markPaidModal.user?.full_name }}</strong>
        </p>
        <div>
          <label class="block text-sm text-gray-600 mb-1">URL del comprobante (opcional)</label>
          <input
            v-model="markPaidModal.receiptUrl"
            type="url"
            placeholder="https://..."
            class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div class="flex justify-end space-x-2 pt-2">
          <button
            @click="markPaidModal.show = false"
            class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            Cancelar
          </button>
          <button
            @click="confirmMarkPaid"
            class="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' });

const users = ref<any[]>([]);
const loading = ref(true);
const loadingPreview = ref(false);
const notifyResult = ref<{ sent: number; errors: number; total: number; message: string } | null>(null);

const previewModal = ref({
  show: false,
  users: [] as any[],
  sending: false,
  result: null as { sent: number; errors: number; total: number; message: string } | null,
});

const approveModal = ref({
  show: false,
  user: null as any,
  paid: false,
  receiptUrl: '',
});

const markPaidModal = ref({
  show: false,
  user: null as any,
  receiptUrl: '',
});

onMounted(async () => {
  try {
    users.value = await $fetch<any[]>('/api/admin/users');
  } catch (error) {
    console.error('Error fetching users:', error);
  } finally {
    loading.value = false;
  }
});

function openApproveModal(user: any) {
  approveModal.value = { show: true, user, paid: false, receiptUrl: '' };
}

function openMarkPaidModal(user: any) {
  markPaidModal.value = { show: true, user, receiptUrl: user.payment_receipt_url || '' };
}

async function confirmApprove() {
  const { user, paid, receiptUrl } = approveModal.value;
  try {
    await $fetch(`/api/admin/users/${user.id}/status`, {
      method: 'PATCH',
      body: {
        status: 'APPROVED',
        payment_status: paid ? 'PAID' : 'UNPAID',
        payment_receipt_url: receiptUrl || null,
      },
    });
    user.status = 'APPROVED';
    user.payment_status = paid ? 'PAID' : 'UNPAID';
    user.payment_receipt_url = receiptUrl || null;
    approveModal.value.show = false;
  } catch (error: any) {
    alert(error?.data?.statusMessage || error?.statusMessage || 'Error al aprobar');
  }
}

async function confirmMarkPaid() {
  const { user, receiptUrl } = markPaidModal.value;
  try {
    await $fetch(`/api/admin/users/${user.id}/status`, {
      method: 'PATCH',
      body: {
        status: user.status,
        payment_status: 'PAID',
        payment_receipt_url: receiptUrl || null,
      },
    });
    user.payment_status = 'PAID';
    user.payment_receipt_url = receiptUrl || null;
    markPaidModal.value.show = false;
  } catch (error: any) {
    alert(error?.data?.statusMessage || error?.statusMessage || 'Error al actualizar pago');
  }
}

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

async function openIncompletePreview() {
  loadingPreview.value = true;
  notifyResult.value = null;
  try {
    const incompleteUsers = await $fetch<any[]>('/api/admin/incomplete-users');
    previewModal.value = {
      show: true,
      users: incompleteUsers,
      sending: false,
      result: null,
    };
  } catch (error: any) {
    notifyResult.value = {
      sent: 0,
      errors: 1,
      total: 0,
      message: error?.data?.statusMessage || 'Error al cargar usuarios pendientes',
    };
  } finally {
    loadingPreview.value = false;
  }
}

async function sendFromPreview() {
  previewModal.value.sending = true;
  try {
    const result = await $fetch<{
      sent: number;
      errors: number;
      total: number;
      message: string;
    }>('/api/admin/notify-incomplete', { method: 'POST' });
    previewModal.value.result = result;
    notifyResult.value = result;
  } catch (error: any) {
    previewModal.value.result = {
      sent: 0,
      errors: 1,
      total: 0,
      message: error?.data?.statusMessage || 'Error al enviar notificaciones',
    };
  } finally {
    previewModal.value.sending = false;
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

function paymentClass(status: string) {
  switch (status) {
    case 'PAID': return 'text-green-600 font-medium';
    case 'UNPAID': return 'text-red-600 font-medium';
    default: return 'text-gray-600';
  }
}
</script>
