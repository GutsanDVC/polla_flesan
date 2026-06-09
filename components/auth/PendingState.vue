<template>
  <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center space-y-4">
    <div class="mx-auto w-14 h-14 rounded-full bg-yellow-100 flex items-center justify-center">
      <svg class="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
    <h2 class="text-xl font-semibold text-yellow-800">Cuenta creada — Pendiente de pago</h2>
    <p class="text-yellow-700">
      Hola <strong>{{ userName }}</strong>, tu cuenta fue creada correctamente.
      Para comenzar a jugar debes transferir la cuota de incorporación y enviar el comprobante.
    </p>

    <div class="bg-white border border-yellow-300 rounded-lg p-5 text-left space-y-3 max-w-md mx-auto">
      <h3 class="font-semibold text-gray-800 text-center">Datos para la transferencia</h3>

      <div class="space-y-2 text-sm">
        <div class="flex justify-between">
          <span class="text-gray-500">Nombre:</span>
          <span class="font-medium text-gray-800">BASTIAN EDUARDO GUTIERREZ SANCHEZ</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-500">RUT:</span>
          <span class="font-medium text-gray-800">16.922.258-4</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-500">Banco:</span>
          <span class="font-medium text-gray-800">Tenpo</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-500">Tipo de cuenta:</span>
          <span class="font-medium text-gray-800">Cuenta Vista</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-500">Número de cuenta:</span>
          <span class="font-medium text-gray-800">111116922258</span>
        </div>
      </div>
    </div>

    <div class="bg-white border border-yellow-300 rounded-lg p-5 text-left space-y-2 max-w-md mx-auto">
      <h3 class="font-semibold text-gray-800 text-center">Enviar comprobante</h3>
      <p class="text-sm text-gray-600">
        Envía el comprobante de transferencia a:
      </p>
      <p class="text-sm font-medium text-gray-800 text-center">
        <a href="mailto:desarrollo@flesan.cl?subject=Inscripci%C3%B3n%20Polla%20Flesan" class="text-green-600 underline hover:text-green-700">
          desarrollo@flesan.cl
        </a>
      </p>
      <p class="text-sm text-gray-600 text-center">
        Asunto: <strong>"Inscripción Polla Flesan"</strong>
      </p>
      <p class="text-xs text-gray-500 text-center mt-2">
        Una vez verificado el pago, tu cuenta será aprobada automáticamente.
      </p>
    </div>

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
