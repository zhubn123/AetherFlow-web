<template>
  <div class="not-found-page">
    <section class="not-found-card">
      <span class="eyebrow">404</span>
      <h1>页面不存在</h1>
      <p>{{ message }}</p>

      <div class="actions">
        <el-button type="primary" @click="goPrimary">前往{{ primaryActionLabel }}</el-button>
        <el-button @click="goPrevious">返回上一页</el-button>
      </div>

      <p v-if="missingPath" class="hint">
        请求路径：{{ missingPath }}
      </p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const missingPath = computed(() => normalizeQueryValue(route.query.path))

const message = computed(() => {
  return '你访问的地址可能已经变更、输入有误，或者当前版本还没有这个页面入口。'
})

const primaryActionLabel = computed(() => {
  return userStore.isLoggedIn ? '首页' : '登录页'
})

function goPrimary(): void {
  void router.push(userStore.isLoggedIn ? '/dashboard' : '/login')
}

function goPrevious(): void {
  if (window.history.length > 1) {
    router.back()
    return
  }
  goPrimary()
}

function normalizeQueryValue(value: unknown): string {
  if (typeof value === 'string') {
    return value
  }
  if (Array.isArray(value) && typeof value[0] === 'string') {
    return value[0]
  }
  return ''
}
</script>

<style scoped>
.not-found-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
}

.not-found-card {
  width: min(620px, 100%);
  padding: 40px 32px;
  border: 1px solid var(--af-border);
  border-radius: 24px;
  background:
    radial-gradient(circle at top right, rgba(214, 160, 43, 0.14), transparent 42%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.9));
  box-shadow: var(--af-shadow);
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(214, 160, 43, 0.16);
  color: #8b6210;
  font-size: 12px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.not-found-card h1 {
  margin: 18px 0 10px;
  color: var(--af-ink);
  font-size: clamp(28px, 4vw, 36px);
  line-height: 1.15;
}

.not-found-card p {
  margin: 0;
  color: var(--af-text-2);
  font-size: 15px;
  line-height: 1.7;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 24px;
}

.hint {
  margin-top: 18px;
  color: var(--af-text-3);
  font-size: 13px;
  word-break: break-all;
}

@media (max-width: 720px) {
  .not-found-page {
    padding: 16px;
  }

  .not-found-card {
    padding: 28px 20px;
    border-radius: 18px;
  }

  .actions {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
