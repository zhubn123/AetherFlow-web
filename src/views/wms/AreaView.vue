<template>
  <div class="wms-page">
    <header class="page-header">
      <div>
        <h1>区域管理</h1>
        <p>维护仓库下业务分区，形成仓库 -> 区域 -> 库位的主数据层级。</p>
      </div>
      <RouterLink to="/dashboard"><el-button plain>返回首页</el-button></RouterLink>
    </header>

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
        <el-button type="primary" :disabled="loading" @click="handleSearch">查询</el-button>
        <el-button :disabled="loading" @click="resetQuery">重置</el-button>
      </div>
    </section>

    <section class="panel">
      <h2>区域列表</h2>
      <el-alert v-if="successMessage" class="message" type="success" :closable="false" :show-icon="true" :title="successMessage" />
      <el-alert v-if="errorMessage" class="message" type="error" :closable="false" :show-icon="true" :title="errorMessage" />
      <div class="actions-row">
        <el-button type="primary" :disabled="loading" @click="openCreateDialog">新增区域</el-button>
      </div>
      <el-table :data="rows" v-loading="loading" empty-text="暂无数据">
        <el-table-column label="仓库" min-width="180">
          <template #default="{ row }">{{ renderWarehouse(row) }}</template>
        </el-table-column>
        <el-table-column label="区域编码" min-width="130">
          <template #default="{ row }">{{ row.areaCode || '-' }}</template>
        </el-table-column>
        <el-table-column prop="areaName" label="区域名称" min-width="160" />
        <el-table-column label="区域类型" min-width="140">
          <template #default="{ row }">{{ row.areaType || '-' }}</template>
        </el-table-column>
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
          <el-button type="primary" :disabled="loading" @click="submitForm">{{ isEditing ? '保存修改' : '创建区域' }}</el-button>
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
  pageSize: 5,
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
  try {
    await ElMessageBox.confirm(`确认删除区域「${row.areaName}」吗？`, '删除确认', {
      type: 'warning',
      confirmButtonText: '确认删除',
      cancelButtonText: '取消'
    })
  } catch {
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
