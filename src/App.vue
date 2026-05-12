<template>
  <div>
    <button
      v-if="showSidebarToggle"
      class="global-sidebar-toggle"
      type="button"
      :aria-expanded="sidebarOpen"
      aria-label="Toggle navigation"
      @click="toggleSidebar"
    >
      <span></span>
      <span></span>
      <span></span>
    </button>
    <div
      v-if="showSidebarToggle && sidebarOpen"
      class="global-sidebar-overlay"
      @click="closeSidebar"
    ></div>
    <router-view />
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
authStore.init()

const route = useRoute()
const sidebarOpen = ref(false)
const showSidebarToggle = computed(() =>
  route.meta.showShell !== false && (
    route.path.startsWith('/student') ||
    route.path.startsWith('/employer') ||
    route.path.startsWith('/admin')
  )
)

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
  document.body.classList.toggle('sidebar-open', sidebarOpen.value)
}

const closeSidebar = () => {
  sidebarOpen.value = false
  document.body.classList.remove('sidebar-open')
}

watch(() => route.fullPath, closeSidebar)
</script>
