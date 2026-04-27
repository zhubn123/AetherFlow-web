<template>
  <div class="wms-page">
    <header class="page-header">
      <div>
        <h1>仓库管理</h1>
        <p>维护仓库基础信息，作为库位和库存的上层组织。</p>
      </div>
      <RouterLink to="/dashboard"><el-button plain>返回首页</el-button></RouterLink>
    </header>

    <section class="panel">
      <h2>查询条件</h2>
      <div class="field-grid">
        <div class="field">
          <label>仓库编码</label>
          <el-input v-model.trim="query.warehouseCode" placeholder="支持精确匹配" />
        </div>
        <div class="field">
          <label>仓库名称</label>
          <el-input v-model.trim="query.warehouseName" placeholder="支持模糊匹配" />
        </div>
      </div>
      <div class="actions-row">
        <el-button type="primary" :disabled="loading" @click="loadData">查询</el-button>
        <el-button :disabled="loading" @click="resetQuery">重置</el-button>
      </div>
    </section>

    <section class="panel">
      <h2>仓库列表（{{ rows.length }}）</h2>
      <el-alert v-if="successMessage" class="message" type="success" :closable="false" :show-icon="true" :title="successMessage" />
      <el-alert v-if="errorMessage" class="message" type="error" :closable="false" :show-icon="true" :title="errorMessage" />
      <div class="actions-row">
        <el-button type="primary" :disabled="loading" @click="openCreateDialog">新增仓库</el-button>
      </div>
      <el-table :data="rows" v-loading="loading" empty-text="暂无数据">
        <el-table-column label="编码" min-width="120">
          <template #default="{ row }">{{ row.warehouseCode || '-' }}</template>
        </el-table-column>
        <el-table-column prop="warehouseName" label="名称" min-width="180" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'warning' : 'success'" effect="light">
              {{ row.status === 1 ? '停用' : '正常' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="备注" min-width="220">
          <template #default="{ row }">{{ row.remark || '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="startEdit(row)">编辑</el-button>
            <el-button link type="danger" size="small" @click="removeRow(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </section>

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
        <div class="field" style="grid-column: span 2;">
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
import { RouterLink } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { createWarehouse, queryWarehouses, removeWarehouses, updateWarehouse, type WarehouseQuery } from '@/api/wms'
import type { Warehouse } from '@/types/wms'

const loading = ref(false)
const rows = ref<Warehouse[]>([])
const successMessage = ref('')
const errorMessage = ref('')
const isEditing = ref(false)
const formVisible = ref(false)

const query = reactive<WarehouseQuery>({
  pageNo: 1,
  pageSize: 20,
  warehouseCode: '',
  warehouseName: ''
})

const form = reactive<Partial<Warehouse>>({
  id: undefined,
  warehouseName: '',
  status: 0,
  remark: ''
})

const formTitle = computed(() => (isEditing.value ? '编辑仓库' : '新增仓库'))

function clearMessages(): void {
  successMessage.value = ''
  errorMessage.value = ''
}

function resetQuery(): void {
  query.warehouseCode = ''
  query.warehouseName = ''
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
    rows.value = await queryWarehouses(query)
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

onMounted(() => {
  void loadData()
})
</script>

<style scoped src="./wms-page.css"></style>
