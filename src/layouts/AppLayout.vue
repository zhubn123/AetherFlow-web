<template>
  <div class="app-layout" :style="{ '--nav-width': isNavCollapsed ? '88px' : '242px' }">
    <WmsNav />
    <main class="app-main">
      <AppTopbar />
      <div class="app-content">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import AppTopbar from '@/components/AppTopbar.vue'
import WmsNav from '@/components/WmsNav.vue'
import { useNavState } from '@/composables/useNavState'

const { isNavCollapsed } = useNavState()
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8fbff 0%, #f4f7fc 100%);
}

.app-main {
  min-height: 100vh;
  padding-left: var(--nav-width);
  display: flex;
  flex-direction: column;
  transition: padding-left 0.24s ease;
}

.app-content {
  flex: 1;
}

@media (max-width: 900px) {
  .app-main {
    padding-left: 0;
  }
}
</style>
