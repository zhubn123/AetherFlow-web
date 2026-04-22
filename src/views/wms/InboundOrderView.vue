<template>
  <div class="wms-page">
    <header class="page-header">
      <div>
        <h1>入库管理</h1>
        <p>支持草稿创建、确认入账和单据状态跟踪。</p>
      </div>
      <RouterLink to="/dashboard" class="btn ghost">返回首页</RouterLink>
    </header>

    <WmsNav />

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
          <label>状态</label>
          <el-select v-model="queryStatus" placeholder="全部" clearable>
            <el-option label="草稿" value="0" />
            <el-option label="已确认" value="1" />
          </el-select>
        </div>
      </div>
      <div class="actions-row">
        <button class="btn" :disabled="loading" @click="handleSearch">查询</button>
        <button class="btn secondary" :disabled="loading" @click="resetQuery">重置</button>
      </div>
    </section>

    <section class="panel">
      <h2>入库单列表</h2>
      <div v-if="successMessage" class="message success">{{ successMessage }}</div>
      <div v-if="errorMessage" class="message error">{{ errorMessage }}</div>
      <div class="actions-row">
        <button class="btn" :disabled="loading" @click="openCreateDialog">新建入库单</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>单号</th>
              <th>仓库</th>
              <th>状态</th>
              <th>入库时间</th>
              <th>备注</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="String(row.id)">
              <td>{{ row.orderNo }}</td>
              <td>{{ renderWarehouse(row) }}</td>
              <td>
                <span class="status-tag" :class="row.status === 1 ? 'normal' : 'disabled'">
                  {{ row.status === 1 ? '已确认' : '草稿' }}
                </span>
              </td>
              <td>{{ row.inboundTime || '-' }}</td>
              <td>{{ row.remark || '-' }}</td>
              <td>
                <div class="cell-actions">
                  <button class="text-link" :disabled="loading || row.status === 1" @click="startEdit(row)">编辑</button>
                  <button class="text-link" :disabled="loading || row.status === 1" @click="confirmRow(row)">确认</button>
                  <button class="text-link danger" :disabled="loading" @click="removeRow(row)">删除</button>
                </div>
              </td>
            </tr>
            <tr v-if="!rows.length">
              <td class="empty-cell" colspan="6">暂无数据</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="pagination">
        <span>共 {{ total }} 条，当前第 {{ query.pageNo }} / {{ pages || 1 }} 页</span>
        <div class="actions-row" style="margin-top: 0;">
          <button class="btn secondary" :disabled="loading || (query.pageNo || 1) <= 1" @click="prevPage">上一页</button>
          <button class="btn secondary" :disabled="loading || (query.pageNo || 1) >= pages" @click="nextPage">下一页</button>
        </div>
      </div>
    </section>

    <el-dialog
      v-model="dialogVisible"
      class="wms-dialog"
      :title="dialogMode === 'create' ? '新建入库单草稿' : '编辑入库单表头'"
      width="980px"
      :close-on-click-modal="false"
      @closed="resetForm"
    >
      <p v-if="dialogMode === 'edit'" class="muted-tip">当前版本编辑仅修改表头（仓库、备注）；明细编辑待后端明细查询接口补齐后接入。</p>

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
        <div v-if="dialogMode === 'create'" class="field">
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
        <div class="field" :style="dialogMode === 'create' ? 'grid-column: span 2;' : 'grid-column: span 3;'">
          <label>备注</label>
          <el-input v-model="form.remark" placeholder="可选" />
        </div>
      </div>

      <template v-if="dialogMode === 'create'">
        <div class="actions-row">
          <button class="btn secondary" type="button" @click="addItem">新增明细行</button>
        </div>
        <div class="table-wrap">
          <table class="editor-table">
            <thead>
              <tr>
                <th>行号</th>
                <th>物料 *</th>
                <th>库位 *</th>
                <th>计划数量 *</th>
                <th>备注</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in form.orderItemsBo" :key="index">
                <td>{{ index + 1 }}</td>
                <td>
                  <el-select v-model="item.materialId" placeholder="请选择物料">
                    <el-option
                      v-for="m in materialOptions"
                      :key="String(m.id)"
                      :label="`${m.materialCode} - ${m.materialName}`"
                      :value="String(m.id)"
                    />
                  </el-select>
                </td>
                <td>
                  <el-select v-model="item.locationId" placeholder="请选择库位">
                    <el-option
                      v-for="l in locationOptions"
                      :key="String(l.id)"
                      :label="`${l.locationCode} - ${l.locationName}`"
                      :value="String(l.id)"
                    />
                  </el-select>
                </td>
                <td>
                  <el-input-number v-model="item.plannedQty" :min="0.0001" :step="0.0001" />
                </td>
                <td>
                  <el-input v-model="item.remark" placeholder="可选" />
                </td>
                <td>
                  <button class="text-link danger" type="button" @click="removeItem(index)">删除</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>

      <template #footer>
        <div class="actions-row">
          <button class="btn" :disabled="loading" @click="submitForm">{{ dialogMode === 'create' ? '创建草稿' : '保存修改' }}</button>
          <button class="btn text" :disabled="loading" @click="closeDialog">取消</button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'
import WmsNav from '@/components/WmsNav.vue'
import {
  confirmInboundOrder,
  createInboundOrder,
  queryAreas,
  queryInboundOrders,
  queryLocations,
  queryMaterials,
  queryWarehouses,
  removeInboundOrders,
  updateInboundOrder,
  type InboundOrderQuery
} from '@/api/wms'
import type { Area, IdValue, InboundOrder, InboundOrderItem, Location, Material, Warehouse } from '@/types/wms'

type DialogMode = 'create' | 'edit'

interface InboundDraftForm {
  id?: IdValue
  warehouseId: string
  areaId: string
  remark: string
  orderItemsBo: InboundOrderItem[]
}

const loading = ref(false)
const rows = ref<InboundOrder[]>([])
const total = ref(0)
const pages = ref(0)
const successMessage = ref('')
const errorMessage = ref('')

const dialogVisible = ref(false)
const dialogMode = ref<DialogMode>('create')
const queryWarehouseId = ref('')
const queryAreaId = ref('')
const queryStatus = ref('')

const warehouseOptions = ref<Warehouse[]>([])
const queryAreaOptions = ref<Area[]>([])
const formAreaOptions = ref<Area[]>([])
const locationOptions = ref<Location[]>([])
const materialOptions = ref<Material[]>([])

const query = reactive<InboundOrderQuery>({
  pageNo: 1,
  pageSize: 10,
  orderNo: '',
  warehouseId: undefined,
  areaId: undefined,
  status: undefined
})

const form = reactive<InboundDraftForm>({
  id: undefined,
  warehouseId: '',
  areaId: '',
  remark: '',
  orderItemsBo: []
})

function clearMessages(): void {
  successMessage.value = ''
  errorMessage.value = ''
}

function resetForm(): void {
  form.id = undefined
  form.warehouseId = ''
  form.areaId = ''
  form.remark = ''
  form.orderItemsBo = []
  formAreaOptions.value = []
  locationOptions.value = []
}

function closeDialog(): void {
  dialogVisible.value = false
  resetForm()
}

async function openCreateDialog(): Promise<void> {
  clearMessages()
  dialogMode.value = 'create'
  resetForm()
  addItem()
  dialogVisible.value = true
}

async function startEdit(row: InboundOrder): Promise<void> {
  clearMessages()
  dialogMode.value = 'edit'
  form.id = row.id
  form.warehouseId = String(row.warehouseId)
  form.areaId = ''
  form.remark = row.remark || ''
  form.orderItemsBo = []
  await loadFormAreaOptions(form.warehouseId)
  await loadLocationOptions()
  dialogVisible.value = true
}

function addItem(): void {
  form.orderItemsBo.push({
    lineNo: form.orderItemsBo.length + 1,
    materialId: '',
    locationId: '',
    plannedQty: 1,
    remark: ''
  })
}

function removeItem(index: number): void {
  form.orderItemsBo.splice(index, 1)
  form.orderItemsBo.forEach((item, i) => {
    item.lineNo = i + 1
  })
}

function normalizeQuery(): void {
  query.warehouseId = queryWarehouseId.value ? queryWarehouseId.value : undefined
  query.areaId = queryAreaId.value ? queryAreaId.value : undefined
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
  form.orderItemsBo.forEach((item) => {
    item.locationId = ''
  })
  await loadFormAreaOptions(form.warehouseId || undefined)
  locationOptions.value = []
}

async function onFormAreaChange(): Promise<void> {
  form.orderItemsBo.forEach((item) => {
    item.locationId = ''
  })
  await loadLocationOptions()
}

function renderWarehouse(row: InboundOrder): string {
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

function resetQuery(): void {
  query.pageNo = 1
  query.orderNo = ''
  queryWarehouseId.value = ''
  queryAreaId.value = ''
  queryStatus.value = ''
  query.warehouseId = undefined
  query.areaId = undefined
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
    const result = await queryInboundOrders(query)
    rows.value = result.records
    total.value = result.total
    pages.value = Math.max(result.pages, 1)
    query.pageNo = result.pageNo
    query.pageSize = result.pageSize
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '入库单加载失败'
  } finally {
    loading.value = false
  }
}

function validateCreateForm(): boolean {
  if (!form.warehouseId) {
    errorMessage.value = '请选择仓库'
    return false
  }
  if (!form.areaId) {
    errorMessage.value = '请选择区域'
    return false
  }
  if (!form.orderItemsBo.length) {
    errorMessage.value = '入库单明细不能为空'
    return false
  }
  const invalidIndex = form.orderItemsBo.findIndex(
    (item) => !item.materialId || !item.locationId || !item.plannedQty || Number(item.plannedQty) <= 0
  )
  if (invalidIndex >= 0) {
    errorMessage.value = `第 ${invalidIndex + 1} 行明细未填写完整`
    return false
  }
  return true
}

async function submitForm(): Promise<void> {
  clearMessages()
  loading.value = true
  try {
    if (dialogMode.value === 'create') {
      if (!validateCreateForm()) {
        return
      }
      const payloadItems = form.orderItemsBo.map((item, index) => ({
        lineNo: index + 1,
        materialId: item.materialId,
        locationId: item.locationId,
        plannedQty: item.plannedQty,
        remark: item.remark || undefined
      }))
      await createInboundOrder({
        warehouseId: form.warehouseId,
        remark: form.remark || undefined,
        orderItemsBo: payloadItems
      })
      successMessage.value = '入库单草稿创建成功'
    } else {
      if (!form.id) {
        errorMessage.value = '缺少单据ID'
        return
      }
      if (!form.warehouseId) {
        errorMessage.value = '请选择仓库'
        return
      }
      await updateInboundOrder(form.id, {
        warehouseId: form.warehouseId,
        remark: form.remark || undefined
      })
      successMessage.value = '入库单更新成功'
    }

    closeDialog()
    await loadData()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '操作失败'
  } finally {
    loading.value = false
  }
}

async function confirmRow(row: InboundOrder): Promise<void> {
  clearMessages()
  const confirmed = window.confirm(`确认将入库单 ${row.orderNo} 执行“确认”吗？`)
  if (!confirmed) {
    return
  }
  loading.value = true
  try {
    await confirmInboundOrder(row.id)
    successMessage.value = '入库单已确认'
    await loadData()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '确认失败'
  } finally {
    loading.value = false
  }
}

async function removeRow(row: InboundOrder): Promise<void> {
  clearMessages()
  const confirmed = window.confirm(`确认删除入库单 ${row.orderNo} 吗？`)
  if (!confirmed) {
    return
  }
  loading.value = true
  try {
    await removeInboundOrders([row.id])
    successMessage.value = '入库单删除成功'
    await loadData()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '删除失败'
  } finally {
    loading.value = false
  }
}

function prevPage(): void {
  if ((query.pageNo || 1) <= 1) {
    return
  }
  query.pageNo = (query.pageNo || 1) - 1
  void loadData()
}

function nextPage(): void {
  if ((query.pageNo || 1) >= pages.value) {
    return
  }
  query.pageNo = (query.pageNo || 1) + 1
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
