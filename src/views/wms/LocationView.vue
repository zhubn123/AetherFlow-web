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
          <label>仓库ID</label>
          <input v-model.trim="query.warehouseId" type="text" placeholder="例如 192..." />
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
              <th>ID</th>
              <th>仓库ID</th>
              <th>编码</th>
              <th>名称</th>
              <th>状态</th>
              <th>备注</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="String(row.id)">
              <td>{{ row.id }}</td>
              <td>{{ row.warehouseId }}</td>
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
              <td class="empty-cell" colspan="7">暂无数据</td>
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

    <div v-if="formVisible" class="dialog-mask" @click.self="closeDialog">
      <section class="dialog-panel">
        <h2>{{ formTitle }}</h2>
        <div class="field-grid">
          <div class="field">
            <label>仓库ID *</label>
            <input v-model.trim="form.warehouseId" type="text" placeholder="请输入所属仓库ID" />
          </div>
          <div class="field">
            <label>库位名称 *</label>
            <input v-model.trim="form.locationName" type="text" placeholder="请输入库位名称" />
          </div>
          <div class="field">
            <label>状态</label>
            <select v-model.number="form.status">
              <option :value="0">正常</option>
              <option :value="1">停用</option>
            </select>
          </div>
          <div class="field">
            <label>备注</label>
            <input v-model.trim="form.remark" type="text" placeholder="可选" />
          </div>
        </div>
        <div class="actions-row">
          <button class="btn" :disabled="loading" @click="submitForm">{{ isEditing ? '保存修改' : '创建库位' }}</button>
          <button class="btn secondary" :disabled="loading" @click="resetForm">清空表单</button>
          <button class="btn text" :disabled="loading" @click="closeDialog">取消</button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'
import WmsNav from '@/components/WmsNav.vue'
import { createLocation, queryLocations, removeLocations, updateLocation, type LocationQuery } from '@/api/wms'
import type { Location } from '@/types/wms'

const loading = ref(false)
const rows = ref<Location[]>([])
const total = ref(0)
const pages = ref(0)
const successMessage = ref('')
const errorMessage = ref('')
const isEditing = ref(false)
const formVisible = ref(false)
const statusFilter = ref('')

const query = reactive<LocationQuery>({
  pageNo: 1,
  pageSize: 10,
  warehouseId: '',
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

function resetQuery(): void {
  query.pageNo = 1
  query.warehouseId = ''
  query.locationCode = ''
  query.locationName = ''
  statusFilter.value = ''
  query.status = undefined
  void loadData()
}

function handleSearch(): void {
  query.pageNo = 1
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
  form.warehouseId = row.warehouseId
  form.locationName = row.locationName
  form.status = row.status ?? 0
  form.remark = row.remark || ''
}

async function loadData(): Promise<void> {
  clearMessages()
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

onMounted(() => {
  void loadData()
})
</script>

<style scoped src="./wms-page.css"></style>
