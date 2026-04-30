<template>
  <header class="app-topbar">
    <div class="topbar-left">
      <button class="topbar-toggle" type="button" :aria-label="isNavCollapsed ? '展开菜单' : '收起菜单'" @click="toggleNavCollapsed">
        <el-icon><Operation /></el-icon>
      </button>
      <div class="topbar-breadcrumbs">
        <span
          v-for="(item, index) in breadcrumbItems"
          :key="`${route.path}-${item}-${index}`"
          class="breadcrumb-item"
          :class="{ 'breadcrumb-item--current': index === breadcrumbItems.length - 1 }"
        >
          <span v-if="index > 0" class="breadcrumb-separator">/</span>
          {{ item }}
        </span>
      </div>
    </div>

    <div class="topbar-right">
      <el-input
        v-model.trim="searchKeyword"
        class="topbar-search"
        placeholder="搜索功能、物料、单据号、库存..."
        :prefix-icon="Search"
        clearable
      />
      <el-badge :value="12" class="topbar-badge">
        <button class="topbar-icon" type="button" aria-label="消息通知">
          <el-icon><Bell /></el-icon>
        </button>
      </el-badge>
      <button class="topbar-icon" type="button" aria-label="帮助中心">
        <el-icon><QuestionFilled /></el-icon>
      </button>
      <el-dropdown trigger="click" @command="handleCommand">
        <button class="user-entry" type="button">
          <el-avatar class="user-avatar" :icon="UserFilled" />
          <span class="user-name">{{ displayName }}</span>
          <el-icon class="user-arrow"><ArrowDown /></el-icon>
        </button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile">个人信息</el-dropdown-item>
            <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { ArrowDown, Bell, Operation, QuestionFilled, Search, UserFilled } from '@element-plus/icons-vue'
import { useNavState } from '@/composables/useNavState'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const { isNavCollapsed, toggleNavCollapsed } = useNavState()
const searchKeyword = ref('')

const breadcrumbMap = new Map<string, string[]>([
  ['/dashboard', ['首页', '工作台']],
  ['/wms/inbound-orders', ['入库管理', '入库列表']],
  ['/wms/outbound-orders', ['出库管理', '出库列表']],
  ['/wms/stocks', ['库存查询', '库存总览']],
  ['/wms/inventory-adjustments', ['库存调整', '调整列表']],
  ['/wms/warehouses', ['仓库管理', '仓库列表']],
  ['/wms/areas', ['区域管理', '区域列表']],
  ['/wms/locations', ['库位管理', '库位列表']],
  ['/wms/materials', ['物料管理', '物料列表']],
  ['/system/users', ['系统管理', '用户管理', '用户列表']],
  ['/system/roles', ['系统管理', '角色管理', '角色列表']],
  ['/profile', ['个人中心', '个人资料']],
  ['/403', ['系统提示', '无权限访问']],
  ['/404', ['系统提示', '页面不存在']]
])

const breadcrumbItems = computed(() => {
  return breadcrumbMap.get(route.path) ?? ['AetherFlow']
})

const displayName = computed(() => {
  return userStore.userInfo?.nickname || userStore.userInfo?.username || '管理员'
})

async function handleCommand(command: string | number | object): Promise<void> {
  if (command === 'profile') {
    await router.push('/profile')
    return
  }

  if (command !== 'logout') {
    return
  }

  try {
    await ElMessageBox.confirm('确认退出登录吗？', '提示', {
      type: 'warning',
      confirmButtonText: '退出',
      cancelButtonText: '取消'
    })
  } catch {
    return
  }

  await userStore.logout()
  await router.push('/login')
}
</script>

<style scoped>
.app-topbar {
  position: sticky;
  top: 0;
  z-index: 12;
  height: 72px;
  padding: 0 24px;
  border-bottom: 1px solid rgba(223, 232, 243, 0.92);
  background: rgba(252, 253, 255, 0.92);
  backdrop-filter: blur(16px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.topbar-left,
.topbar-right {
  display: flex;
  align-items: center;
}

.topbar-left {
  gap: 14px;
  min-width: 0;
}

.topbar-right {
  gap: 10px;
  flex-shrink: 0;
}

.topbar-toggle,
.topbar-icon,
.user-entry {
  border: 0;
  background: transparent;
  padding: 0;
}

.topbar-toggle,
.topbar-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  color: var(--af-ink);
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
}

.topbar-toggle:hover,
.topbar-icon:hover,
.user-entry:hover {
  background: rgba(240, 244, 251, 0.96);
}

.topbar-toggle .el-icon,
.topbar-icon .el-icon {
  font-size: 20px;
}

.topbar-breadcrumbs {
  display: flex;
  align-items: center;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
}

.breadcrumb-item {
  font-size: 15px;
  font-weight: 600;
  color: #7a89a8;
}

.breadcrumb-item--current {
  color: var(--af-ink);
}

.breadcrumb-separator {
  margin: 0 10px;
  color: #c1cada;
}

.topbar-search {
  width: 280px;
}

.topbar-search :deep(.el-input__wrapper) {
  min-height: 42px;
  border-radius: 12px;
  box-shadow: inset 0 0 0 1px rgba(217, 226, 239, 0.96);
}

.topbar-badge {
  display: inline-flex;
}

.user-entry {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 42px;
  padding: 0 10px 0 4px;
  border-radius: 16px;
  cursor: pointer;
  color: var(--af-ink);
}

.user-avatar {
  --el-avatar-size: 34px;
  background: linear-gradient(180deg, #f3f7ff 0%, #dce8ff 100%);
  color: #2d67e3;
}

.user-name {
  font-size: 15px;
  font-weight: 600;
}

.user-arrow {
  font-size: 12px;
  color: #8595b4;
}

@media (max-width: 1100px) {
  .topbar-search {
    width: 220px;
  }
}

@media (max-width: 900px) {
  .app-topbar {
    position: static;
    height: auto;
    padding: 16px 16px 10px;
    flex-direction: column;
    align-items: stretch;
  }

  .topbar-right {
    justify-content: space-between;
  }

  .topbar-search {
    width: 100%;
    min-width: 0;
  }
}

@media (max-width: 640px) {
  .topbar-right {
    flex-wrap: wrap;
  }

  .user-entry {
    margin-left: auto;
  }
}
</style>
