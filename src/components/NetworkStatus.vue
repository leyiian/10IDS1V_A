<template>
  <div>
    <v-snackbar
      v-model="showSnackbar"
      :color="isOnline && isServerAvailable ? 'success' : 'warning'"
      :timeout="isOnline ? 3000 : -1"
      location="top"
    >
      <div class="d-flex align-center">
        <v-icon
          :icon="!isOnline ? 'mdi-wifi-off' : !isServerAvailable ? 'mdi-server-network-off' : 'mdi-wifi'"
          class="mr-2"
        />
        {{ message }}
      </div>
    </v-snackbar>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { networkStatus } from '../utils/networkStatus'
import axiosInstance from '../config/axios'

// WebSocket connection status
let viteWebSocket: WebSocket | null = null
let wsReconnectTimer: number | null = null

const showSnackbar = ref(false)
const isOnline = ref(true)
const isServerAvailable = ref(true)
const canInstall = ref(false)
const message = ref('')

// Evento de instalación diferida
let deferredPrompt: any = null

const checkServerStatus = async () => {
  try {
    await axiosInstance.get('/health')
    isServerAvailable.value = true
    if (isOnline.value) {
      message.value = 'Conexión restaurada'
      showSnackbar.value = true
    }
  } catch (error: any) {
    isServerAvailable.value = false
    if (error.type === 'connection_refused') {
      message.value = 'No se puede acceder al servidor - Conexión rechazada'
    } else if (error.type === 'timeout') {
      message.value = 'Tiempo de espera agotado al conectar con el servidor'
    } else if (error.type === 'server_down') {
      message.value = 'Servidor no disponible - Modo offline activado'
    } else {
      message.value = 'Error de conexión - Modo offline activado'
    }
    showSnackbar.value = true
  }
}

const updateNetworkStatus = async (online: boolean, serverAvailable?: boolean) => {
  isOnline.value = online
  if (serverAvailable !== undefined) {
    isServerAvailable.value = serverAvailable
  }

  if (!online) {
    message.value = 'Sin conexión a internet - Modo offline activado'
    isServerAvailable.value = false
  } else if (!isServerAvailable.value) {
    message.value = 'Sin conexión al servidor - Modo offline activado'
  } else {
    message.value = 'Conexión restaurada'
    connectViteWebSocket()
  }
  showSnackbar.value = true
}

const connectViteWebSocket = () => {
  if (viteWebSocket) {
    viteWebSocket.close()
  }

  try {
    viteWebSocket = new WebSocket('ws://localhost:5173')

    viteWebSocket.addEventListener('open', () => {
      console.log('Vite WebSocket conectado')
      if (wsReconnectTimer) {
        clearInterval(wsReconnectTimer)
        wsReconnectTimer = null
      }
    })

    viteWebSocket.addEventListener('close', () => {
      console.log('Vite WebSocket desconectado')
      message.value = 'Conexión con el servidor de desarrollo perdida'
      showSnackbar.value = true

      // Intentar reconectar cada 5 segundos
      if (!wsReconnectTimer) {
        wsReconnectTimer = window.setInterval(() => {
          if (isOnline.value && isServerAvailable.value) {
            connectViteWebSocket()
          }
        }, 5000)
      }
    })

    viteWebSocket.addEventListener('error', (error) => {
      console.error('Error en Vite WebSocket:', error)
    })
  } catch (error) {
    console.error('Error al crear WebSocket:', error)
  }
}

const installApp = async () => {
  if (!deferredPrompt) return

  try {
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      canInstall.value = false
    }
  } catch (error) {
    console.error('Error al instalar la app:', error)
  }

  deferredPrompt = null
}

onMounted(async () => {
  // Escuchar cambios en el estado de la red
  networkStatus.addListener(updateNetworkStatus)
  // Iniciar conexión WebSocket
  if (isOnline.value && isServerAvailable.value) {
    connectViteWebSocket()
  }

  // Verificar si la app puede ser instalada
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e
    canInstall.value = true
  })

  // Verificar estado inicial
  isOnline.value = networkStatus.getOnlineStatus()
  isServerAvailable.value = networkStatus.getServerStatus()

  if (!isOnline.value) {
    message.value = 'Sin conexión - Modo offline activado'
    showSnackbar.value = true
  } else if (!isServerAvailable.value) {
    message.value = 'Sin conexión al servidor - Modo offline activado'
    showSnackbar.value = true
  }
})

onUnmounted(() => {
  networkStatus.removeListener(updateNetworkStatus)
  if (viteWebSocket) {
    viteWebSocket.close()
  }
  if (wsReconnectTimer) {
    clearInterval(wsReconnectTimer)
  }
})

</script>

<style scoped>
.install-button {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 100;
}
</style>