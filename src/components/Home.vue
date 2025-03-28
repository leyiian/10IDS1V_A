<template>
  <v-app>
    <v-app-bar
      color="primary"
      elevation="2"
      height="64"
    >
      <v-app-bar-nav-icon
        @click="drawer = !drawer"
        class="ml-2"
      ></v-app-bar-nav-icon>

      <v-toolbar-title class="ml-4 text-h6 font-weight-medium">
        {{ currentPageTitle }}
      </v-toolbar-title>

      <v-spacer></v-spacer>

    </v-app-bar>

    <NavigationDrawer
      ref="navDrawer"
      :model-value="drawer"
      @update:model-value="drawer = $event"
    />

    <v-main class="bg-grey-lighten-4">
      <v-container fluid class="pa-6">
        <v-fade-transition mode="out-in">
          <router-view />
        </v-fade-transition>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import NavigationDrawer from '@/components/layout/NavigationDrawer.vue'

const drawer = ref(false)
const route = useRoute()
const router = useRouter()
const navDrawer = ref<InstanceType<typeof NavigationDrawer> | null>(null)

onMounted(() => {
  if (route.path === '/home' || route.path === '/home/') {
    router.push('/home/clientes')
  }
})

const currentPageTitle = computed(() => navDrawer.value?.currentTitle || 'Panel Principal')

</script>

<style scoped>
.v-app-bar {
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}

.v-main {
  transition: padding 0.2s ease-in-out;
}
</style>
