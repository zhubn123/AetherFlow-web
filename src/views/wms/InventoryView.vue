<template>
  <div class="wms-page">
    <header class="page-header">
      <div class="page-header__main">
        <p class="page-header__eyebrow">Inventory Workspace</p>
        <h1>库存总览</h1>
        <p>围绕库存列表、库存流水、预警和基础资料维护，统一展示当前库存状态与入口。</p>
      </div>
      <div class="actions-row page-header__actions">
        <el-button plain :icon="Download" disabled>导出</el-button>
        <el-button type="primary" :icon="DataAnalysis" @click="go('/wms/inventory-adjustments')">库存流水</el-button>
      </div>
    </header>

    <section class="panel page-route-strip">
      <div class="route-pill-grid">
        <button
          v-for="item in routePills"
          :key="item.key"
          class="route-pill"
          :class="{ 'is-active': item.active }"
          type="button"
          @click="go(item.path)"
        >
          <el-icon><component :is="item.icon" /></el-icon>
          <span>{{ item.label }}</span>
        </button>
      </div>
    </section>

    <section class="panel">
      <div class="panel-header">
        <div>
          <h3>筛选条件</h3>
          <span class="panel-tip">按仓库、区域、库位、物料范围组合过滤</span>
        </div>
        <el-button text @click="filtersCollapsed = !filtersCollapsed">
          {{ filtersCollapsed ? '展开' : '收起' }}
        </el-button>
      </div>
      <el-collapse-transition>
        <div v-show="!filtersCollapsed">
          <div class="field-grid">
            <div class="field">
              <label>仓库</label>
              <el-select v-model="queryWarehouseId" placeholder="请选择仓库" clearable @change="onWarehouseChange">
                <el-option
                  v-for="item in warehouseOptions"
                  :key="String(item.id)"
                  :label="`${item.warehouseCode} - ${item.warehouseName}`"
                  :value="String(item.id)"
                />
              </el-select>
            </div>
            <div class="field">
              <label>区域</label>
              <el-select v-model="queryAreaId" placeholder="请选择区域" clearable @change="onAreaChange">
                <el-option
                  v-for="item in areaOptions"
                  :key="String(item.id)"
                  :label="`${item.areaCode} - ${item.areaName}`"
                  :value="String(item.id)"
                />
              </el-select>
            </div>
            <div class="field">
              <label>库位</label>
              <el-select v-model="queryLocationId" placeholder="请选择库位" clearable>
                <el-option
                  v-for="item in locationOptions"
                  :key="String(item.id)"
                  :label="`${item.locationCode} - ${item.locationName}`"
                  :value="String(item.id)"
                />
              </el-select>
            </div>
            <div class="field">
              <label>物料</label>
              <el-select v-model="queryMaterialId" placeholder="请选择物料" clearable>
                <el-option
                  v-for="item in materialOptions"
                  :key="String(item.id)"
                  :label="`${item.materialCode} - ${item.materialName}`"
                  :value="String(item.id)"
                />
              </el-select>
            </div>
            <div class="field">
              <label>库存下限</label>
              <el-input-number v-model="query.minQuantity" :min="0" :step="1" placeholder="可选" />
            </div>
            <div class="field">
              <label>库存上限</label>
              <el-input-number v-model="query.maxQuantity" :min="0" :step="1" placeholder="可选" />
            </div>
          </div>
          <div class="actions-row">
            <el-button type="primary" :icon="Search" :disabled="loading" @click="handleSearch">查询</el-button>
            <el-button :icon="RefreshRight" :disabled="loading" @click="resetQuery">重置</el-button>
          </div>
        </div>
      </el-collapse-transition>
    </section>

    <div class="metric-grid">
      <article v-for="item in metrics" :key="item.key" class="metric-card">
        <div class="metric-card__icon" :style="{ '--accent': item.color }">
          <el-icon><component :is="item.icon" /></el-icon>
        </div>
        <div>
          <p class="metric-card__label">{{ item.label }}</p>
          <p class="metric-card__value">{{ item.value }}</p>
          <p class="metric-card__meta">{{ item.meta }}</p>
        </div>
      </article>
    </div>

    <div class="page-split">
      <div class="page-main">
        <section class="panel">
          <div class="toolbar-row">
            <div class="toolbar-row__left">
              <h3 class="panel-title-inline">库存明细列表</h3>
            </div>
            <div class="toolbar-row__right">
              <el-button plain :disabled="loading" @click="detailsCollapsed = !detailsCollapsed">
                {{ detailsCollapsed ? '展开分析' : '收起分析' }}
              </el-button>
              <el-button plain :icon="Setting" disabled>列设置</el-button>
              <el-button plain :icon="Download" disabled>导出明细</el-button>
            </div>
          </div>
          <el-alert v-if="errorMessage" class="message" type="error" :closable="false" :show-icon="true" :title="errorMessage" />
          <el-table :data="rows" v-loading="loading" empty-text="暂无数据">
            <el-table-column label="物料编码" min-width="120">
              <template #default="{ row }">{{ row.materialCode || '-' }}</template>
            </el-table-column>
            <el-table-column label="物料名称" min-width="150">
              <template #default="{ row }">{{ row.materialName || '-' }}</template>
            </el-table-column>
            <el-table-column label="仓库" min-width="130">
              <template #default="{ row }">{{ row.warehouseName || renderWarehouse(row) }}</template>
            </el-table-column>
            <el-table-column label="区域" min-width="120">
              <template #default="{ row }">{{ row.areaName || renderArea(row) }}</template>
            </el-table-column>
            <el-table-column label="库位" min-width="120">
              <template #default="{ row }">{{ row.locationName || renderLocation(row) }}</template>
            </el-table-column>
            <el-table-column prop="quantity" label="当前库存" min-width="110" align="right" />
            <el-table-column prop="lockedQuantity" label="锁定库存" min-width="110" align="right" />
            <el-table-column label="可用库存" min-width="110" align="right">
              <template #default="{ row }">{{ formatQuantity(availableQuantity(row)) }}</template>
            </el-table-column>
            <el-table-column label="状态" min-width="100">
              <template #default="{ row }">
                <span
                  class="status-badge"
                  :class="resolveStatusClass(row)"
                >
                  {{ resolveStatusText(row) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="操作" min-width="90" fixed="right">
              <template #default>
                <el-button link type="primary" size="small">详情</el-button>
              </template>
            </el-table-column>
          </el-table>
          <WmsPagination
            :current-page="query.pageNo"
            :page-size="query.pageSize"
            :total="total"
            :pages="pages"
            :disabled="loading"
            @current-change="onPageChange"
            @page-size-change="onPageSizeChange"
          />
        </section>
      </div>

      <el-collapse-transition>
        <aside v-show="!detailsCollapsed" class="page-aside">
        <section class="side-panel">
          <div class="side-panel__head">
            <h3>库存分布（按仓库）</h3>
          </div>
          <div class="distribution-card">
            <div class="distribution-ring" :style="{ background: `conic-gradient(${distributionGradient})` }">
              <div class="distribution-ring__inner">
                <strong>{{ formatQuantity(totalQuantity) }}</strong>
                <span>库存总数量</span>
              </div>
            </div>
            <ul class="distribution-list">
              <li v-for="item in warehouseDistribution" :key="item.label">
                <i class="distribution-color" :style="{ background: item.color }"></i>
                <span>{{ item.label }}</span>
                <strong>{{ item.quantity }}（{{ item.ratio }}）</strong>
              </li>
            </ul>
          </div>
        </section>

        <section class="side-panel">
          <div class="side-panel__head">
            <div>
              <h3>库存预警 Top 5</h3>
              <span class="panel-tip">按可用库存从低到高排序</span>
            </div>
          </div>
          <table class="mini-table">
            <thead>
              <tr>
                <th>物料</th>
                <th>当前库存</th>
                <th>预警</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in warningRows" :key="`${item.materialCode}-${item.locationId}`">
                <td>{{ item.materialCode || item.materialName || '-' }}</td>
                <td>{{ formatQuantity(normalizeNumber(item.quantity)) }}</td>
                <td>
                  <span class="warning-chip" :class="resolveWarningLevel(item)">
                    {{ resolveStatusText(item) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </section>
        </aside>
      </el-collapse-transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  Box,
  DataAnalysis,
  Download,
  Goods,
  Grid,
  Money,
  OfficeBuilding,
  RefreshRight,
  Search,
  Setting,
  WarningFilled
} from '@element-plus/icons-vue'
import WmsPagination from '@/components/WmsPagination.vue'
import { queryAreas, queryInventories, queryLocations, queryMaterials, queryWarehouses, type InventoryQuery } from '@/api/wms'
import type { Area, Inventory, Location, Material, Warehouse } from '@/types/wms'

const router = useRouter()
const loading = ref(false)
const rows = ref<Inventory[]>([])
const total = ref(0)
const pages = ref(0)
const errorMessage = ref('')
const queryWarehouseId = ref('')
const queryAreaId = ref('')
const queryLocationId = ref('')
const queryMaterialId = ref('')
const warehouseOptions = ref<Warehouse[]>([])
const areaOptions = ref<Area[]>([])
const locationOptions = ref<Location[]>([])
const materialOptions = ref<Material[]>([])
const filtersCollapsed = ref(false)
const detailsCollapsed = ref(false)

const routePills = [
  { key: 'stocks', label: '库存列表', path: '/wms/stocks', icon: Box, active: true },
  { key: 'flow', label: '库存流水', path: '/wms/inventory-adjustments', icon: DataAnalysis, active: false },
  { key: 'warning', label: '库存预警', path: '/dashboard', icon: WarningFilled, active: false },
  { key: 'warehouse', label: '仓库管理', path: '/wms/warehouses', icon: OfficeBuilding, active: false },
  { key: 'location', label: '库位管理', path: '/wms/locations', icon: Grid, active: false },
  { key: 'material', label: '物料管理', path: '/wms/materials', icon: Goods, active: false }
] as const

const query = reactive<InventoryQuery>({
  pageNo: 1,
  pageSize: 10,
  warehouseId: undefined,
  areaId: undefined,
  locationId: undefined,
  materialId: undefined,
  minQuantity: undefined,
  maxQuantity: undefined
})

const totalQuantity = computed(() => {
  return rows.value.reduce((sum, item) => sum + normalizeNumber(item.quantity), 0)
})

const totalLockedQuantity = computed(() => {
  return rows.value.reduce((sum, item) => sum + normalizeNumber(item.lockedQuantity), 0)
})

const occupiedLocationCount = computed(() => {
  return new Set(rows.value.map((item) => String(item.locationId))).size
})

const warningCount = computed(() => {
  return rows.value.filter((item) => availableQuantity(item) < 20).length
})

const totalStockValue = computed(() => {
  return rows.value.reduce((sum, item) => {
    return sum + normalizeNumber(item.quantity) * resolveUnitPrice(item.materialCode)
  }, 0)
})

const metrics = computed(() => {
  return [
    { key: 'materials', label: '库存物料数', value: String(rows.value.length), meta: '当前页统计', color: '#5b8cff', icon: Box },
    { key: 'quantity', label: '库存总数量', value: formatQuantity(totalQuantity.value), meta: `锁定 ${formatQuantity(totalLockedQuantity.value)}`, color: '#34b36b', icon: Grid },
    { key: 'value', label: '库存总金额', value: `¥ ${Math.round(totalStockValue.value).toLocaleString('zh-CN')}`, meta: '按示例单价估算', color: '#ff9a1f', icon: Money },
    { key: 'warning', label: '库存预警数', value: String(warningCount.value), meta: `占用库位 ${occupiedLocationCount.value}`, color: '#ff6b6b', icon: WarningFilled }
  ]
})

const warehouseDistribution = computed(() => {
  const colors = ['#2f6df6', '#34b36b', '#ff9a1f', '#8b5cf6', '#22b8cf', '#d1d8e4']
  const grouped = new Map<string, number>()
  rows.value.forEach((item) => {
    const label = item.warehouseName || item.warehouseCode || `仓库#${item.warehouseId}`
    grouped.set(label, (grouped.get(label) ?? 0) + normalizeNumber(item.quantity))
  })

  const totalValue = totalQuantity.value || 1
  return Array.from(grouped.entries()).map(([label, quantity], index) => ({
    label,
    quantity: formatQuantity(quantity),
    ratio: `${((quantity / totalValue) * 100).toFixed(1)}%`,
    rawQuantity: quantity,
    color: colors[index % colors.length]
  }))
})

const distributionGradient = computed(() => {
  if (warehouseDistribution.value.length === 0) {
    return '#dbe3f0 0 100%'
  }

  let start = 0
  const totalValue = totalQuantity.value || 1
  return warehouseDistribution.value
    .map((item) => {
      const end = start + (item.rawQuantity / totalValue) * 100
      const segment = `${item.color} ${start.toFixed(2)}% ${end.toFixed(2)}%`
      start = end
      return segment
    })
    .join(', ')
})

const warningRows = computed(() => {
  return [...rows.value]
    .sort((left, right) => availableQuantity(left) - availableQuantity(right))
    .slice(0, 5)
})

function normalizeNumberRange(): void {
  if (query.minQuantity !== undefined && Number.isNaN(query.minQuantity)) {
    query.minQuantity = undefined
  }
  if (query.maxQuantity !== undefined && Number.isNaN(query.maxQuantity)) {
    query.maxQuantity = undefined
  }
}

function normalizeQuery(): void {
  query.warehouseId = queryWarehouseId.value ? queryWarehouseId.value : undefined
  query.areaId = queryAreaId.value ? queryAreaId.value : undefined
  query.locationId = queryLocationId.value ? queryLocationId.value : undefined
  query.materialId = queryMaterialId.value ? queryMaterialId.value : undefined
}

async function loadAreaOptions(): Promise<void> {
  if (!queryWarehouseId.value) {
    areaOptions.value = []
    return
  }
  const result = await queryAreas({ pageNo: 1, pageSize: 200, warehouseId: queryWarehouseId.value, status: 0 })
  areaOptions.value = result.records
}

async function loadLocationOptions(): Promise<void> {
  const result = await queryLocations({
    pageNo: 1,
    pageSize: 200,
    warehouseId: queryWarehouseId.value || undefined,
    areaId: queryAreaId.value || undefined,
    status: 0
  })
  locationOptions.value = result.records
}

async function onWarehouseChange(): Promise<void> {
  queryAreaId.value = ''
  queryLocationId.value = ''
  await loadAreaOptions()
  await loadLocationOptions()
}

async function onAreaChange(): Promise<void> {
  queryLocationId.value = ''
  await loadLocationOptions()
}

function resetQuery(): void {
  query.pageNo = 1
  queryWarehouseId.value = ''
  queryAreaId.value = ''
  queryLocationId.value = ''
  queryMaterialId.value = ''
  query.warehouseId = undefined
  query.areaId = undefined
  query.locationId = undefined
  query.materialId = undefined
  query.minQuantity = undefined
  query.maxQuantity = undefined
  areaOptions.value = []
  void loadLocationOptions()
  void loadData()
}

function handleSearch(): void {
  query.pageNo = 1
  void loadData()
}

async function loadData(): Promise<void> {
  errorMessage.value = ''
  normalizeQuery()
  normalizeNumberRange()
  loading.value = true
  try {
    const result = await queryInventories(query)
    rows.value = result.records
    total.value = result.total
    pages.value = Math.max(result.pages, 1)
    query.pageNo = result.pageNo
    query.pageSize = result.pageSize
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '库存加载失败'
  } finally {
    loading.value = false
  }
}

async function loadOptions(): Promise<void> {
  const [warehouses, materialsPage] = await Promise.all([
    queryWarehouses({ pageNo: 1, pageSize: 200 }),
    queryMaterials({ pageNo: 1, pageSize: 200, status: 0 })
  ])
  warehouseOptions.value = warehouses
  materialOptions.value = materialsPage.records
  await loadLocationOptions()
}

function renderWarehouse(row: Inventory): string {
  if (row.warehouseCode || row.warehouseName) {
    const code = row.warehouseCode || '-'
    const name = row.warehouseName || '-'
    return `${code} - ${name}`
  }
  const found = warehouseOptions.value.find((item) => String(item.id) === String(row.warehouseId))
  if (!found) {
    return `#${row.warehouseId}`
  }
  return `${found.warehouseCode} - ${found.warehouseName}`
}

function renderArea(row: Inventory): string {
  if (row.areaCode || row.areaName) {
    const code = row.areaCode || '-'
    const name = row.areaName || '-'
    return `${code} - ${name}`
  }
  if (!row.areaId) {
    return '-'
  }
  const found = areaOptions.value.find((item) => String(item.id) === String(row.areaId))
  if (!found) {
    return `#${row.areaId}`
  }
  return `${found.areaCode} - ${found.areaName}`
}

function renderLocation(row: Inventory): string {
  if (row.locationCode || row.locationName) {
    const code = row.locationCode || '-'
    const name = row.locationName || '-'
    return `${code} - ${name}`
  }
  const found = locationOptions.value.find((item) => String(item.id) === String(row.locationId))
  if (!found) {
    return `#${row.locationId}`
  }
  return `${found.locationCode} - ${found.locationName}`
}

function availableQuantity(row: Inventory): number {
  return normalizeNumber(row.quantity) - normalizeNumber(row.lockedQuantity)
}

function resolveStatusText(row: Inventory): string {
  const available = availableQuantity(row)
  if (available <= 10) {
    return '库存不足'
  }
  if (available <= 30) {
    return '低于安全库存'
  }
  return '库存正常'
}

function resolveStatusClass(row: Inventory): string {
  const available = availableQuantity(row)
  if (available <= 10) {
    return 'status-badge--danger'
  }
  if (available <= 30) {
    return 'status-badge--warning'
  }
  return 'status-badge--success'
}

function resolveWarningLevel(row: Inventory): string {
  const available = availableQuantity(row)
  return available <= 10 ? 'danger' : available <= 30 ? 'warning' : 'safe'
}

function resolveUnitPrice(materialCode?: string): number {
  if (!materialCode) {
    return 18
  }
  const priceMap: Record<string, number> = {
    MAT10023: 15,
    MAT10045: 3,
    MAT10067: 44,
    MAT10089: 6,
    MAT10105: 8
  }
  return priceMap[materialCode] ?? 18
}

function normalizeNumber(value: number | string | undefined): number {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function formatQuantity(value: number): string {
  return value.toLocaleString('zh-CN', {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2
  })
}

function onPageChange(pageNo: number): void {
  if (pageNo === query.pageNo) {
    return
  }
  query.pageNo = pageNo
  void loadData()
}

function onPageSizeChange(pageSize: number): void {
  query.pageNo = 1
  query.pageSize = pageSize
  void loadData()
}

function go(path: string): void {
  void router.push(path)
}

onMounted(async () => {
  await loadOptions()
  await loadData()
})
</script>

<style scoped src="./wms-page.css"></style>
<style scoped>
.page-header__actions {
  margin-top: 0;
}

.panel-title-inline {
  margin: 0;
  font-size: 16px;
  color: var(--af-ink);
}

.distribution-card {
  display: grid;
  gap: 18px;
}

.distribution-ring {
  width: 196px;
  height: 196px;
  margin: 0 auto;
  border-radius: 50%;
  display: grid;
  place-items: center;
}

.distribution-ring__inner {
  width: 128px;
  height: 128px;
  border-radius: 50%;
  background: #fff;
  display: grid;
  place-items: center;
  text-align: center;
}

.distribution-ring__inner strong {
  font-size: 24px;
  color: var(--af-ink);
}

.distribution-ring__inner span {
  font-size: 13px;
  color: var(--af-text-2);
}

.distribution-list,
.mini-table {
  width: 100%;
}

.distribution-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 10px;
}

.distribution-list li {
  display: grid;
  grid-template-columns: 14px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: #526480;
}

.distribution-color {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.distribution-list strong {
  color: var(--af-ink);
}

.mini-table {
  border-collapse: collapse;
  font-size: 13px;
}

.mini-table th,
.mini-table td {
  padding: 10px 8px;
  border-bottom: 1px solid #edf2f8;
  text-align: left;
}

.mini-table th {
  color: #7c8ba5;
  font-weight: 600;
  background: #fbfcff;
}

.warning-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 74px;
  height: 26px;
  padding: 0 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
}

.warning-chip.danger {
  background: #fff1f1;
  color: #ef5b5b;
}

.warning-chip.warning {
  background: #fff4e7;
  color: #ff9a1f;
}

.warning-chip.safe {
  background: #ecfbf1;
  color: #2ba85d;
}
</style>
