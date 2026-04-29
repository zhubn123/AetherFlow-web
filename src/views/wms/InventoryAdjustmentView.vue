<template>
  <div class="wms-page">
    <header class="page-header">
      <div>
        <h1>库存调整</h1>
        <p>支持草稿创建、确认生效和调整原因留痕。</p>
      </div>
      <RouterLink to="/dashboard"><el-button plain>返回首页</el-button></RouterLink>
    </header>

    <section class="panel">
      <h2>查询条件</h2>
      <div class="field-grid">
        <div class="field">
          <label>单号</label>
          <el-input v-model="query.orderNo" placeholder="支持模糊匹配" />
        </div>
        <div class="field">
          <label>仓库</label>
          <el-select v-model="queryWarehouseId" placeholder="全部" clearable @change="onQueryWarehouseChange">
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
          <el-select v-model="queryAreaId" placeholder="全部" clearable>
            <el-option
              v-for="item in queryAreaOptions"
              :key="String(item.id)"
              :label="`${item.areaCode} - ${item.areaName}`"
              :value="String(item.id)"
            />
          </el-select>
        </div>
        <div class="field">
          <label>调整方向</label>
          <el-select v-model="queryAdjustType" placeholder="全部" clearable>
            <el-option label="增加库存" value="INCREASE" />
            <el-option label="减少库存" value="DECREASE" />
          </el-select>
        </div>
        <div class="field">
          <label>状态</label>
          <el-select v-model="queryStatus" placeholder="全部" clearable>
            <el-option label="草稿" value="0" />
            <el-option label="已确认" value="1" />
          </el-select>
        </div>
      </div>
      <div class="actions-row">
        <el-button type="primary" :disabled="loading" @click="handleSearch">查询</el-button>
        <el-button :disabled="loading" @click="resetQuery">重置</el-button>
      </div>
    </section>

    <section class="panel">
      <h2>库存调整单列表</h2>
      <el-alert v-if="successMessage" class="message" type="success" :closable="false" :show-icon="true" :title="successMessage" />
      <el-alert v-if="errorMessage" class="message" type="error" :closable="false" :show-icon="true" :title="errorMessage" />
      <div class="actions-row">
        <el-button type="primary" :disabled="loading" @click="openCreateDialog">新建库存调整单</el-button>
      </div>
      <el-table :data="rows" v-loading="loading" empty-text="暂无数据">
        <el-table-column prop="orderNo" label="单号" min-width="170" />
        <el-table-column label="仓库" min-width="180">
          <template #default="{ row }">{{ renderWarehouse(row) }}</template>
        </el-table-column>
        <el-table-column label="区域" min-width="180">
          <template #default="{ row }">{{ renderArea(row) }}</template>
        </el-table-column>
        <el-table-column label="调整方向" width="120">
          <template #default="{ row }">
            <el-tag :type="row.adjustType === 'INCREASE' ? 'success' : 'danger'" effect="light">
              {{ row.adjustType === 'INCREASE' ? '增加库存' : '减少库存' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" effect="light">
              {{ row.status === 1 ? '已确认' : '草稿' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="调整时间" min-width="170">
          <template #default="{ row }">{{ row.adjustTime || '-' }}</template>
        </el-table-column>
        <el-table-column prop="adjustReason" label="调整原因" min-width="180" />
        <el-table-column label="备注" min-width="180">
          <template #default="{ row }">{{ row.remark || '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" :disabled="loading || row.status === 1" @click="startEdit(row)">编辑</el-button>
            <el-button link type="primary" size="small" :disabled="loading || row.status === 1" @click="confirmRow(row)">确认</el-button>
            <el-button link type="danger" size="small" :disabled="loading || row.status === 1" @click="removeRow(row)">删除</el-button>
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

    <el-dialog
      v-model="dialogVisible"
      class="wms-dialog"
      :title="dialogMode === 'create' ? '新建库存调整单草稿' : '编辑库存调整单'"
      width="1080px"
      :close-on-click-modal="false"
      @closed="resetForm"
    >
      <div class="field-grid">
        <div class="field">
          <label>仓库 *</label>
          <el-select v-model="form.warehouseId" placeholder="请选择仓库" @change="onFormWarehouseChange">
            <el-option
              v-for="item in warehouseOptions"
              :key="String(item.id)"
              :label="`${item.warehouseCode} - ${item.warehouseName}`"
              :value="String(item.id)"
            />
          </el-select>
        </div>
        <div class="field">
          <label>区域 *</label>
          <el-select v-model="form.areaId" placeholder="请选择区域" @change="onFormAreaChange">
            <el-option
              v-for="item in formAreaOptions"
              :key="String(item.id)"
              :label="`${item.areaCode} - ${item.areaName}`"
              :value="String(item.id)"
            />
          </el-select>
        </div>
        <div class="field">
          <label>调整方向 *</label>
          <el-select v-model="form.adjustType" placeholder="请选择调整方向">
            <el-option label="增加库存" value="INCREASE" />
            <el-option label="减少库存" value="DECREASE" />
          </el-select>
        </div>
        <div class="field">
          <label>调整原因 *</label>
          <el-input v-model="form.adjustReason" placeholder="请填写调整原因" />
        </div>
        <div class="field" style="grid-column: span 2;">
          <label>备注</label>
          <el-input v-model="form.remark" placeholder="可选" />
        </div>
      </div>

      <div class="actions-row">
        <el-button @click="addItem">新增明细行</el-button>
      </div>
      <el-table :data="form.adjustmentItemsBo" empty-text="请新增明细行">
        <el-table-column label="行号" width="70">
          <template #default="{ $index }">{{ $index + 1 }}</template>
        </el-table-column>
        <el-table-column label="物料 *" min-width="180">
          <template #default="{ row }">
            <el-select v-model="row.materialId" placeholder="请选择物料">
              <el-option
                v-for="m in materialOptions"
                :key="String(m.id)"
                :label="`${m.materialCode} - ${m.materialName}`"
                :value="String(m.id)"
              />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="库位 *" min-width="180">
          <template #default="{ row }">
            <el-select v-model="row.locationId" placeholder="请选择库位">
              <el-option
                v-for="l in locationOptions"
                :key="String(l.id)"
                :label="`${l.locationCode} - ${l.locationName}`"
                :value="String(l.id)"
              />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="调整数量 *" min-width="140">
          <template #default="{ row }">
            <el-input-number v-model="row.adjustQty" :min="0.0001" :step="0.0001" />
          </template>
        </el-table-column>
        <el-table-column label="备注" min-width="160">
          <template #default="{ row }">
            <el-input v-model="row.remark" placeholder="可选" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="90" fixed="right">
          <template #default="{ $index }">
            <el-button link type="danger" size="small" @click="removeItem($index)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <template #footer>
        <div class="actions-row">
          <el-button type="primary" :disabled="loading" @click="submitForm">{{ dialogMode === 'create' ? '创建草稿' : '保存修改' }}</el-button>
          <el-button text :disabled="loading" @click="closeDialog">取消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import WmsPagination from '@/components/WmsPagination.vue'
import {
  confirmInventoryAdjustment,
  createInventoryAdjustment,
  getInventoryAdjustmentDetail,
  queryAreas,
  queryInventoryAdjustments,
  queryLocations,
  queryMaterials,
  queryWarehouses,
  removeInventoryAdjustments,
  updateInventoryAdjustment,
  type InventoryAdjustmentQuery
} from '@/api/wms'
import type {
  Area,
  IdValue,
  InventoryAdjustment,
  InventoryAdjustmentDetail,
  InventoryAdjustmentItem,
  Location,
  Material,
  Warehouse
} from '@/types/wms'

type DialogMode = 'create' | 'edit'

interface InventoryAdjustmentForm {
  id?: IdValue
  warehouseId: string
  areaId: string
  adjustType: string
  adjustReason: string
  remark: string
  adjustmentItemsBo: InventoryAdjustmentItem[]
}

const loading = ref(false)
const rows = ref<InventoryAdjustment[]>([])
const total = ref(0)
const pages = ref(0)
const successMessage = ref('')
const errorMessage = ref('')

const dialogVisible = ref(false)
const dialogMode = ref<DialogMode>('create')
const queryWarehouseId = ref('')
const queryAreaId = ref('')
const queryStatus = ref('')
const queryAdjustType = ref('')

const warehouseOptions = ref<Warehouse[]>([])
const queryAreaOptions = ref<Area[]>([])
const formAreaOptions = ref<Area[]>([])
const locationOptions = ref<Location[]>([])
const materialOptions = ref<Material[]>([])

const query = reactive<InventoryAdjustmentQuery>({
  pageNo: 1,
  pageSize: 5,
  orderNo: '',
  warehouseId: undefined,
  areaId: undefined,
  adjustType: undefined,
  status: undefined
})

const form = reactive<InventoryAdjustmentForm>({
  id: undefined,
  warehouseId: '',
  areaId: '',
  adjustType: '',
  adjustReason: '',
  remark: '',
  adjustmentItemsBo: []
})

function clearMessages(): void {
  successMessage.value = ''
  errorMessage.value = ''
}

function resetForm(): void {
  form.id = undefined
  form.warehouseId = ''
  form.areaId = ''
  form.adjustType = ''
  form.adjustReason = ''
  form.remark = ''
  form.adjustmentItemsBo = []
  formAreaOptions.value = []
  locationOptions.value = []
}

function closeDialog(): void {
  dialogVisible.value = false
  resetForm()
}

function addItem(): void {
  form.adjustmentItemsBo.push({
    lineNo: form.adjustmentItemsBo.length + 1,
    materialId: '',
    locationId: '',
    adjustQty: 1,
    remark: ''
  })
}

function removeItem(index: number): void {
  form.adjustmentItemsBo.splice(index, 1)
  form.adjustmentItemsBo.forEach((item, i) => {
    item.lineNo = i + 1
  })
}

async function openCreateDialog(): Promise<void> {
  clearMessages()
  dialogMode.value = 'create'
  resetForm()
  addItem()
  dialogVisible.value = true
}

async function startEdit(row: InventoryAdjustment): Promise<void> {
  clearMessages()
  loading.value = true
  try {
    const detail = await getInventoryAdjustmentDetail(row.id)
    dialogMode.value = 'edit'
    fillForm(detail)
    await loadFormAreaOptions(form.warehouseId)
    await loadLocationOptions()
    dialogVisible.value = true
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '库存调整单详情加载失败'
  } finally {
    loading.value = false
  }
}

function fillForm(detail: InventoryAdjustmentDetail): void {
  form.id = detail.id
  form.warehouseId = String(detail.warehouseId)
  form.areaId = String(detail.areaId)
  form.adjustType = detail.adjustType
  form.adjustReason = detail.adjustReason
  form.remark = detail.remark || ''
  form.adjustmentItemsBo = (detail.adjustmentItems || []).map((item, index) => ({
    id: item.id,
    orderId: item.orderId,
    lineNo: item.lineNo ?? index + 1,
    materialId: item.materialId,
    locationId: item.locationId,
    adjustQty: item.adjustQty,
    remark: item.remark || ''
  }))
}

function normalizeQuery(): void {
  query.warehouseId = queryWarehouseId.value ? queryWarehouseId.value : undefined
  query.areaId = queryAreaId.value ? queryAreaId.value : undefined
  query.adjustType = queryAdjustType.value ? queryAdjustType.value : undefined
  query.status = queryStatus.value === '' ? undefined : Number(queryStatus.value)
}

async function loadQueryAreaOptions(): Promise<void> {
  if (!queryWarehouseId.value) {
    queryAreaOptions.value = []
    return
  }
  const result = await queryAreas({ pageNo: 1, pageSize: 200, warehouseId: queryWarehouseId.value, status: 0 })
  queryAreaOptions.value = result.records
}

async function loadFormAreaOptions(warehouseId?: string): Promise<void> {
  if (!warehouseId) {
    formAreaOptions.value = []
    return
  }
  const result = await queryAreas({ pageNo: 1, pageSize: 200, warehouseId, status: 0 })
  formAreaOptions.value = result.records
}

async function loadLocationOptions(): Promise<void> {
  if (!form.warehouseId || !form.areaId) {
    locationOptions.value = []
    return
  }
  const result = await queryLocations({
    pageNo: 1,
    pageSize: 200,
    warehouseId: form.warehouseId,
    areaId: form.areaId,
    status: 0
  })
  locationOptions.value = result.records
}

async function onQueryWarehouseChange(): Promise<void> {
  queryAreaId.value = ''
  await loadQueryAreaOptions()
}

async function onFormWarehouseChange(): Promise<void> {
  form.areaId = ''
  form.adjustmentItemsBo.forEach((item) => {
    item.locationId = ''
  })
  await loadFormAreaOptions(form.warehouseId || undefined)
  locationOptions.value = []
}

async function onFormAreaChange(): Promise<void> {
  form.adjustmentItemsBo.forEach((item) => {
    item.locationId = ''
  })
  await loadLocationOptions()
}

function renderWarehouse(row: InventoryAdjustment): string {
  if (row.warehouseCode || row.warehouseName) {
    return `${row.warehouseCode || '-'} - ${row.warehouseName || '-'}`
  }
  const found = warehouseOptions.value.find((item) => String(item.id) === String(row.warehouseId))
  if (!found) {
    return `#${row.warehouseId}`
  }
  return `${found.warehouseCode} - ${found.warehouseName}`
}

function renderArea(row: InventoryAdjustment): string {
  if (row.areaCode || row.areaName) {
    return `${row.areaCode || '-'} - ${row.areaName || '-'}`
  }
  const found = queryAreaOptions.value.find((item) => String(item.id) === String(row.areaId))
    ?? formAreaOptions.value.find((item) => String(item.id) === String(row.areaId))
  if (!found) {
    return `#${row.areaId}`
  }
  return `${found.areaCode} - ${found.areaName}`
}

function resetQuery(): void {
  query.pageNo = 1
  query.orderNo = ''
  queryWarehouseId.value = ''
  queryAreaId.value = ''
  queryStatus.value = ''
  queryAdjustType.value = ''
  query.warehouseId = undefined
  query.areaId = undefined
  query.adjustType = undefined
  query.status = undefined
  queryAreaOptions.value = []
  void loadData()
}

function handleSearch(): void {
  query.pageNo = 1
  normalizeQuery()
  void loadData()
}

async function loadOptions(): Promise<void> {
  const [warehouses, materialsPage] = await Promise.all([
    queryWarehouses({ pageNo: 1, pageSize: 200 }),
    queryMaterials({ pageNo: 1, pageSize: 200, status: 0 })
  ])
  warehouseOptions.value = warehouses
  materialOptions.value = materialsPage.records
}

async function loadData(): Promise<void> {
  clearMessages()
  normalizeQuery()
  loading.value = true
  try {
    const result = await queryInventoryAdjustments(query)
    rows.value = result.records
    total.value = result.total
    pages.value = Math.max(result.pages, 1)
    query.pageNo = result.pageNo
    query.pageSize = result.pageSize
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '库存调整单加载失败'
  } finally {
    loading.value = false
  }
}

function validateForm(): boolean {
  if (!form.warehouseId) {
    errorMessage.value = '请选择仓库'
    return false
  }
  if (!form.areaId) {
    errorMessage.value = '请选择区域'
    return false
  }
  if (!form.adjustType) {
    errorMessage.value = '请选择调整方向'
    return false
  }
  if (!form.adjustReason.trim()) {
    errorMessage.value = '请填写调整原因'
    return false
  }
  if (!form.adjustmentItemsBo.length) {
    errorMessage.value = '库存调整明细不能为空'
    return false
  }
  const invalidIndex = form.adjustmentItemsBo.findIndex(
    (item) => !item.materialId || !item.locationId || !item.adjustQty || Number(item.adjustQty) <= 0
  )
  if (invalidIndex >= 0) {
    errorMessage.value = `第 ${invalidIndex + 1} 行明细未填写完整`
    return false
  }
  return true
}

async function submitForm(): Promise<void> {
  clearMessages()
  if (!validateForm()) {
    return
  }

  const payload = {
    warehouseId: form.warehouseId,
    areaId: form.areaId,
    adjustType: form.adjustType,
    adjustReason: form.adjustReason.trim(),
    remark: form.remark || undefined,
    adjustmentItemsBo: form.adjustmentItemsBo.map((item, index) => ({
      id: item.id,
      lineNo: index + 1,
      materialId: item.materialId,
      locationId: item.locationId,
      adjustQty: item.adjustQty,
      remark: item.remark || undefined
    }))
  }

  loading.value = true
  try {
    if (dialogMode.value === 'create') {
      await createInventoryAdjustment(payload)
      successMessage.value = '库存调整单草稿创建成功'
    } else {
      if (!form.id) {
        errorMessage.value = '缺少单据ID'
        return
      }
      await updateInventoryAdjustment(form.id, payload)
      successMessage.value = '库存调整单更新成功'
    }
    closeDialog()
    await loadData()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '操作失败'
  } finally {
    loading.value = false
  }
}

async function confirmRow(row: InventoryAdjustment): Promise<void> {
  clearMessages()
  try {
    await ElMessageBox.confirm(`确认将库存调整单 ${row.orderNo} 执行“确认”吗？`, '确认库存调整单', {
      type: 'warning',
      confirmButtonText: '确认',
      cancelButtonText: '取消'
    })
  } catch {
    return
  }

  loading.value = true
  try {
    await confirmInventoryAdjustment(row.id)
    successMessage.value = '库存调整单已确认'
    await loadData()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '确认失败'
  } finally {
    loading.value = false
  }
}

async function removeRow(row: InventoryAdjustment): Promise<void> {
  clearMessages()
  try {
    await ElMessageBox.confirm(`确认删除库存调整单 ${row.orderNo} 吗？`, '删除确认', {
      type: 'warning',
      confirmButtonText: '确认删除',
      cancelButtonText: '取消'
    })
  } catch {
    return
  }

  loading.value = true
  try {
    await removeInventoryAdjustments([row.id])
    successMessage.value = '库存调整单删除成功'
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

onMounted(async () => {
  try {
    await loadOptions()
    await loadData()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '初始化失败'
  }
})
</script>

<style scoped src="./wms-page.css"></style>
