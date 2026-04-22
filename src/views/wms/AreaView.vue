<template>
  <div class="wms-page">
    <header class="page-header">
      <div>
        <h1>区域管理</h1>
        <p>维护仓库下业务分区，形成仓库 -> 区域 -> 库位的主数据层级。</p>
      </div>
      <RouterLink to="/dashboard" class="btn ghost">返回首页</RouterLink>
    </header>

    <WmsNav />

    <section class="panel">
      <h2>查询条件</h2>
      <div class="field-grid">
        <div class="field">
          <label>仓库</label>
          <el-select v-model="queryWarehouseId" placeholder="全部" clearable>
            <el-option
              v-for="item in warehouseOptions"
              :key="String(item.id)"
              :label="`${item.warehouseCode} - ${item.warehouseName}`"
              :value="String(item.id)"
            />
          </el-select>
        </div>
        <div class="field">
          <label>区域编码</label>
          <el-input v-model="query.areaCode" placeholder="支持精确匹配" />
        </div>
        <div class="field">
          <label>区域名称</label>
          <el-input v-model="query.areaName" placeholder="支持模糊匹配" />
        </div>
        <div class="field">
          <label>区域类型</label>
          <el-input v-model="query.areaType" placeholder="例如 STORAGE / RECEIVING" />
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
        <button class="btn" :disabled="loading" @click="handleSearch">查询</button>
        <button class="btn secondary" :disabled="loading" @click="resetQuery">重置</button>
      </div>
    </section>

    <section class="panel">
      <h2>区域列表</h2>
      <div v-if="successMessage" class="message success">{{ successMessage }}</div>
      <div v-if="errorMessage" class="message error">{{ errorMessage }}</div>
      <div class="actions-row">
        <button class="btn" :disabled="loading" @click="openCreateDialog">新增区域</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>仓库</th>
              <th>区域编码</th>
              <th>区域名称</th>
              <th>区域类型</th>
              <th>状态</th>
              <th>备注</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="String(row.id)">
              <td>{{ renderWarehouse(row) }}</td>
              <td>{{ row.areaCode || '-' }}</td>
              <td>{{ row.areaName }}</td>
              <td>{{ row.areaType || '-' }}</td>
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
          <label>区域名称 *</label>
          <el-input v-model="form.areaName" placeholder="请输入区域名称" />
        </div>
        <div class="field">
          <label>区域类型</label>
          <el-input v-model="form.areaType" placeholder="例如 STORAGE / RECEIVING" />
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
          <button class="btn" :disabled="loading" @click="submitForm">{{ isEditing ? '保存修改' : '创建区域' }}</button>
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
import { createArea, queryAreas, queryWarehouses, removeAreas, updateArea, type AreaQuery } from '@/api/wms'
import type { Area, Warehouse } from '@/types/wms'

const loading = ref(false)
const rows = ref<Area[]>([])
const total = ref(0)
const pages = ref(0)
const successMessage = ref('')
const errorMessage = ref('')
const isEditing = ref(false)
const formVisible = ref(false)
const statusFilter = ref('')
const queryWarehouseId = ref('')
const warehouseOptions = ref<Warehouse[]>([])

const query = reactive<AreaQuery>({
  pageNo: 1,
  pageSize: 10,
  warehouseId: undefined,
  areaCode: '',
  areaName: '',
  areaType: '',
  status: undefined
})

const form = reactive<Partial<Area>>({
  id: undefined,
  warehouseId: '',
  areaName: '',
  areaType: '',
  status: 0,
  remark: ''
})

const formTitle = computed(() => (isEditing.value ? '编辑区域' : '新增区域'))

function clearMessages(): void {
  successMessage.value = ''
  errorMessage.value = ''
}

function normalizeQuery(): void {
  query.warehouseId = queryWarehouseId.value ? queryWarehouseId.value : undefined
  query.status = statusFilter.value === '' ? undefined : Number(statusFilter.value)
}

function handleSearch(): void {
  query.pageNo = 1
  normalizeQuery()
  void loadData()
}

function resetQuery(): void {
  query.pageNo = 1
  queryWarehouseId.value = ''
  statusFilter.value = ''
  query.warehouseId = undefined
  query.status = undefined
  query.areaCode = ''
  query.areaName = ''
  query.areaType = ''
  void loadData()
}

function resetForm(): void {
  isEditing.value = false
  form.id = undefined
  form.warehouseId = ''
  form.areaName = ''
  form.areaType = ''
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

function startEdit(row: Area): void {
  clearMessages()
  formVisible.value = true
  isEditing.value = true
  form.id = row.id
  form.warehouseId = String(row.warehouseId)
  form.areaName = row.areaName
  form.areaType = row.areaType || ''
  form.status = row.status ?? 0
  form.remark = row.remark || ''
}

function renderWarehouse(row: Area): string {
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

async function loadWarehouseOptions(): Promise<void> {
  warehouseOptions.value = await queryWarehouses({ pageNo: 1, pageSize: 200 })
}

async function loadData(): Promise<void> {
  clearMessages()
  normalizeQuery()
  loading.value = true
  try {
    const result = await queryAreas(query)
    rows.value = result.records
    total.value = result.total
    pages.value = Math.max(result.pages, 1)
    query.pageNo = result.pageNo
    query.pageSize = result.pageSize
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '区域列表加载失败'
  } finally {
    loading.value = false
  }
}

async function submitForm(): Promise<void> {
  clearMessages()
  if (!form.warehouseId) {
    errorMessage.value = '仓库不能为空'
    return
  }
  if (!form.areaName) {
    errorMessage.value = '区域名称不能为空'
    return
  }

  loading.value = true
  try {
    if (isEditing.value && form.id !== undefined) {
      await updateArea(form.id, {
        warehouseId: form.warehouseId,
        areaName: form.areaName,
        areaType: form.areaType,
        status: form.status ?? 0,
        remark: form.remark
      })
      successMessage.value = '区域更新成功'
    } else {
      await createArea({
        warehouseId: form.warehouseId,
        areaName: form.areaName,
        areaType: form.areaType,
        status: form.status ?? 0,
        remark: form.remark
      })
      successMessage.value = '区域创建成功'
    }
    closeDialog()
    await loadData()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '提交失败'
  } finally {
    loading.value = false
  }
}

async function removeRow(row: Area): Promise<void> {
  clearMessages()
  const confirmed = window.confirm(`确认删除区域「${row.areaName}」吗？`)
  if (!confirmed) {
    return
  }

  loading.value = true
  try {
    await removeAreas([row.id])
    successMessage.value = '区域删除成功'
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
