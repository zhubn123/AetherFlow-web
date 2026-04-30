<template>
  <aside class="wms-nav" :class="{ 'is-collapsed': isNavCollapsed }">
    <div class="brand">
      <div class="brand-lockup">
        <img class="brand-logo" :src="logoPath" alt="AetherFlow WMS" />
        <span class="brand-mark">AF</span>
      </div>
<!--      <button-->
<!--        class="nav-collapse"-->
<!--        type="button"-->
<!--        :aria-label="isNavCollapsed ? '展开侧栏' : '收起侧栏'"-->
<!--        @click="toggleNavCollapsed"-->
<!--      >-->
<!--        <el-icon>-->
<!--          <component :is="isNavCollapsed ? ArrowRightBold : ArrowLeftBold" />-->
<!--        </el-icon>-->
<!--      </button>-->
    </div>

    <div class="menu-scroll">
      <nav class="menu">
        <section
          v-for="group in menuGroups"
          :key="group.key"
          class="menu-group"
        >
          <button
            class="group-toggle"
            :class="{ 'is-open': isGroupExpanded(group.key), 'has-active': isGroupActive(group) }"
            type="button"
            :title="isNavCollapsed ? group.title : undefined"
            @click="toggleGroup(group.key)"
          >
            <span class="group-toggle__main">
              <el-icon class="group-toggle__icon"><component :is="group.icon" /></el-icon>
              <span class="group-toggle__label">{{ group.title }}</span>
            </span>
            <el-icon class="group-toggle__arrow" :class="{ 'is-open': isGroupExpanded(group.key) }">
              <ArrowRightBold />
            </el-icon>
          </button>

          <el-collapse-transition>
            <div v-show="isGroupExpanded(group.key)" class="group-body">
              <button
                v-for="item in group.items"
                :key="item.path"
                class="menu-item"
                :class="{ active: route.path === item.path }"
                :title="isNavCollapsed ? item.title : undefined"
                @click="go(item.path)"
              >
                <span class="menu-left">
                  <el-icon><component :is="item.icon" /></el-icon>
                  <span class="menu-label">{{ item.title }}</span>
                </span>
                <el-icon class="menu-right"><ArrowRightBold /></el-icon>
              </button>
            </div>
          </el-collapse-transition>
        </section>
      </nav>
    </div>

    <p class="nav-version">AetherFlow v1.0</p>
  </aside>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
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
import { useNavState } from '@/composables/useNavState'
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
  icon: object
  items: MenuItem[]
}

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const { isNavCollapsed, ensureGroupOpen, isGroupOpen, toggleGroup } = useNavState()

const menuGroups = computed<MenuGroup[]>(() => {
  const groups: MenuGroup[] = [
    {
      key: 'overview',
      title: '总览',
      icon: HomeFilled,
      items: [{ title: '首页', path: '/dashboard', icon: HomeFilled }]
    },
    {
      key: 'biz',
      title: '业务单据',
      icon: SetUp,
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
      icon: OfficeBuilding,
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
      icon: Setting,
      items: [
        { title: '用户管理', path: '/system/users', icon: Setting, roles: ['admin'] },
        { title: '角色管理', path: '/system/roles', icon: Setting, roles: ['admin'] }
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

watch(
  [menuGroups, () => route.path],
  ([groups]) => {
    const activeGroup = groups.find((group) => group.items.some((item) => item.path === route.path))
    if (activeGroup) {
      ensureGroupOpen(activeGroup.key)
    }
  },
  { immediate: true }
)

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

function isGroupExpanded(key: string): boolean {
  return isGroupOpen(key)
}

function isGroupActive(group: MenuGroup): boolean {
  return group.items.some((item) => item.path === route.path)
}
</script>

<style scoped>
.wms-nav {
  position: fixed;
  top: 0;
  left: 0;
  box-sizing: border-box;
  width: var(--nav-width, 242px);
  height: 100vh;
  padding: 18px 16px 14px;
  background: linear-gradient(180deg, #eef3fb 0%, #e9eff9 100%);
  border-right: 1px solid #d8e2f3;
  box-shadow: 6px 0 20px rgba(19, 43, 88, 0.05);
  display: flex;
  flex-direction: column;
  gap: 14px;
  z-index: 20;
  overflow: hidden;
  transition: width 0.24s ease, padding 0.24s ease;
}

.brand {
  padding: 2px 2px 14px;
  border-bottom: 1px solid #d8e2f3;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.brand-lockup {
  display: flex;
  align-items: center;
  min-width: 0;
  flex: 1;
}

.brand-logo {
  width: 174px;
  display: block;
  border-radius: 12px;
}

.brand-mark {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  border: 1px solid rgba(205, 218, 239, 0.9);
  background: rgba(255, 255, 255, 0.82);
  color: #2f6df6;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.08em;
  display: none;
  place-items: center;
}

.nav-collapse {
  width: 30px;
  height: 30px;
  border: 1px solid rgba(207, 217, 234, 0.96);
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.64);
  color: #7082a3;
  display: grid;
  place-items: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: background-color 0.18s ease, color 0.18s ease, border-color 0.18s ease;
}

.nav-collapse:hover {
  background: rgba(255, 255, 255, 0.92);
  border-color: rgba(183, 201, 232, 0.96);
  color: #2f6df6;
}

.menu-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 4px;
  margin-right: -4px;
}

.menu-scroll::-webkit-scrollbar {
  width: 8px;
}

.menu-scroll::-webkit-scrollbar-thumb {
  background: rgba(126, 144, 173, 0.38);
  border-radius: 999px;
}

.menu-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.menu {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 100%;
}

.menu-group {
  display: grid;
  gap: 6px;
}

.group-toggle {
  border: 0;
  min-height: 24px;
  padding: 0 4px;
  border-radius: 8px;
  background: transparent;
  color: #7b8ead;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: color 0.18s ease;
}

.group-toggle:hover {
  background: transparent;
  color: #5d7195;
}

.group-toggle.has-active {
  color: #4d638d;
}

.group-toggle__main {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.group-toggle__icon {
  display: none;
  font-size: 15px;
}

.group-toggle__label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  white-space: nowrap;
}

.group-toggle__arrow {
  font-size: 10px;
  opacity: 0.48;
  transition: transform 0.18s ease, opacity 0.18s ease;
}

.group-toggle__arrow.is-open {
  transform: rotate(90deg);
}

.group-body {
  display: grid;
  gap: 6px;
  padding-left: 0;
}

.menu-item {
  border: 0;
  border-radius: 12px;
  min-height: 40px;
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
  background: rgba(231, 238, 252, 0.94);
}

.menu-item.active {
  background: linear-gradient(180deg, #4d82f2 0%, #3f75ea 100%);
  color: #fff;
  box-shadow: 0 8px 18px rgba(37, 99, 235, 0.22);
}

.menu-left {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
}

.menu-left .el-icon {
  font-size: 16px;
}

.menu-label {
  white-space: nowrap;
}

.menu-right {
  font-size: 11px;
  opacity: 0.42;
  transition: transform 0.18s ease, opacity 0.18s ease;
}

.menu-item:hover .menu-right {
  transform: translateX(2px);
  opacity: 0.68;
}

.nav-version {
  margin: 2px 4px 0;
  padding-top: 10px;
  border-top: 1px solid rgba(216, 226, 243, 0.92);
  color: #8b9ab6;
  font-size: 11px;
}

.wms-nav.is-collapsed {
  padding-left: 12px;
  padding-right: 12px;
}

.wms-nav.is-collapsed .brand-logo,
.wms-nav.is-collapsed .group-toggle__label,
.wms-nav.is-collapsed .menu-label,
.wms-nav.is-collapsed .menu-right,
.wms-nav.is-collapsed .nav-version {
  display: none;
}

.wms-nav.is-collapsed .brand-mark {
  display: grid;
}

.wms-nav.is-collapsed .brand {
  flex-direction: column;
  justify-content: flex-start;
  padding-bottom: 12px;
}

.wms-nav.is-collapsed .brand-lockup {
  flex: 0 0 auto;
}

.wms-nav.is-collapsed .group-toggle__icon {
  display: inline-flex;
}

.wms-nav.is-collapsed .group-toggle__arrow {
  display: none;
}

.wms-nav.is-collapsed .group-toggle,
.wms-nav.is-collapsed .menu-item {
  width: 100%;
}

.wms-nav.is-collapsed .group-toggle,
.wms-nav.is-collapsed .menu-item {
  min-height: 38px;
  padding-left: 0;
  padding-right: 0;
  justify-content: center;
}

.wms-nav.is-collapsed .group-toggle {
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.34);
}

.wms-nav.is-collapsed .group-toggle:hover {
  background: rgba(255, 255, 255, 0.7);
}

.wms-nav.is-collapsed .group-toggle__main,
.wms-nav.is-collapsed .menu-left {
  justify-content: center;
  width: 100%;
}

.wms-nav.is-collapsed .group-body {
  padding-left: 0;
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

  .menu-scroll {
    overflow: visible;
    padding-right: 0;
    margin-right: 0;
  }

  .nav-collapse {
    display: none;
  }

  .brand-mark {
    display: none;
  }
}
</style>
