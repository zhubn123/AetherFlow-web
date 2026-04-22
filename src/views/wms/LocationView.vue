<template>
  <div class="wms-page">
    <header class="page-header">
      <div>
        <h1>库位管理</h1>
        <p>维护仓内储位结构，支撑入库、出库和库存定位。</p>
      </div>
      <RouterLink to="/dashboard" class="btn ghost">返回首页</RouterLink>
    </header>

    <WmsNav />

    <section class="panel">
      <h2>查询条件</h2>
      <div class="field-grid">
        <div class="field">
          <label>仓库</label>
          <select v-model="queryWarehouseId">
            <option value="">全部</option>
            <option v-for="item in warehouseOptions" :key="String(item.id)" :value="String(item.id)">
              {{ item.warehouseCode }} - {{ item.warehouseName }}
            </option>
          </select>
        </div>
        <div class="field">
          <label>库位编码</label>
          <input v-model.trim="query.locationCode" type="text" placeholder="支持精确匹配" />
        </div>
        <div class="field">
          <label>库位名称</label>
          <input v-model.trim="query.locationName" type="text" placeholder="支持模糊匹配" />
        </div>
        <div class="field">
          <label>状态</label>
          <select v-model="statusFilter">
            <option value="">全部</option>
            <option value="0">正常</option>
            <option value="1">停用</option>
          </select>
        </div>
      </div>
      <div class="actions-row">
        <button class="btn" :disabled="loading" @click="handleSearch">查询</button>
        <button class="btn secondary" :disabled="loading" @click="resetQuery">重置</button>
      </div>
    </section>

    <section class="panel">
      <h2>库位列表</h2>
      <div v-if="successMessage" class="message success">{{ successMessage }}</div>
      <div v-if="errorMessage" class="message error">{{ errorMessage }}</div>
      <div class="actions-row">
        <button class="btn" :disabled="loading" @click="openCreateDialog">新增库位</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>仓库</th>
              <th>编码</th>
              <th>名称</th>
              <th>状态</th>
              <th>备注</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="String(row.id)">
              <td>{{ renderWarehouse(row) }}</td>
              <td>{{ row.locationCode || '-' }}</td>
              <td>{{ row.locationName }}</td>
              <td>
                <span class="status-tag" :class="row.status === 1 ? 'disabled' : 'normal'">
                  {{ row.status === 1 ? '停用' : '正常' }}
                </span>
              </td>
              <td>{{ row.remark || '-' }}</td>
              <td>
                <div class="cell-actions">
                  <button class="text-link" @click="startEdit(row)">编辑</button>
                  <button class="text-link danger" @click="removeRow(row)">删除</button>
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
          <el-select v-model="form.warehouseId" placeholder="请选择仓库">
            <el-option
              v-for="item in warehouseOptions"
              :key="String(item.id)"
              :label="`${item.warehouseCode} - ${item.warehouseName}`"
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
        <div class="field">
          <label>备注</label>
          <el-input v-model="form.remark" placeholder="可选" />
        </div>
      </div>
      <template #footer>
        <div class="actions-row">
          <button class="btn" :disabled="loading" @click="submitForm">{{ isEditing ? '保存修改' : '创建库位' }}</button>
          <button class="btn secondary" :disabled="loading" @click="resetForm">清空表单</button>
          <button class="btn text" :disabled="loading" @click="closeDialog">取消</button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'
import WmsNav from '@/components/WmsNav.vue'
import { createLocation, queryLocations, queryWarehouses, removeLocations, updateLocation, type LocationQuery } from '@/api/wms'
import type { Location, Warehouse } from '@/types/wms'

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
const warehouseOptions = ref<Warehouse[]>([])

const query = reactive<LocationQuery>({
  pageNo: 1,
  pageSize: 10,
  warehouseId: undefined,
  locationCode: '',
  locationName: '',
  status: undefined
})

const form = reactive<Partial<Location>>({
  id: undefined,
  warehouseId: '',
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

function normalizeWarehouseFilter(): void {
  query.warehouseId = queryWarehouseId.value ? queryWarehouseId.value : undefined
}

function resetQuery(): void {
  query.pageNo = 1
  queryWarehouseId.value = ''
  query.warehouseId = undefined
  query.locationCode = ''
  query.locationName = ''
  statusFilter.value = ''
  query.status = undefined
  void loadData()
}

function handleSearch(): void {
  query.pageNo = 1
  normalizeWarehouseFilter()
  normalizeStatusFilter()
  void loadData()
}

function resetForm(): void {
  isEditing.value = false
  form.id = undefined
  form.warehouseId = ''
  form.locationName = ''
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

function startEdit(row: Location): void {
  clearMessages()
  formVisible.value = true
  isEditing.value = true
  form.id = row.id
  form.warehouseId = String(row.warehouseId)
  form.locationName = row.locationName
  form.status = row.status ?? 0
  form.remark = row.remark || ''
}

async function loadData(): Promise<void> {
  clearMessages()
  normalizeWarehouseFilter()
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

async function submitForm(): Promise<void> {
  clearMessages()
  if (!form.warehouseId) {
    errorMessage.value = '仓库ID不能为空'
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
        locationName: form.locationName,
        status: form.status ?? 0,
        remark: form.remark
      })
      successMessage.value = '库位更新成功'
    } else {
      await createLocation({
        warehouseId: form.warehouseId,
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
  const confirmed = window.confirm(`确认删除库位「${row.locationName}」吗？`)
  if (!confirmed) {
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
  await loadWarehouseOptions()
  await loadData()
})
</script>

<style scoped src="./wms-page.css"></style>
