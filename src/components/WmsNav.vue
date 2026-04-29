<template>
  <aside class="wms-nav">
    <div class="brand">
      <img class="brand-logo" :src="logoPath" alt="AetherFlow WMS" />
    </div>

    <nav class="menu">
      <section
        v-for="group in menuGroups"
        :key="group.key"
        class="menu-group"
        :class="{ 'menu-group--base': group.key === 'base' }"
      >
        <p class="group-title">{{ group.title }}</p>
        <button
          v-for="item in group.items"
          :key="item.path"
          class="menu-item"
          :class="{ active: route.path === item.path }"
          @click="go(item.path)"
        >
          <span class="menu-left">
            <el-icon><component :is="item.icon" /></el-icon>
            <span>{{ item.title }}</span>
          </span>
          <el-icon class="menu-right"><ArrowRightBold /></el-icon>
        </button>
      </section>
    </nav>

    <p class="nav-version">AetherFlow v1.0</p>

  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowRightBold,
  Box,
  DataAnalysis,
  Download,
  Grid,
  HomeFilled,
  MapLocation,
  OfficeBuilding,
  Setting,
  SetUp,
  Upload
} from '@element-plus/icons-vue'
import logoPath from '@/assets/aetherflow-logo.svg'
import { useUserStore } from '@/stores/user'

interface MenuItem {
  title: string
  path: string
  icon: object
  roles?: string[]
}

interface MenuGroup {
  key: string
  title: string
  items: MenuItem[]
}

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const menuGroups = computed<MenuGroup[]>(() => {
  const groups: MenuGroup[] = [
  {
    key: 'overview',
    title: '总览',
    items: [{ title: '首页', path: '/dashboard', icon: HomeFilled }]
  },
  {
    key: 'biz',
    title: '业务单据',
    items: [
      { title: '入库', path: '/wms/inbound-orders', icon: Upload },
      { title: '出库', path: '/wms/outbound-orders', icon: Download },
      { title: '库存', path: '/wms/stocks', icon: DataAnalysis },
      { title: '库存调整', path: '/wms/inventory-adjustments', icon: SetUp }
    ]
  },
  {
    key: 'base',
    title: '基础资料',
    items: [
      { title: '仓库', path: '/wms/warehouses', icon: OfficeBuilding },
      { title: '区域', path: '/wms/areas', icon: MapLocation },
      { title: '库位', path: '/wms/locations', icon: Grid },
      { title: '物料', path: '/wms/materials', icon: Box }
    ]
  },
  {
    key: 'system',
    title: '系统管理',
    items: [
      { title: '用户管理', path: '/system/users', icon: Setting, roles: ['admin'] }
    ]
  }
  ]

  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => canAccess(item.roles))
    }))
    .filter((group) => group.items.length > 0)
})

function go(path: string): void {
  if (path !== route.path) {
    void router.push(path)
  }
}

function canAccess(roles?: string[]): boolean {
  if (!roles || roles.length === 0) {
    return true
  }
  return roles.some((roleKey) => userStore.hasRole(roleKey))
}
</script>

<style scoped>
.wms-nav {
  position: fixed;
  top: 0;
  left: 0;
  width: 220px;
  height: 100vh;
  padding: 16px 14px;
  background: linear-gradient(180deg, #edf2fb 0%, #e8eef8 100%);
  border-right: 1px solid #d8e2f3;
  box-shadow: 2px 0 10px rgba(19, 43, 88, 0.05);
  display: flex;
  flex-direction: column;
  gap: 14px;
  z-index: 20;
  overflow: hidden;
}

.brand {
  padding: 2px 2px 10px;
  border-bottom: 1px solid #d8e2f3;
  position: relative;
  z-index: 1;
}

.brand-logo {
  width: 174px;
  display: block;
  border-radius: 12px;
}

.menu {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 12px;
  position: relative;
  z-index: 1;
  min-height: 0;
}

.menu-group {
  display: grid;
  gap: 10px;
}

.menu-group--base {
  margin-top: auto;
}

.group-title {
  margin: 0 4px;
  font-size: 11px;
  color: #7b8ead;
  letter-spacing: 0.08em;
}

.menu-item {
  border: 0;
  border-radius: 10px;
  height: 44px;
  background: transparent;
  color: #2a3d62;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  cursor: pointer;
  transition: background-color 0.18s ease, color 0.18s ease, box-shadow 0.18s ease;
}

.menu-item:hover {
  background: #e7eefc;
}

.menu-item.active {
  background: #3f75ea;
  color: #fff;
  box-shadow: 0 4px 10px rgba(37, 99, 235, 0.22);
}

.menu-left {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.menu-right {
  font-size: 12px;
  opacity: 0.6;
}

.nav-version {
  margin: auto 4px 0;
  color: #8b9ab6;
  font-size: 11px;
}

@media (max-width: 900px) {
  .wms-nav {
    position: static;
    width: auto;
    height: auto;
    padding: 0;
    background: transparent;
    gap: 8px;
    box-shadow: none;
    border-right: 0;
    overflow: visible;
  }

  .brand {
    display: none;
  }

  .menu {
    display: flex;
    flex-wrap: wrap;
    overflow-x: auto;
    gap: 8px;
    padding-bottom: 4px;
  }

  .menu-group {
    display: flex;
    gap: 8px;
  }

  .menu-group--base {
    margin-top: 0;
  }

  .group-title {
    display: none;
  }

  .menu-item {
    border: 1px solid var(--el-border-color);
    background: #fff;
    color: var(--el-text-color-primary);
    min-width: 96px;
    justify-content: center;
    gap: 0;
  }

  .menu-item.active {
    box-shadow: none;
    background: #ecf3ff;
    color: #2f6df6;
    border-color: #bfd4ff;
  }

  .menu-right {
    display: none;
  }

  .nav-version {
    display: none;
  }

}
</style>
