<template>
  <div class="app-layout">
    <WmsNav />
    <main class="app-main">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import WmsNav from '@/components/WmsNav.vue'
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
  background: transparent;
}

.app-main {
  min-height: 100vh;
  padding-left: 242px;
}

@media (max-width: 900px) {
  .app-main {
    padding-left: 0;
  }
}
</style>
