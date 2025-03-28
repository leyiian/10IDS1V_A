<template>
  <v-app>
    <!-- Navigation Drawer component -->
    <NavigationDrawer v-model="drawer" />

    <!-- App Bar -->
    <v-app-bar color="primary">
      <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
      <v-toolbar-title>{{ currentPageTitle }}</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn @click="logout">
        <v-icon>@/assets/icons/logout.svg</v-icon>
        Cerrar Sesión
      </v-btn>
    </v-app-bar>

    <!-- Main Content -->
    <v-main>
      <v-container fluid>
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// Estado del drawer
const drawer = ref(false)

// Router
const route = useRoute()
const router = useRouter()

// Título dinámico basado en la ruta actual
const currentPageTitle = computed(() => {
  const path = route.path
  if (path.includes('/polizas')) return 'Gestión de Pólizas'
  if (path.includes('/clientes')) return 'Gestión de Clientes'
  if (path.includes('/facturas')) return 'Gestión de Facturas'
  if (path.includes('/servicios')) return 'Gestión de Servicios'
  return 'Panel Principal'
})

// Función de logout
const logout = () => {
  localStorage.removeItem('token')
  router.push('/')
}
</script>

<style scoped>
.v-main {
  background-color: #f5f5f5;
}
</style>
