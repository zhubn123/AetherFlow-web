<template>
  <div class="dashboard-shell">
    <main class="content">
      <header class="content-header">
        <div>
          <h1>欢迎回来，<span class="highlight">{{ displayName }}</span></h1>
          <p>今天是 {{ currentDateText }}，先看概览，再进入业务处理。</p>
        </div>
        <div class="header-right">
          <el-input
            v-model.trim="searchKeyword"
            class="search-input"
            placeholder="搜索功能、物料、单据等..."
            :prefix-icon="Search"
            clearable
            @keyup.enter="handleSearch"
          />
          <el-badge :value="3">
            <el-button circle @click="openNotifications"><el-icon><Bell /></el-icon></el-button>
          </el-badge>
          <el-button circle @click="toggleFullscreen"><el-icon><FullScreen /></el-icon></el-button>
          <el-dropdown trigger="click" @command="handleUserCommand">
            <el-avatar class="user-avatar" :icon="UserFilled" />
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人信息</el-dropdown-item>
                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <section class="overview-grid">
        <el-card v-for="item in overviewCards" :key="item.key" shadow="never" class="overview-card">
          <p class="overview-label">{{ item.label }}</p>
          <p class="overview-value">{{ item.value }}</p>
          <p class="overview-tip">{{ item.tip }}</p>
        </el-card>
      </section>

      <section class="main-grid">
        <el-card shadow="never" class="panel panel-quick">
          <template #header>
            <div class="panel-header">
              <span class="panel-title">快捷操作</span>
            </div>
          </template>
          <div class="quick-grid">
            <button v-for="item in quickActions" :key="item.key" class="quick-card" @click="go(item.path)">
              <el-icon><component :is="item.icon" /></el-icon>
              <span>{{ item.title }}</span>
            </button>
          </div>
        </el-card>

        <el-card shadow="never" class="panel panel-activity">
          <template #header>
            <div class="panel-header">
              <span class="panel-title">最近动作</span>
            </div>
          </template>
          <el-timeline>
            <el-timeline-item v-for="item in activities" :key="item.time" :type="item.type">
              <div class="timeline-title">{{ item.time }} {{ item.title }}</div>
              <div class="timeline-sub">{{ item.user }}</div>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import {
  Bell,
  DataAnalysis,
  Download,
  FullScreen,
  Grid,
  Search,
  Upload,
  UserFilled
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

interface QuickAction {
  key: string
  title: string
  path: string
  icon: object
}

interface ActivityItem {
  time: string
  title: string
  user: string
  type: '' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
}

interface OverviewCard {
  key: string
  label: string
  value: string
  tip: string
}

const userStore = useUserStore()
const router = useRouter()
const searchKeyword = ref('')

const displayName = computed(() => userStore.userInfo?.nickname || userStore.userInfo?.username || 'admin')
const currentDateText = computed(() => {
  const now = new Date()
  return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }).format(now)
})

// TODO(预留): 首页概览改为后端聚合接口返回（如 /api/wms/dashboard/overview）
// 字段建议：todayInboundCount / todayOutboundCount / warningCount / exceptionCount
const overviewCards: OverviewCard[] = [
  { key: 'inbound', label: '今日入库单', value: '12', tip: '较昨日 +2' },
  { key: 'outbound', label: '今日出库单', value: '9', tip: '较昨日 -1' },
  { key: 'stock', label: '库存预警', value: '3', tip: '需要处理' },
  { key: 'exception', label: '异常单据', value: '1', tip: '待确认' }
]

// TODO(预留): 快捷操作建议改为“可配置入口”，后续从用户偏好或角色权限接口下发
const quickActions: QuickAction[] = [
  { key: 'newInbound', title: '新建入库单', path: '/wms/inbound-orders', icon: Download },
  { key: 'newOutbound', title: '新建出库单', path: '/wms/outbound-orders', icon: Upload },
  { key: 'stock', title: '查看库存', path: '/wms/stocks', icon: DataAnalysis },
  { key: 'menu', title: '常用入口', path: '/wms/warehouses', icon: Grid }
]

// TODO(预留): 最近动作改为真实操作日志接口（按用户/时间倒序）
const activities: ActivityItem[] = [
  { time: '10:15', title: '完成入库单确认', user: '系统管理员', type: 'success' },
  { time: '09:42', title: '修正库存预警阈值', user: '系统管理员', type: 'primary' },
  { time: '09:20', title: '新增物料主数据', user: '系统管理员', type: 'warning' }
]

function go(path: string): void {
  void router.push(path)
}

function handleSearch(): void {
  const keyword = searchKeyword.value.toLowerCase()
  if (!keyword) {
    ElMessage.warning('请输入搜索关键词')
    return
  }

  const target = quickActions.find((item) => {
    return item.title.toLowerCase().includes(keyword)
  })

  if (target) {
    ElMessage.success(`已定位到：${target.title}`)
    void router.push(target.path)
    return
  }

  ElMessage.info('未匹配到模块，请换个关键词试试')
}

function openNotifications(): void {
  // TODO(预留): 这里先用本地通知占位，后续接入消息中心接口（未读数 + 消息列表）
  ElNotification({
    title: '系统通知',
    message: '你有 3 条待关注消息（示例数据），后续将接入真实通知中心。',
    type: 'info'
  })
}

async function toggleFullscreen(): Promise<void> {
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen()
      ElMessage.success('已进入全屏模式')
    } else {
      await document.exitFullscreen()
      ElMessage.success('已退出全屏模式')
    }
  } catch {
    ElMessage.error('当前浏览器不支持全屏或操作被拦截')
  }
}

async function handleUserCommand(command: string): Promise<void> {
  if (command === 'profile') {
    void router.push('/profile')
    return
  }

  if (command === 'logout') {
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
    ElMessage.success('已退出登录')
    void router.push('/login')
  }
}
</script>

<style scoped>
.dashboard-shell {
  min-height: 100vh;
}

.content {
  padding: 18px 20px;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 12px;
}

.content-header h1 {
  margin: 0;
  font-size: 30px;
  letter-spacing: -0.2px;
  color: var(--af-ink);
}

.highlight {
  color: var(--af-brand);
}

.content-header p {
  margin: 6px 0 0;
  color: var(--af-text-2);
  font-size: 13px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-input {
  width: 320px;
}

.user-avatar {
  cursor: pointer;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 12px;
}

.overview-card {
  border-radius: 12px;
  border: 1px solid var(--af-border);
  box-shadow: var(--af-shadow);
}

.overview-label {
  margin: 0;
  color: var(--af-text-2);
  font-size: 12px;
}

.overview-value {
  margin: 6px 0 2px;
  color: var(--af-ink);
  font-size: 24px;
  font-weight: 700;
}

.overview-tip {
  margin: 0;
  color: var(--af-text-3);
  font-size: 12px;
}

.main-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-areas:
    'quick'
    'activity';
  gap: 12px;
}

.panel-quick {
  grid-area: quick;
}

.panel-activity {
  grid-area: activity;
}

.panel {
  border-radius: 14px;
  border: 1px solid var(--af-border);
  background: var(--af-surface);
  box-shadow: var(--af-shadow);
}

.panel-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--af-ink);
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.quick-card {
  border: 1px solid var(--af-border);
  border-radius: 12px;
  min-height: 72px;
  background: #fbfcff;
  display: grid;
  place-items: center;
  gap: 6px;
  cursor: pointer;
  color: var(--af-ink);
  transition: border-color 0.2s ease, transform 0.2s ease;
}

.quick-card:hover {
  border-color: #cdd7e8;
  transform: translateY(-1px);
}

.quick-card .el-icon {
  font-size: 20px;
  color: var(--af-brand);
}

.timeline-title {
  color: var(--af-ink);
  font-weight: 600;
}

.timeline-sub {
  color: var(--af-text-2);
  font-size: 12px;
}

@media (max-width: 1200px) {
  .content {
    padding: 12px;
  }

  .content-header {
    flex-direction: column;
    align-items: stretch;
  }

  .search-input {
    width: 100%;
  }

  .overview-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .content-header h1 {
    font-size: 24px;
  }

  .overview-grid,
  .quick-grid {
    grid-template-columns: 1fr;
  }
}
</style>
