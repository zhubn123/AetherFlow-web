<template>
  <div class="wms-page">
    <header class="page-header">
      <div>
        <h1>库位管理</h1>
        <p>维护仓库下的区域库位结构，支撑入库、出库与库存定位。</p>
      </div>
      <RouterLink to="/dashboard"><el-button plain>返回首页</el-button></RouterLink>
    </header>

    <section class="panel">
      <h2>查询条件</h2>
      <div class="field-grid">
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
          <label>库位编码</label>
          <el-input v-model="query.locationCode" placeholder="支持精确匹配" />
        </div>
        <div class="field">
          <label>库位名称</label>
          <el-input v-model="query.locationName" placeholder="支持模糊匹配" />
        </div>
        <div class="field">
          <label>状态</label>
          <el-select v-model="statusFilter" placeholder="全部" clearable>
            <el-option label="正常" value="0" />
            <el-option label="停用" value="1" />
          </el-select>
        </div>
      </div>
      <div class="actions-row">
        <el-button type="primary" :disabled="loading" @click="handleSearch">查询</el-button>
        <el-button :disabled="loading" @click="resetQuery">重置</el-button>
      </div>
    </section>

    <section class="panel">
      <h2>库位列表</h2>
      <el-alert v-if="successMessage" class="message" type="success" :closable="false" :show-icon="true" :title="successMessage" />
      <el-alert v-if="errorMessage" class="message" type="error" :closable="false" :show-icon="true" :title="errorMessage" />
      <div class="actions-row">
        <el-button type="primary" :disabled="loading" @click="openCreateDialog">新增库位</el-button>
      </div>
      <el-table :data="rows" v-loading="loading" empty-text="暂无数据">
        <el-table-column label="仓库" min-width="180">
          <template #default="{ row }">{{ renderWarehouse(row) }}</template>
        </el-table-column>
        <el-table-column label="区域" min-width="180">
          <template #default="{ row }">{{ renderArea(row) }}</template>
        </el-table-column>
        <el-table-column label="编码" min-width="130">
          <template #default="{ row }">{{ row.locationCode || '-' }}</template>
        </el-table-column>
        <el-table-column prop="locationName" label="名称" min-width="160" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'warning' : 'success'" effect="light">
              {{ row.status === 1 ? '停用' : '正常' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="备注" min-width="180">
          <template #default="{ row }">{{ row.remark || '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="startEdit(row)">编辑</el-button>
            <el-button link type="danger" size="small" @click="removeRow(row)">删除</el-button>
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
      v-model="formVisible"
      class="wms-dialog"
      :title="formTitle"
      width="760px"
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
          <el-select v-model="form.areaId" placeholder="请选择区域">
            <el-option
              v-for="item in formAreaOptions"
              :key="String(item.id)"
              :label="`${item.areaCode} - ${item.areaName}`"
              :value="String(item.id)"
            />
          </el-select>
        </div>
        <div class="field">
          <label>库位名称 *</label>
          <el-input v-model="form.locationName" placeholder="请输入库位名称" />
        </div>
        <div class="field">
          <label>状态</label>
          <el-select v-model="form.status" placeholder="请选择状态">
            <el-option label="正常" :value="0" />
            <el-option label="停用" :value="1" />
          </el-select>
        </div>
        <div class="field" style="grid-column: span 2;">
          <label>备注</label>
          <el-input v-model="form.remark" placeholder="可选" />
        </div>
      </div>
      <template #footer>
        <div class="actions-row">
          <el-button type="primary" :disabled="loading" @click="submitForm">{{ isEditing ? '保存修改' : '创建库位' }}</el-button>
          <el-button :disabled="loading" @click="resetForm">清空表单</el-button>
          <el-button text :disabled="loading" @click="closeDialog">取消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import WmsPagination from '@/components/WmsPagination.vue'
import { createLocation, queryAreas, queryLocations, queryWarehouses, removeLocations, updateLocation, type LocationQuery } from '@/api/wms'
import type { Area, Location, Warehouse } from '@/types/wms'

const loading = ref(false)
const rows = ref<Location[]>([])
const total = ref(0)
const pages = ref(0)
const successMessage = ref('')
const errorMessage = ref('')
const isEditing = ref(false)
const formVisible = ref(false)
const statusFilter = ref('')
const queryWarehouseId = ref('')
const queryAreaId = ref('')
const warehouseOptions = ref<Warehouse[]>([])
const queryAreaOptions = ref<Area[]>([])
const formAreaOptions = ref<Area[]>([])

const query = reactive<LocationQuery>({
  pageNo: 1,
  pageSize: 10,
  warehouseId: undefined,
  areaId: undefined,
  locationCode: '',
  locationName: '',
  status: undefined
})

const form = reactive<Partial<Location>>({
  id: undefined,
  warehouseId: '',
  areaId: '',
  locationName: '',
  status: 0,
  remark: ''
})

const formTitle = computed(() => (isEditing.value ? '编辑库位' : '新增库位'))

function clearMessages(): void {
  successMessage.value = ''
  errorMessage.value = ''
}

function normalizeStatusFilter(): void {
  query.status = statusFilter.value === '' ? undefined : Number(statusFilter.value)
}

function normalizeWarehouseAndAreaFilter(): void {
  query.warehouseId = queryWarehouseId.value ? queryWarehouseId.value : undefined
  query.areaId = queryAreaId.value ? queryAreaId.value : undefined
}

async function loadQueryAreaOptions(warehouseId?: string): Promise<void> {
  if (!warehouseId) {
    queryAreaOptions.value = []
    return
  }
  const result = await queryAreas({ pageNo: 1, pageSize: 200, warehouseId })
  queryAreaOptions.value = result.records
}

async function loadFormAreaOptions(warehouseId?: string): Promise<void> {
  if (!warehouseId) {
    formAreaOptions.value = []
    return
  }
  const result = await queryAreas({ pageNo: 1, pageSize: 200, warehouseId })
  formAreaOptions.value = result.records
}

async function onQueryWarehouseChange(): Promise<void> {
  queryAreaId.value = ''
  await loadQueryAreaOptions(queryWarehouseId.value || undefined)
}

async function onFormWarehouseChange(): Promise<void> {
  form.areaId = ''
  await loadFormAreaOptions(form.warehouseId ? String(form.warehouseId) : undefined)
}

function resetQuery(): void {
  query.pageNo = 1
  queryWarehouseId.value = ''
  queryAreaId.value = ''
  query.warehouseId = undefined
  query.areaId = undefined
  query.locationCode = ''
  query.locationName = ''
  statusFilter.value = ''
  query.status = undefined
  queryAreaOptions.value = []
  void loadData()
}

function handleSearch(): void {
  query.pageNo = 1
  normalizeWarehouseAndAreaFilter()
  normalizeStatusFilter()
  void loadData()
}

function resetForm(): void {
  isEditing.value = false
  form.id = undefined
  form.warehouseId = ''
  form.areaId = ''
  form.locationName = ''
  form.status = 0
  form.remark = ''
  formAreaOptions.value = []
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

async function startEdit(row: Location): Promise<void> {
  clearMessages()
  formVisible.value = true
  isEditing.value = true
  form.id = row.id
  form.warehouseId = String(row.warehouseId)
  await loadFormAreaOptions(form.warehouseId ? String(form.warehouseId) : undefined)
  form.areaId = String(row.areaId)
  form.locationName = row.locationName
  form.status = row.status ?? 0
  form.remark = row.remark || ''
}

async function loadData(): Promise<void> {
  clearMessages()
  normalizeWarehouseAndAreaFilter()
  normalizeStatusFilter()
  loading.value = true
  try {
    const result = await queryLocations(query)
    rows.value = result.records
    total.value = result.total
    pages.value = Math.max(result.pages, 1)
    query.pageNo = result.pageNo
    query.pageSize = result.pageSize
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '库位列表加载失败'
  } finally {
    loading.value = false
  }
}

async function loadWarehouseOptions(): Promise<void> {
  warehouseOptions.value = await queryWarehouses({ pageNo: 1, pageSize: 200 })
}

function renderWarehouse(row: Location): string {
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

function renderArea(row: Location): string {
  if (row.areaCode || row.areaName) {
    const code = row.areaCode || '-'
    const name = row.areaName || '-'
    return `${code} - ${name}`
  }
  const found = queryAreaOptions.value.find((item) => String(item.id) === String(row.areaId))
  if (!found) {
    return `#${row.areaId}`
  }
  return `${found.areaCode} - ${found.areaName}`
}

async function submitForm(): Promise<void> {
  clearMessages()
  if (!form.warehouseId) {
    errorMessage.value = '仓库不能为空'
    return
  }
  if (!form.areaId) {
    errorMessage.value = '区域不能为空'
    return
  }
  if (!form.locationName) {
    errorMessage.value = '库位名称不能为空'
    return
  }

  loading.value = true
  try {
    if (isEditing.value && form.id !== undefined) {
      await updateLocation(form.id, {
        warehouseId: form.warehouseId,
        areaId: form.areaId,
        locationName: form.locationName,
        status: form.status ?? 0,
        remark: form.remark
      })
      successMessage.value = '库位更新成功'
    } else {
      await createLocation({
        warehouseId: form.warehouseId,
        areaId: form.areaId,
        locationName: form.locationName,
        status: form.status ?? 0,
        remark: form.remark
      })
      successMessage.value = '库位创建成功'
    }
    closeDialog()
    await loadData()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '提交失败'
  } finally {
    loading.value = false
  }
}

async function removeRow(row: Location): Promise<void> {
  clearMessages()
  try {
    await ElMessageBox.confirm(`确认删除库位「${row.locationName}」吗？`, '删除确认', {
      type: 'warning',
      confirmButtonText: '确认删除',
      cancelButtonText: '取消'
    })
  } catch {
    return
  }

  loading.value = true
  try {
    await removeLocations([row.id])
    successMessage.value = '库位删除成功'
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
  await loadWarehouseOptions()
  await loadData()
})
</script>

<style scoped src="./wms-page.css"></style>
