<template>
  <div class="responsive-sidebar">
    <div class="sidebar-toggle" @click="toggleSidebar">
      <span>☰</span>
    </div>
    <aside class="sidebar" :class="{ open: isOpen }">
      <div class="sidebar-header">
        <div class="close-btn" @click="toggleSidebar">✕</div>
      </div>
      <slot></slot>
    </aside>
    <div class="sidebar-overlay" v-if="isOpen" @click="toggleSidebar"></div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'

const isOpen = ref(false)

const toggleSidebar = () => {
  isOpen.value = !isOpen.value
}

const closeSidebar = () => {
  isOpen.value = false
}

const checkScreenSize = () => {
  if (window.innerWidth > 900) {
    isOpen.value = false
  }
}

onMounted(() => {
  window.addEventListener('resize', checkScreenSize)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkScreenSize)
})

defineExpose({ closeSidebar })
</script>

<style scoped>
.responsive-sidebar {
  position: relative;
}

.sidebar-toggle {
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  background: var(--gc-green);
  color: white;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: none;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 101;
  box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  font-size: 24px;
}

.sidebar {
  position: sticky;
  top: 0;
  height: 100vh;
  background: #1a2e0a;
  transition: transform 0.3s ease;
}

.sidebar-header {
  display: none;
  justify-content: flex-end;
  padding: 1rem;
}

.close-btn {
  cursor: pointer;
  font-size: 1.5rem;
  color: #C0DD97;
}

.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  z-index: 99;
}

@media (max-width: 900px) {
  .sidebar-toggle {
    display: flex;
  }
  
  .sidebar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    top: auto;
    height: auto;
    max-height: 80vh;
    transform: translateY(100%);
    z-index: 100;
    overflow-y: auto;
  }
  
  .sidebar.open {
    transform: translateY(0);
  }
  
  .sidebar-header {
    display: flex;
  }
}
</style>