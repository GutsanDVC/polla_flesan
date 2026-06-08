<template>
  <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center space-y-4">
    <div class="mx-auto w-14 h-14 rounded-full bg-yellow-100 flex items-center justify-center">
      <svg class="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
    <h2 class="text-xl font-semibold text-yellow-800">Esperando aprobación</h2>
    <p class="text-yellow-700">
      Hola <strong>{{ userName }}</strong>, tu cuenta fue creada pero aún no fue aprobada por el administrador.
      Te avisaremos por email cuando puedas empezar a jugar.
    </p>
    <div class="text-sm text-yellow-600">
      Próxima verificación automática en {{ countdown }}s
    </div>
    <button
      type="button"
      class="text-sm text-yellow-700 underline hover:text-yellow-900"
      @click="checkNow"
    >
      Verificar ahora
    </button>
    <div>
      <button
        type="button"
        class="text-sm text-gray-500 underline hover:text-gray-700"
        @click="logout"
      >
        Cerrar sesión
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const auth = useAuthStore();
const router = useRouter();

const props = defineProps<{ userName: string }>();
const countdown = ref(30);
let timer: ReturnType<typeof setInterval> | null = null;

function startPolling() {
  stopPolling();
  countdown.value = 30;
  timer = setInterval(async () => {
    countdown.value -= 1;
    if (countdown.value <= 0) {
      await checkNow();
    }
  }, 1000);
}

function stopPolling() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

async function checkNow() {
  await auth.fetchMe();
  if (auth.isApproved) {
    stopPolling();
    await router.push('/groups');
  } else if (auth.isBlocked) {
    stopPolling();
    await router.push('/auth/blocked');
  } else {
    countdown.value = 30;
  }
}

async function logout() {
  stopPolling();
  await auth.logout();
}

onMounted(startPolling);
onBeforeUnmount(stopPolling);
</script>
