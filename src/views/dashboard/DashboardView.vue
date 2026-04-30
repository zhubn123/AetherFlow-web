<template>
  <div class="dashboard-page">
    <section class="hero-card">
      <div class="hero-copy">
        <h1>欢迎回来，{{ displayName }}<span class="hero-wave">👋</span></h1>
        <p class="hero-subtitle">今天是 {{ currentDateText }}</p>
      </div>
      <el-select v-model="selectedWarehouse" class="hero-warehouse" placeholder="全部仓库">
        <el-option v-for="item in warehouseOptions" :key="item" :label="item" :value="item" />
      </el-select>
    </section>

    <section class="stat-grid">
      <article v-for="card in statCards" :key="card.key" class="stat-card">
        <div class="stat-card__icon" :style="{ '--accent': card.color }">
          <el-icon><component :is="card.icon" /></el-icon>
        </div>
        <div class="stat-card__body">
          <p class="stat-card__label">{{ card.label }}</p>
          <p class="stat-card__value">{{ card.value }}</p>
          <p class="stat-card__delta" :class="{ 'is-down': card.deltaType === 'down' }">
            较昨日
            <span>{{ card.delta }}</span>
          </p>
        </div>
      </article>
    </section>

    <section class="priority-grid">
      <article class="panel warning-panel">
        <div class="panel-head">
          <div>
            <h2>库存预警 Top 5</h2>
            <p>高风险物料优先关注</p>
          </div>
          <button class="text-link" type="button">查看全部</button>
        </div>
        <div class="panel-body">
          <div class="table-scroll">
            <table class="simple-table">
              <thead>
                <tr>
                  <th>物料编码</th>
                  <th>物料名称</th>
                  <th>规格型号</th>
                  <th>当前库存</th>
                  <th>预警类型</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in warningRows" :key="item.code">
                  <td>{{ item.code }}</td>
                  <td>{{ item.name }}</td>
                  <td>{{ item.spec }}</td>
                  <td>{{ item.stock }}</td>
                  <td><span class="warning-tag" :class="item.level">{{ item.levelLabel }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </article>

      <article class="panel activity-panel">
        <div class="panel-head">
          <div>
            <h2>最近动态</h2>
            <p>关键业务动作时间线</p>
          </div>
          <button class="text-link" type="button">查看全部</button>
        </div>
        <div class="panel-body">
          <ul class="activity-list">
            <li v-for="item in activities" :key="`${item.time}-${item.title}`" class="activity-item">
              <span class="activity-dot" :style="{ '--accent': item.color }"></span>
              <div class="activity-main">
                <strong>{{ item.time }}</strong>
                <p>{{ item.title }}</p>
                <small>{{ item.user }}</small>
              </div>
            </li>
          </ul>
        </div>
      </article>

      <article class="panel quick-panel">
        <div class="panel-head">
          <div>
            <h2>快捷操作</h2>
          </div>
        </div>
        <div class="panel-body panel-body--static">
          <div class="quick-grid">
            <button
              v-for="action in quickActions"
              :key="action.key"
              class="quick-card"
              type="button"
              @click="go(action.path)"
            >
              <span class="quick-card__icon" :style="{ '--accent': action.color }">
                <el-icon><component :is="action.icon" /></el-icon>
              </span>
              <span class="quick-card__text">
                <strong>{{ action.title }}</strong>
              </span>
            </button>
          </div>
        </div>
      </article>
    </section>

    <section class="insight-grid">
      <article class="panel trend-panel">
        <div class="panel-head">
          <div>
            <h2>单据趋势（近7日）</h2>
            <p>入库与出库变化概览</p>
          </div>
          <el-select v-model="trendRange" class="mini-select" size="small">
            <el-option label="近7日" value="7d" />
            <el-option label="近14日" value="14d" />
          </el-select>
        </div>
        <div class="chart-legend">
          <span><i class="legend-dot legend-dot--blue"></i>入库单</span>
          <span><i class="legend-dot legend-dot--green"></i>出库单</span>
        </div>
        <svg class="trend-chart" viewBox="0 0 640 260" preserveAspectRatio="none" aria-hidden="true">
          <g class="chart-grid">
            <line v-for="line in 5" :key="line" :x1="48" :x2="610" :y1="35 + line * 38" :y2="35 + line * 38" />
          </g>
          <polyline class="chart-line chart-line--blue" points="48,138 128,104 208,116 288,82 368,92 448,48 528,146" />
          <polyline class="chart-line chart-line--green" points="48,164 128,142 208,152 288,118 368,130 448,92 528,170" />
          <g>
            <circle v-for="point in inboundPoints" :key="point.label" class="chart-point chart-point--blue" :cx="point.x" :cy="point.y" r="5" />
            <text
              v-for="point in inboundPoints"
              :key="`${point.label}-text`"
              class="chart-value chart-value--blue"
              :x="point.x"
              :y="point.y - 12"
            >
              {{ point.value }}
            </text>
          </g>
          <g>
            <circle v-for="point in outboundPoints" :key="point.label" class="chart-point chart-point--green" :cx="point.x" :cy="point.y" r="5" />
            <text
              v-for="point in outboundPoints"
              :key="`${point.label}-text`"
              class="chart-value chart-value--green"
              :x="point.x"
              :y="point.y + 20"
            >
              {{ point.value }}
            </text>
          </g>
          <g>
            <text v-for="point in axisPoints" :key="`${point.label}-axis`" class="chart-axis" :x="point.x" y="236">{{ point.label }}</text>
          </g>
        </svg>
      </article>

      <div class="side-stack">
        <article class="panel report-panel">
          <div class="panel-head">
            <div>
              <h2>常用报表</h2>
            </div>
          </div>
          <div class="panel-body panel-body--static">
            <div class="report-grid">
              <button
                v-for="report in reports"
                :key="report.key"
                class="report-card"
                type="button"
              >
                <span class="report-card__icon" :style="{ '--accent': report.color }">
                  <el-icon><component :is="report.icon" /></el-icon>
                </span>
                <span>{{ report.title }}</span>
              </button>
            </div>
          </div>
        </article>

        <article class="panel notice-panel">
          <div class="panel-head">
            <div>
              <h2>系统公告</h2>
              <p>近期更新与维护信息</p>
            </div>
          </div>
          <div class="panel-body">
            <ul class="notice-list">
              <li v-for="item in notices" :key="item.date + item.text">
                <span class="notice-dot"></span>
                <strong>{{ item.date }}</strong>
                <p>{{ item.text }}</p>
              </li>
            </ul>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  Bell,
  Box,
  Coin,
  DataAnalysis,
  DocumentCopy,
  Goods,
  Histogram,
  OfficeBuilding,
  Position,
  Reading,
  SetUp,
  Ship,
  UploadFilled,
  Van,
  WarningFilled
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

interface StatCard {
  key: string
  label: string
  value: string
  delta: string
  deltaType?: 'up' | 'down'
  color: string
  icon: object
}

interface QuickAction {
  key: string
  title: string
  path: string
  color: string
  icon: object
}

interface ChartPoint {
  x: number
  y: number
  label: string
  value: number
}

const router = useRouter()
const userStore = useUserStore()
const selectedWarehouse = ref('全部仓库')
const trendRange = ref('7d')

const warehouseOptions = ['全部仓库', '北京总仓', '上海总仓', '深圳总仓', '杭州分仓']

const displayName = computed(() => {
  return userStore.userInfo?.nickname || userStore.userInfo?.username || '管理员'
})

const currentDateText = computed(() => {
  const now = new Date()
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  }).format(now)
})

const statCards: StatCard[] = [
  { key: 'warning', label: '库存预警', value: '3', delta: '↓ 25.0%', deltaType: 'down', color: '#ff9a1f', icon: WarningFilled },
  { key: 'exception', label: '异常单据', value: '1', delta: '↓ 50.0%', deltaType: 'down', color: '#ff6b6b', icon: Bell },
  { key: 'inbound', label: '今日入库单', value: '12', delta: '↑ 33.3%', color: '#2f6df6', icon: UploadFilled },
  { key: 'outbound', label: '今日出库单', value: '9', delta: '↑ 12.5%', color: '#34b36b', icon: Van },
  { key: 'stock', label: '库存总数量', value: '58,762', delta: '↑ 8.7%', color: '#22b8cf', icon: Coin },
  { key: 'online', label: '在库物料', value: '1,246', delta: '↑ 5.2%', color: '#8b5cf6', icon: Box }
]

const quickActions: QuickAction[] = [
  { key: 'newInbound', title: '新建入库单', path: '/wms/inbound-orders', color: '#2f6df6', icon: UploadFilled },
  { key: 'newOutbound', title: '新建出库单', path: '/wms/outbound-orders', color: '#34b36b', icon: Position },
  { key: 'inventory', title: '库存查询', path: '/wms/stocks', color: '#2f6df6', icon: DataAnalysis },
  { key: 'material', title: '物料管理', path: '/wms/materials', color: '#ff9a1f', icon: Goods },
  { key: 'flow', title: '库存流水', path: '/wms/inventory-adjustments', color: '#9b6cff', icon: DocumentCopy },
  { key: 'warehouse', title: '仓库管理', path: '/wms/warehouses', color: '#5b8cff', icon: OfficeBuilding }
]

const inboundPoints: ChartPoint[] = [
  { x: 48, y: 138, label: '04-22', value: 18 },
  { x: 128, y: 104, label: '04-23', value: 24 },
  { x: 208, y: 116, label: '04-24', value: 22 },
  { x: 288, y: 82, label: '04-25', value: 31 },
  { x: 368, y: 92, label: '04-26', value: 27 },
  { x: 448, y: 48, label: '04-27', value: 35 },
  { x: 528, y: 146, label: '04-28', value: 12 }
]

const outboundPoints: ChartPoint[] = [
  { x: 48, y: 164, label: '04-22', value: 15 },
  { x: 128, y: 142, label: '04-23', value: 19 },
  { x: 208, y: 152, label: '04-24', value: 17 },
  { x: 288, y: 118, label: '04-25', value: 23 },
  { x: 368, y: 130, label: '04-26', value: 20 },
  { x: 448, y: 92, label: '04-27', value: 26 },
  { x: 528, y: 170, label: '04-28', value: 9 }
]

const axisPoints = inboundPoints.map(({ x, label }) => ({ x, label }))

const warningRows = [
  { code: 'MAT10023', name: '轴承 6205', spec: '6205-2RS', stock: 5, level: 'danger', levelLabel: '库存不足' },
  { code: 'MAT10045', name: '螺栓 M8*20', spec: 'M8*20', stock: 8, level: 'danger', levelLabel: '库存不足' },
  { code: 'MAT10067', name: '润滑油 1L', spec: 'SAE 10W-40', stock: 3, level: 'danger', levelLabel: '库存不足' },
  { code: 'MAT10089', name: '纸箱 50*40*30', spec: '三层瓦楞', stock: 120, level: 'warning', levelLabel: '库存积压' },
  { code: 'MAT10105', name: '胶带 48mm', spec: '48mm*50m', stock: 210, level: 'warning', levelLabel: '库存积压' }
]

const activities = [
  { time: '10:15', title: '入库单 IBO20260428001 已完成入库', user: '管理员', color: '#2fb35d' },
  { time: '09:42', title: '出库单 OBO20260428001 已完成出库', user: '管理员', color: '#2f6df6' },
  { time: '09:20', title: '物料 MAT10023 库存预警（库存不足）', user: '系统', color: '#ff9a1f' },
  { time: '08:55', title: '新增库位 A-01-05', user: '管理员', color: '#9b6cff' },
  { time: '08:30', title: '库存调整单 ADJ20260428001 已审核', user: '管理员', color: '#2f6df6' }
]

const notices = [
  { date: '2026-04-25', text: 'WMS 系统将在 2026年5月1日 22:00-24:00 进行系统维护，期间系统将暂停服务。' },
  { date: '2026-04-18', text: '新增“库存批次管理”功能，请前往【系统设置】中启用。' },
  { date: '2026-04-10', text: '优化了入库上架流程，支持批量上架操作，提升作业效率。' }
]

const reports = [
  { key: 'stock', title: '库存报表', color: '#5b8cff', icon: Histogram },
  { key: 'inout', title: '出入库报表', color: '#34b36b', icon: Ship },
  { key: 'flow', title: '库存流水报表', color: '#9b6cff', icon: Reading },
  { key: 'material', title: '物料库存报表', color: '#ff9a1f', icon: Box },
  { key: 'location', title: '库位使用报表', color: '#22b8cf', icon: SetUp }
]

function go(path: string): void {
  void router.push(path)
}
</script>

<style scoped>
.dashboard-page {
  --priority-panel-height: 276px;
  --trend-panel-height: 356px;
  --report-panel-height: 144px;
  padding: 22px 24px 32px;
  display: grid;
  gap: 18px;
}

.hero-card,
.panel,
.stat-card {
  border: 1px solid rgba(227, 234, 245, 0.96);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: var(--af-shadow-soft);
}

.hero-card {
  padding: 22px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.hero-eyebrow {
  margin: 0 0 8px;
  font-size: 12px;
  color: var(--af-text-3);
}

.hero-card h1 {
  margin: 0;
  font-size: 26px;
  line-height: 1.1;
  color: var(--af-ink);
}

.hero-wave {
  margin-left: 8px;
}

.hero-subtitle {
  margin: 8px 0 0;
  color: var(--af-text-2);
  font-size: 13px;
}

.hero-warehouse {
  width: 180px;
}

.hero-warehouse :deep(.el-select__wrapper) {
  min-height: 32px;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(188px, 1fr));
  gap: 14px;
}

.stat-card {
  min-height: 98px;
  padding: 16px 18px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-card__icon,
.quick-card__icon,
.report-card__icon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: color-mix(in srgb, var(--accent) 14%, white);
  color: var(--accent);
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.stat-card__icon .el-icon,
.quick-card__icon .el-icon,
.report-card__icon .el-icon {
  font-size: 20px;
}

.stat-card__label,
.stat-card__delta,
.quick-card__text small,
.panel-head p {
  margin: 0;
  color: var(--af-text-2);
  font-size: 12px;
}

.stat-card__value {
  margin: 4px 0;
  font-size: 20px;
  font-weight: 700;
  color: var(--af-ink);
}

.stat-card__delta span {
  margin-left: 4px;
  color: #2fb35d;
  font-weight: 600;
}

.stat-card__delta.is-down span {
  color: #f35a5a;
}

.panel {
  padding: 18px 20px 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.section-title,
.panel-head h2 {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: var(--af-ink);
}

.priority-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.08fr) minmax(0, 0.92fr) minmax(300px, 0.9fr);
  gap: 18px;
  align-items: stretch;
}

.priority-grid > .panel {
  height: var(--priority-panel-height);
  min-height: 0;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  grid-auto-rows: 1fr;
  align-content: start;
}

.quick-card,
.report-card,
.text-link {
  border: 0;
  background: transparent;
  padding: 0;
}

.quick-card,
.report-card {
  min-height: 76px;
  height: 100%;
  padding: 14px;
  border: 1px solid rgba(227, 234, 245, 0.96);
  border-radius: 16px;
  background: linear-gradient(180deg, #fcfdff 0%, #f8fbff 100%);
  display: flex;
  align-items: center;
  gap: 14px;
  text-align: left;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.quick-card {
  min-height: 52px;
  padding: 10px 12px;
  gap: 10px;
}

.quick-card:hover,
.report-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 28px rgba(45, 103, 227, 0.08);
  border-color: #d8e4ff;
}

.quick-card__text,
.report-card {
  display: grid;
  gap: 4px;
}

.quick-card__text strong {
  font-size: 14px;
  color: var(--af-ink);
}

.quick-card__text {
  gap: 2px;
}

.quick-card__text strong {
  font-size: 13px;
  line-height: 1.2;
}

.quick-card__text small {
  font-size: 11px;
  line-height: 1.25;
}

.quick-card__icon {
  width: 36px;
  height: 36px;
  border-radius: 12px;
}

.quick-card__icon .el-icon {
  font-size: 16px;
}

.insight-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(320px, 0.92fr);
  gap: 18px;
  align-items: stretch;
}

.trend-panel,
.side-stack {
  height: var(--trend-panel-height);
  min-height: 0;
}

.side-stack {
  display: grid;
  grid-template-rows: var(--report-panel-height) minmax(0, 1fr);
  gap: 18px;
  align-items: stretch;
}

.side-stack > .panel {
  min-height: 0;
}

.side-stack > .report-panel {
  height: 100%;
  align-self: stretch;
}

.report-panel .panel-head {
  margin-bottom: 8px;
}

.panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.panel-head p {
  margin-top: 3px;
}

.panel-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(140, 157, 184, 0.28) transparent;
}

.panel-body--static {
  overflow: visible;
}

.panel-body:hover,
.table-scroll:hover {
  scrollbar-color: rgba(96, 115, 148, 0.56) transparent;
}

.panel-body::-webkit-scrollbar,
.table-scroll::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}

.panel-body::-webkit-scrollbar-thumb,
.table-scroll::-webkit-scrollbar-thumb {
  background: rgba(140, 157, 184, 0.28);
  border-radius: 999px;
}

.panel-body::-webkit-scrollbar-thumb:hover,
.table-scroll::-webkit-scrollbar-thumb:hover {
  background: rgba(96, 115, 148, 0.56);
}

.panel-body::-webkit-scrollbar-track,
.table-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.mini-select {
  width: 92px;
}

.mini-select :deep(.el-select__wrapper) {
  min-height: 36px;
}

.chart-legend {
  display: flex;
  gap: 14px;
  margin-bottom: 6px;
  font-size: 12px;
  color: var(--af-text-2);
}

.legend-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  margin-right: 8px;
  border-radius: 50%;
}

.legend-dot--blue {
  background: #2f6df6;
}

.legend-dot--green {
  background: #34b36b;
}

.trend-chart {
  width: 100%;
  height: 214px;
}

.chart-grid line {
  stroke: #ebf0f7;
  stroke-width: 1;
}

.chart-line {
  fill: none;
  stroke-width: 3.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.chart-line--blue {
  stroke: #2f6df6;
}

.chart-line--green {
  stroke: #34b36b;
}

.chart-point {
  stroke: #fff;
  stroke-width: 3;
}

.chart-point--blue {
  fill: #2f6df6;
}

.chart-point--green {
  fill: #34b36b;
}

.chart-value,
.chart-axis {
  font-size: 11px;
  text-anchor: middle;
  font-weight: 600;
}

.chart-value--blue {
  fill: #2f6df6;
}

.chart-value--green {
  fill: #34b36b;
}

.chart-axis {
  fill: #8797b5;
  font-weight: 500;
}

.table-scroll {
  min-height: 0;
  height: 100%;
  overflow: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(140, 157, 184, 0.28) transparent;
}

.warning-panel .table-scroll {
  overflow-x: auto;
  overflow-y: auto;
}

.simple-table {
  width: 100%;
  min-width: 560px;
  border-collapse: collapse;
  font-size: 12px;
}

.simple-table th,
.simple-table td {
  padding: 10px 8px;
  border-bottom: 1px solid #edf2f8;
  text-align: left;
  color: #526480;
}

.warning-panel .simple-table th,
.warning-panel .simple-table td {
  padding-top: 7px;
  padding-bottom: 7px;
}

.simple-table th {
  color: #7b8ba8;
  font-weight: 600;
  background: #fbfcff;
}

.simple-table td:first-child,
.simple-table td:nth-child(2) {
  color: var(--af-ink);
}

.warning-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 68px;
  height: 24px;
  padding: 0 9px;
  border-radius: 9px;
  font-size: 11px;
  font-weight: 600;
}

.warning-tag.danger {
  background: #fff1f1;
  color: #ef5b5b;
}

.warning-tag.warning {
  background: #fff4e7;
  color: #ff9a1f;
}

.activity-list,
.notice-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.activity-list {
  display: grid;
  gap: 12px;
  align-content: start;
}

.activity-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.activity-dot {
  width: 10px;
  height: 10px;
  margin-top: 6px;
  border-radius: 50%;
  background: var(--accent);
  flex-shrink: 0;
}

.activity-main {
  display: grid;
  gap: 3px;
}

.activity-main strong,
.notice-list strong {
  font-size: 13px;
  color: var(--af-ink);
}

.activity-main p,
.notice-list p {
  margin: 0;
  font-size: 12px;
  color: #4f6280;
}

.activity-main small {
  color: var(--af-text-3);
}

.notice-list {
  display: grid;
  gap: 14px;
  align-content: start;
}

.notice-list li {
  display: grid;
  grid-template-columns: 8px 82px minmax(0, 1fr);
  align-items: start;
  gap: 10px;
}

.notice-dot {
  width: 7px;
  height: 7px;
  margin-top: 6px;
  border-radius: 50%;
  background: #2f6df6;
}

.report-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 6px;
  grid-auto-rows: 1fr;
  align-content: start;
}

.report-card {
  min-height: 52px;
  padding: 8px 6px;
  gap: 4px;
  justify-content: center;
  justify-items: center;
  text-align: center;
}

.report-card__icon {
  width: 30px;
  height: 30px;
  border-radius: 10px;
}

.report-card__icon .el-icon {
  font-size: 14px;
}

.report-card span:last-child {
  font-size: 11px;
  line-height: 1.15;
  font-weight: 600;
  color: var(--af-ink);
}

.text-link {
  font-size: 12px;
  color: var(--af-brand);
  cursor: pointer;
  font-weight: 600;
}

@media (max-width: 1520px) {
  .priority-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .quick-panel {
    grid-column: 1 / -1;
  }

  .quick-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .insight-grid {
    grid-template-columns: 1fr;
  }

  .trend-panel,
  .side-stack {
    height: auto;
  }

  .side-stack {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-template-rows: none;
  }

  .report-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 1180px) {
  .priority-grid,
  .side-stack {
    grid-template-columns: 1fr;
  }

  .quick-panel {
    grid-column: auto;
  }

  .priority-grid > .panel,
  .trend-panel,
  .side-stack,
  .side-stack > .panel {
    height: auto;
  }

  .panel-body {
    overflow: visible;
  }
}

@media (max-width: 960px) {
  .dashboard-page {
    padding: 18px 16px 26px;
  }

  .hero-card {
    flex-direction: column;
    align-items: flex-start;
  }

  .hero-warehouse {
    width: 100%;
  }

  .stat-grid,
  .quick-grid,
  .report-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .stat-grid,
  .quick-grid,
  .report-grid {
    grid-template-columns: 1fr;
  }

  .notice-list li {
    grid-template-columns: 10px 1fr;
  }

  .notice-list p {
    grid-column: 2;
  }
}
</style>
