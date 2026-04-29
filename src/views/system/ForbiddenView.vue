<template>
  <div class="forbidden-page">
    <section class="forbidden-card">
      <span class="eyebrow">403</span>
      <h1>当前账号没有访问权限</h1>
      <p>{{ message }}</p>

      <div class="actions">
        <el-button type="primary" @click="goDashboard">返回首页</el-button>
        <el-button @click="goPrevious">返回上一页</el-button>
        <el-button text @click="logout">退出登录</el-button>
      </div>

      <p v-if="redirectTarget" class="hint">
        触发页面：{{ redirectTarget }}
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

const message = computed(() => {
  return normalizeQueryValue(route.query.message) || '请联系管理员确认当前账号角色与页面操作权限。'
})

const redirectTarget = computed(() => normalizeQueryValue(route.query.redirect))

function goDashboard(): void {
  void router.push('/dashboard')
}

function goPrevious(): void {
  if (window.history.length > 1) {
    router.back()
    return
  }
  void router.push('/dashboard')
}

async function logout(): Promise<void> {
  await userStore.logout()
  void router.push('/login')
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
.forbidden-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
}

.forbidden-card {
  width: min(620px, 100%);
  padding: 40px 32px;
  border: 1px solid var(--af-border);
  border-radius: 24px;
  background:
    radial-gradient(circle at top right, rgba(201, 79, 61, 0.12), transparent 42%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(255, 255, 255, 0.9));
  box-shadow: var(--af-shadow);
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(201, 79, 61, 0.12);
  color: #a43b2e;
  font-size: 12px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.forbidden-card h1 {
  margin: 18px 0 10px;
  color: var(--af-ink);
  font-size: clamp(28px, 4vw, 36px);
  line-height: 1.15;
}

.forbidden-card p {
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
  .forbidden-page {
    padding: 16px;
  }

  .forbidden-card {
    padding: 28px 20px;
    border-radius: 18px;
  }

  .actions {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
