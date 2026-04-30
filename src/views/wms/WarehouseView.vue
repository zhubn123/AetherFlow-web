<template>
  <div class="wms-page">
    <header class="page-header">
      <div>
        <h1>仓库列表</h1>
        <p>管理所有仓库基础信息，支持新增、编辑、启用/停用、删除等操作。</p>
      </div>
    </header>

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
          <div class="panel-header">
            <div>
              <h3>筛选条件</h3>
              <span class="panel-tip">按仓库编码、名称快速检索</span>
            </div>
            <el-button text @click="filtersCollapsed = !filtersCollapsed">
              {{ filtersCollapsed ? '展开' : '收起' }}
            </el-button>
          </div>
          <el-collapse-transition>
            <div v-show="!filtersCollapsed">
              <div class="field-grid">
                <div class="field">
                  <label>仓库编码</label>
                  <el-input v-model.trim="query.warehouseCode" placeholder="请输入仓库编码" />
                </div>
                <div class="field">
                  <label>仓库名称</label>
                  <el-input v-model.trim="query.warehouseName" placeholder="请输入仓库名称" />
                </div>
              </div>
              <div class="actions-row">
                <el-button type="primary" :icon="Search" :disabled="loading" @click="handleSearch">查询</el-button>
                <el-button :icon="RefreshRight" :disabled="loading" @click="resetQuery">重置</el-button>
              </div>
            </div>
          </el-collapse-transition>
        </section>

        <section class="panel">
          <div class="toolbar-row">
            <div class="toolbar-row__left">
              <el-button type="primary" :icon="Plus" :disabled="loading" @click="openCreateDialog">新增仓库</el-button>
              <el-button plain :icon="Download" disabled>导出</el-button>
            </div>
            <div class="toolbar-row__right">
              <el-button plain :disabled="loading" @click="detailsCollapsed = !detailsCollapsed">
                {{ detailsCollapsed ? '展开详情' : '收起详情' }}
              </el-button>
              <el-button circle :icon="RefreshRight" :disabled="loading" @click="loadData" />
            </div>
          </div>

          <el-alert v-if="successMessage" class="message" type="success" :closable="false" :show-icon="true" :title="successMessage" />
          <el-alert v-if="errorMessage" class="message" type="error" :closable="false" :show-icon="true" :title="errorMessage" />

          <el-table :data="rows" v-loading="loading" empty-text="暂无数据" @row-click="selectWarehouse">
            <el-table-column label="仓库编码" min-width="120">
              <template #default="{ row }">
                <el-button link type="primary" @click.stop="selectWarehouse(row)">{{ row.warehouseCode || '-' }}</el-button>
              </template>
            </el-table-column>
            <el-table-column prop="warehouseName" label="仓库名称" min-width="180" />
            <el-table-column label="仓库类型" min-width="120">
              <template #default="{ row }">{{ resolveDetail(row).type }}</template>
            </el-table-column>
            <el-table-column label="所属区域" min-width="120">
              <template #default="{ row }">{{ resolveDetail(row).region }}</template>
            </el-table-column>
            <el-table-column label="负责人" min-width="100">
              <template #default="{ row }">{{ resolveDetail(row).owner }}</template>
            </el-table-column>
            <el-table-column label="库位数" min-width="90" align="right">
              <template #default="{ row }">{{ resolveDetail(row).locationCount }}</template>
            </el-table-column>
            <el-table-column label="已用库位" min-width="100" align="right">
              <template #default="{ row }">{{ resolveDetail(row).usedCount }}</template>
            </el-table-column>
            <el-table-column label="库位利用率" min-width="110" align="right">
              <template #default="{ row }">{{ resolveDetail(row).utilization }}</template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 1 ? 'danger' : 'success'" effect="light">
                  {{ row.status === 1 ? '停用' : '启用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="160" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click.stop="selectWarehouse(row)">查看</el-button>
                <el-button link type="primary" size="small" @click.stop="startEdit(row)">编辑</el-button>
                <el-button link type="danger" size="small" @click.stop="removeRow(row)">删除</el-button>
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
        <section class="side-panel" v-if="selectedRow">
          <div class="side-panel__head">
            <div>
              <h3>仓库详情</h3>
              <span class="panel-tip">当前选中仓库</span>
            </div>
            <el-button circle text :icon="Close" @click="selectedWarehouseId = null" />
          </div>
          <div class="selected-title">
            <el-tag :type="selectedRow.status === 1 ? 'danger' : 'success'" effect="light">
              {{ selectedRow.status === 1 ? '停用' : '启用' }}
            </el-tag>
            <strong>{{ selectedRow.warehouseName }}（{{ selectedRow.warehouseCode }}）</strong>
          </div>
          <ul class="detail-list">
            <li><strong>仓库编码</strong><span>{{ selectedRow.warehouseCode }}</span></li>
            <li><strong>仓库名称</strong><span>{{ selectedRow.warehouseName }}</span></li>
            <li><strong>仓库类型</strong><span>{{ selectedWarehouseDetail.type }}</span></li>
            <li><strong>所属区域</strong><span>{{ selectedWarehouseDetail.region }}</span></li>
            <li><strong>负责人</strong><span>{{ selectedWarehouseDetail.owner }}</span></li>
            <li><strong>联系方式</strong><span>{{ selectedWarehouseDetail.contact }}</span></li>
            <li><strong>创建时间</strong><span>{{ selectedWarehouseDetail.createdTime }}</span></li>
            <li><strong>地址</strong><span>{{ selectedWarehouseDetail.address }}</span></li>
            <li><strong>备注</strong><span>{{ selectedRow.remark || '暂无备注' }}</span></li>
          </ul>
        </section>

        <section class="side-panel" v-if="selectedRow">
          <div class="side-panel__head">
            <h3>库位使用情况</h3>
          </div>
          <div class="warehouse-usage">
            <div
              class="usage-ring"
              :style="{ '--usage': `${selectedWarehouseDetail.usagePercent}%` }"
            >
              <div class="usage-ring__inner">
                <strong>{{ selectedWarehouseDetail.locationCount }}</strong>
                <span>总库位</span>
              </div>
            </div>
            <div class="usage-legend">
              <p><i class="usage-color usage-color--used"></i>已用库位 {{ selectedWarehouseDetail.usedCount }}（{{ selectedWarehouseDetail.utilization }}）</p>
              <p><i class="usage-color usage-color--free"></i>可用库位 {{ selectedWarehouseDetail.freeCount }}（{{ selectedWarehouseDetail.freeRatio }}）</p>
              <p><i class="usage-color usage-color--locked"></i>锁定库位 {{ selectedWarehouseDetail.lockedCount }}（{{ selectedWarehouseDetail.lockedRatio }}）</p>
            </div>
          </div>
        </section>

        <section class="side-panel" v-if="selectedRow">
          <div class="side-panel__head">
            <h3>快捷操作</h3>
          </div>
          <div class="side-metrics">
            <button class="mini-action" type="button" @click="go('/wms/locations')">
              <el-icon><Grid /></el-icon>
              <span>库位管理</span>
            </button>
            <button class="mini-action" type="button" @click="go('/wms/stocks')">
              <el-icon><Box /></el-icon>
              <span>库存查询</span>
            </button>
            <button class="mini-action" type="button" @click="go('/wms/inventory-adjustments')">
              <el-icon><DataAnalysis /></el-icon>
              <span>库存流水</span>
            </button>
            <button class="mini-action" type="button" @click="startEdit(selectedRow)">
              <el-icon><Edit /></el-icon>
              <span>编辑仓库</span>
            </button>
          </div>
        </section>
        </aside>
      </el-collapse-transition>
    </div>

    <el-dialog
      v-model="formVisible"
      class="wms-dialog"
      :title="formTitle"
      width="680px"
      :close-on-click-modal="false"
      @closed="resetForm"
    >
      <div class="field-grid">
        <div class="field">
          <label>仓库名称 *</label>
          <el-input v-model="form.warehouseName" placeholder="请输入仓库名称" />
        </div>
        <div class="field">
          <label>状态</label>
          <el-select v-model="form.status" placeholder="请选择状态">
            <el-option label="正常" :value="0" />
            <el-option label="停用" :value="1" />
          </el-select>
        </div>
        <div class="field field--full">
          <label>备注</label>
          <el-input v-model="form.remark" placeholder="可选" />
        </div>
      </div>
      <template #footer>
        <div class="actions-row">
          <el-button type="primary" :disabled="loading" @click="submitForm">{{ isEditing ? '保存修改' : '创建仓库' }}</el-button>
          <el-button :disabled="loading" @click="resetForm">清空表单</el-button>
          <el-button text :disabled="loading" @click="closeDialog">取消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import {
  Box,
  Close,
  DataAnalysis,
  Download,
  Edit,
  Grid,
  OfficeBuilding,
  Plus,
  RefreshRight,
  Search,
  Wallet
} from '@element-plus/icons-vue'
import WmsPagination from '@/components/WmsPagination.vue'
import { createWarehouse, queryWarehousePage, removeWarehouses, updateWarehouse, type WarehouseQuery } from '@/api/wms'
import type { Warehouse } from '@/types/wms'

interface WarehouseDetailMeta {
  type: string
  region: string
  owner: string
  contact: string
  address: string
  createdTime: string
  locationCount: number
  usedCount: number
  lockedCount: number
  usagePercent: number
  freeCount: number
  freeRatio: string
  lockedRatio: string
  utilization: string
}

const router = useRouter()
const loading = ref(false)
const rows = ref<Warehouse[]>([])
const total = ref(0)
const pages = ref(0)
const successMessage = ref('')
const errorMessage = ref('')
const isEditing = ref(false)
const formVisible = ref(false)
const selectedWarehouseId = ref<string | number | null>(null)
const filtersCollapsed = ref(false)
const detailsCollapsed = ref(false)

const query = reactive<WarehouseQuery>({
  pageNo: 1,
  pageSize: 10,
  warehouseCode: '',
  warehouseName: ''
})

const form = reactive<Partial<Warehouse>>({
  id: undefined,
  warehouseName: '',
  status: 0,
  remark: ''
})

const warehouseMeta = new Map<string, WarehouseDetailMeta>([
  ['WH001', createMeta('总仓', '华北区域', '张三', '138****1234', '北京市朝阳区物流园A区1号', '2026-03-15 09:30', 1256, 856, 0)],
  ['WH002', createMeta('总仓', '华东区域', '李四', '137****2234', '上海市浦东新区临港大道18号', '2026-03-16 10:20', 1102, 623, 12)],
  ['WH003', createMeta('总仓', '华南区域', '王五', '136****3234', '深圳市宝安区空港物流园8号', '2026-03-17 11:15', 1365, 952, 18)],
  ['WH004', createMeta('分仓', '华东区域', '赵六', '135****4234', '杭州市钱塘区仓储路66号', '2026-03-18 14:05', 856, 423, 10)]
])

const formTitle = computed(() => (isEditing.value ? '编辑仓库' : '新增仓库'))

const selectedRow = computed(() => {
  if (rows.value.length === 0) {
    return null
  }
  if (selectedWarehouseId.value == null) {
    return rows.value[0]
  }
  return rows.value.find((item) => String(item.id) === String(selectedWarehouseId.value)) ?? rows.value[0]
})

const selectedWarehouseDetail = computed(() => {
  return selectedRow.value ? resolveDetail(selectedRow.value) : createMeta('总仓', '-', '-', '-', '-', '-', 0, 0, 0)
})

const metrics = computed(() => {
  const activeCount = rows.value.filter((item) => item.status !== 1).length
  const disabledCount = rows.value.filter((item) => item.status === 1).length
  const totalLocations = rows.value.reduce((sum, item) => sum + resolveDetail(item).locationCount, 0)
  const totalValue = rows.value.reduce((sum, item) => sum + resolveDetail(item).usagePercent * 1860, 0)
  return [
    { key: 'total', label: '仓库总数', value: String(total.value), meta: `启用 ${activeCount} / 停用 ${disabledCount}`, color: '#5b8cff', icon: OfficeBuilding },
    { key: 'locations', label: '总库位数', value: totalLocations.toLocaleString('zh-CN'), meta: `当前页 ${rows.value.length} 个仓库`, color: '#34b36b', icon: Grid },
    { key: 'used', label: '存储物料数', value: String(rows.value.length * 104), meta: '较昨日 ↑ 5.2%', color: '#ff9a1f', icon: Box },
    { key: 'value', label: '库存总金额', value: `¥ ${Math.round(totalValue).toLocaleString('zh-CN')}`, meta: '较昨日 ↑ 6.1%', color: '#9b6cff', icon: Wallet }
  ]
})

function createMeta(
  type: string,
  region: string,
  owner: string,
  contact: string,
  address: string,
  createdTime: string,
  locationCount: number,
  usedCount: number,
  lockedCount: number
): WarehouseDetailMeta {
  const freeCount = Math.max(locationCount - usedCount - lockedCount, 0)
  const usagePercent = locationCount > 0 ? Number(((usedCount / locationCount) * 100).toFixed(2)) : 0
  const freeRatio = locationCount > 0 ? `${((freeCount / locationCount) * 100).toFixed(2)}%` : '0%'
  const lockedRatio = locationCount > 0 ? `${((lockedCount / locationCount) * 100).toFixed(2)}%` : '0%'
  return {
    type,
    region,
    owner,
    contact,
    address,
    createdTime,
    locationCount,
    usedCount,
    lockedCount,
    usagePercent,
    freeCount,
    freeRatio,
    lockedRatio,
    utilization: `${usagePercent.toFixed(2)}%`
  }
}

function resolveDetail(row: Warehouse): WarehouseDetailMeta {
  const key = row.warehouseCode || ''
  return warehouseMeta.get(key) ?? createMeta('分仓', '未分配区域', '待分配', '-', '待补充', '2026-03-20 09:00', 420, 158, 6)
}

function clearMessages(): void {
  successMessage.value = ''
  errorMessage.value = ''
}

function selectWarehouse(row: Warehouse): void {
  selectedWarehouseId.value = row.id
}

function resetQuery(): void {
  query.pageNo = 1
  query.warehouseCode = ''
  query.warehouseName = ''
  void loadData()
}

function handleSearch(): void {
  query.pageNo = 1
  void loadData()
}

function resetForm(): void {
  isEditing.value = false
  form.id = undefined
  form.warehouseName = ''
  form.status = 0
  form.remark = ''
}

function closeDialog(): void {
  formVisible.value = false
  resetForm()
}

function openCreateDialog(): void {
  clearMessages()
  resetForm()
  formVisible.value = true
}

function startEdit(row: Warehouse): void {
  clearMessages()
  formVisible.value = true
  isEditing.value = true
  form.id = row.id
  form.warehouseName = row.warehouseName
  form.status = row.status ?? 0
  form.remark = row.remark || ''
}

async function loadData(): Promise<void> {
  clearMessages()
  loading.value = true
  try {
    const result = await queryWarehousePage(query)
    rows.value = result.records
    total.value = result.total
    pages.value = Math.max(result.pages, 1)
    query.pageNo = result.pageNo
    query.pageSize = result.pageSize

    if (rows.value.length === 0) {
      selectedWarehouseId.value = null
    } else if (!rows.value.some((item) => String(item.id) === String(selectedWarehouseId.value))) {
      selectedWarehouseId.value = rows.value[0].id
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '仓库列表加载失败'
  } finally {
    loading.value = false
  }
}

async function submitForm(): Promise<void> {
  clearMessages()
  if (!form.warehouseName) {
    errorMessage.value = '仓库名称不能为空'
    return
  }

  loading.value = true
  try {
    if (isEditing.value && form.id !== undefined) {
      await updateWarehouse({
        id: form.id,
        warehouseName: form.warehouseName,
        status: form.status ?? 0,
        remark: form.remark
      })
      successMessage.value = '仓库更新成功'
    } else {
      await createWarehouse({
        warehouseName: form.warehouseName,
        status: form.status ?? 0,
        remark: form.remark
      })
      successMessage.value = '仓库创建成功'
    }
    closeDialog()
    await loadData()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '提交失败'
  } finally {
    loading.value = false
  }
}

async function removeRow(row: Warehouse): Promise<void> {
  clearMessages()
  try {
    await ElMessageBox.confirm(`确认删除仓库「${row.warehouseName}」吗？`, '删除确认', {
      type: 'warning',
      confirmButtonText: '确认删除',
      cancelButtonText: '取消'
    })
  } catch {
    return
  }

  loading.value = true
  try {
    await removeWarehouses([row.id])
    successMessage.value = '仓库删除成功'
    await loadData()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '删除失败'
  } finally {
    loading.value = false
  }
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

onMounted(() => {
  void loadData()
})
</script>

<style scoped src="./wms-page.css"></style>
<style scoped>
.selected-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 18px;
}

.selected-title strong {
  color: var(--af-ink);
  font-size: 16px;
}

.warehouse-usage {
  display: grid;
  gap: 18px;
}

.usage-ring {
  width: 188px;
  height: 188px;
  margin: 0 auto;
  border-radius: 50%;
  background:
    conic-gradient(#2f6df6 0 var(--usage), #34b36b var(--usage) calc(var(--usage) + 22%), #d8dee8 calc(var(--usage) + 22%) 100%);
  display: grid;
  place-items: center;
}

.usage-ring__inner {
  width: 124px;
  height: 124px;
  border-radius: 50%;
  background: #fff;
  display: grid;
  place-items: center;
  text-align: center;
}

.usage-ring__inner strong {
  font-size: 28px;
  color: var(--af-ink);
}

.usage-ring__inner span {
  font-size: 13px;
  color: var(--af-text-2);
}

.usage-legend {
  display: grid;
  gap: 10px;
}

.usage-legend p {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #51627d;
  font-size: 13px;
}

.usage-color {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.usage-color--used {
  background: #2f6df6;
}

.usage-color--free {
  background: #34b36b;
}

.usage-color--locked {
  background: #d8dee8;
}

.mini-action {
  border: 1px solid #edf1f7;
  border-radius: 16px;
  background: linear-gradient(180deg, #fcfdff 0%, #f8fbff 100%);
  min-height: 98px;
  display: grid;
  place-items: center;
  gap: 10px;
  color: var(--af-ink);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.mini-action:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(45, 103, 227, 0.08);
}

.mini-action .el-icon {
  font-size: 22px;
  color: var(--af-brand);
}

.mini-action span {
  font-size: 13px;
  font-weight: 600;
}
</style>
