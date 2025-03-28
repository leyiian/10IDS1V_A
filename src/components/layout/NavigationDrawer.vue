<template>
  <v-navigation-drawer
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :rail="rail"
    @click.capture="rail ? expandDrawer() : null"
    permanent
    :width="280"
    class="navigation-drawer"
  >
    <v-list>
      <v-list-item
        prepend-avatar="https://ui-avatars.com/api/?name=User"
        :title="userEmail"
        subtitle="Usuario"
      >
        <template v-slot:append>
          <v-btn
            variant="text"
            :icon="rail ? 'mdi-chevron-right' : 'mdi-chevron-left'"
            @click.stop="toggleRail"
          ></v-btn>
        </template>
      </v-list-item>
    </v-list>

    <v-divider></v-divider>

    <v-list density="comfortable" nav>
      <v-list-item
        v-for="(item, i) in menuItems"
        :key="i"
        :to="item.path"
        :prepend-icon="item.icon"
        :title="item.title"
        :value="item.path"
        :active="route.path.includes(item.path)"
        rounded="lg"
        class="ma-2"
      >
        <template v-slot:append>
          <v-icon v-if="!rail" size="small">mdi-chevron-right</v-icon>
        </template>
      </v-list-item>
    </v-list>

    <template v-slot:append>
      <v-divider></v-divider>
      <div class="pa-2">
        <v-btn
          block
          variant="tonal"
          prepend-icon="mdi-logout"
          @click="logout"
          :class="{ 'px-2': rail }"
        >
          {{ rail ? '' : 'Cerrar Sesión' }}
        </v-btn>
      </div>
    </template>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const props = defineProps<{
  modelValue: boolean
}>()

defineEmits<{
  'update:modelValue': [value: boolean]
  'logout': []
}>()

const rail = ref(false)
const route = useRoute()
const router = useRouter()
const userEmail = localStorage.getItem('userEmail') || 'usuario@ejemplo.com'

const menuItems = [
  {
    title: 'Gestión de Clientes',
    path: '/home/clientes',
    icon: 'mdi-account-group-outline'
  },
  {
    title: 'Gestión de Pólizas',
    path: '/home/polizas',
    icon: 'mdi-file-document-outline'
  },
  {
    title: 'Gestión de Facturas',
    path: '/home/facturas',
    icon: 'mdi-receipt-text-outline'
  },
  {
    title: 'Gestión de Servicios',
    path: '/home/servicios',
    icon: 'mdi-tools'
  }
]

const currentTitle = computed(() => {
  const currentPath = route.path
  const currentItem = menuItems.find(item => currentPath.includes(item.path))
  return currentItem?.title || 'Panel Principal'
})


const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('userEmail')  // Añadir esta línea
  router.push('/')
}

const toggleRail = () => {
  rail.value = !rail.value
}

const expandDrawer = () => {
  if (rail.value) {
    rail.value = false
  }
}

defineExpose({
  currentTitle
})
</script>

<style scoped>
.navigation-drawer {
  border-right: 1px solid rgba(255, 255, 255, 0.12);
}

.v-list-item {
  transition: all 0.2s ease-in-out;
  cursor: pointer;
}

.v-list-item--active {
  background-color: rgb(var(--v-theme-primary), 0.1);
}

.v-list-item:hover:not(.v-list-item--active) {
  background-color: rgba(255, 255, 255, 0.05);
}

/* Estilos para modo rail */
:deep(.v-navigation-drawer--rail) .v-list-item {
  justify-content: center;
  padding-inline: 0;
}
</style>
