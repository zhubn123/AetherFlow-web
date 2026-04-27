<template>
  <div class="wms-page">
    <header class="page-header">
      <div>
        <h1>物料管理</h1>
        <p>维护物料主数据，统一编码、规格和计量单位。</p>
      </div>
      <RouterLink to="/dashboard"><el-button plain>返回首页</el-button></RouterLink>
    </header>

    <section class="panel">
      <h2>查询条件</h2>
      <div class="field-grid">
        <div class="field">
          <label>物料编码</label>
          <el-input v-model.trim="query.materialCode" placeholder="支持精确匹配" />
        </div>
        <div class="field">
          <label>物料名称</label>
          <el-input v-model.trim="query.materialName" placeholder="支持模糊匹配" />
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
      <h2>物料列表</h2>
      <el-alert v-if="successMessage" class="message" type="success" :closable="false" :show-icon="true" :title="successMessage" />
      <el-alert v-if="errorMessage" class="message" type="error" :closable="false" :show-icon="true" :title="errorMessage" />
      <div class="actions-row">
        <el-button type="primary" :disabled="loading" @click="openCreateDialog">新增物料</el-button>
      </div>
      <el-table :data="rows" v-loading="loading" empty-text="暂无数据">
        <el-table-column label="编码" min-width="130">
          <template #default="{ row }">{{ row.materialCode || '-' }}</template>
        </el-table-column>
        <el-table-column prop="materialName" label="名称" min-width="160" />
        <el-table-column label="规格" min-width="160">
          <template #default="{ row }">{{ row.specification || '-' }}</template>
        </el-table-column>
        <el-table-column label="单位" min-width="100">
          <template #default="{ row }">{{ row.unit || '-' }}</template>
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
          <label>物料名称 *</label>
          <el-input v-model="form.materialName" placeholder="请输入物料名称" />
        </div>
        <div class="field">
          <label>规格型号</label>
          <el-input v-model="form.specification" placeholder="可选" />
        </div>
        <div class="field">
          <label>计量单位</label>
          <el-input v-model="form.unit" placeholder="例如 个 / 箱 / kg" />
        </div>
        <div class="field">
          <label>状态</label>
          <el-select v-model="form.status" placeholder="请选择状态">
            <el-option label="正常" :value="0" />
            <el-option label="停用" :value="1" />
          </el-select>
        </div>
      </div>
      <template #footer>
        <div class="actions-row">
          <el-button type="primary" :disabled="loading" @click="submitForm">{{ isEditing ? '保存修改' : '创建物料' }}</el-button>
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
import { createMaterial, queryMaterials, removeMaterials, updateMaterial, type MaterialQuery } from '@/api/wms'
import type { Material } from '@/types/wms'

const loading = ref(false)
const rows = ref<Material[]>([])
const total = ref(0)
const pages = ref(0)
const successMessage = ref('')
const errorMessage = ref('')
const isEditing = ref(false)
const formVisible = ref(false)
const statusFilter = ref('')

const query = reactive<MaterialQuery>({
  pageNo: 1,
  pageSize: 10,
  materialCode: '',
  materialName: '',
  status: undefined
})

const form = reactive<Partial<Material>>({
  id: undefined,
  materialName: '',
  specification: '',
  unit: '',
  status: 0,
  remark: ''
})

const formTitle = computed(() => (isEditing.value ? '编辑物料' : '新增物料'))

function clearMessages(): void {
  successMessage.value = ''
  errorMessage.value = ''
}

function normalizeStatusFilter(): void {
  query.status = statusFilter.value === '' ? undefined : Number(statusFilter.value)
}

function handleSearch(): void {
  query.pageNo = 1
  normalizeStatusFilter()
  void loadData()
}

function resetQuery(): void {
  query.pageNo = 1
  query.materialCode = ''
  query.materialName = ''
  statusFilter.value = ''
  query.status = undefined
  void loadData()
}

function resetForm(): void {
  isEditing.value = false
  form.id = undefined
  form.materialName = ''
  form.specification = ''
  form.unit = ''
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

function startEdit(row: Material): void {
  clearMessages()
  formVisible.value = true
  isEditing.value = true
  form.id = row.id
  form.materialName = row.materialName
  form.specification = row.specification || ''
  form.unit = row.unit || ''
  form.status = row.status ?? 0
  form.remark = row.remark || ''
}

async function loadData(): Promise<void> {
  clearMessages()
  normalizeStatusFilter()
  loading.value = true
  try {
    const result = await queryMaterials(query)
    rows.value = result.records
    total.value = result.total
    pages.value = Math.max(result.pages, 1)
    query.pageNo = result.pageNo
    query.pageSize = result.pageSize
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '物料列表加载失败'
  } finally {
    loading.value = false
  }
}

async function submitForm(): Promise<void> {
  clearMessages()
  if (!form.materialName) {
    errorMessage.value = '物料名称不能为空'
    return
  }

  loading.value = true
  try {
    if (isEditing.value && form.id !== undefined) {
      await updateMaterial(form.id, {
        materialName: form.materialName,
        specification: form.specification,
        unit: form.unit,
        status: form.status ?? 0,
        remark: form.remark
      })
      successMessage.value = '物料更新成功'
    } else {
      await createMaterial({
        materialName: form.materialName,
        specification: form.specification,
        unit: form.unit,
        status: form.status ?? 0,
        remark: form.remark
      })
      successMessage.value = '物料创建成功'
    }
    closeDialog()
    await loadData()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '提交失败'
  } finally {
    loading.value = false
  }
}

async function removeRow(row: Material): Promise<void> {
  clearMessages()
  try {
    await ElMessageBox.confirm(`确认删除物料「${row.materialName}」吗？`, '删除确认', {
      type: 'warning',
      confirmButtonText: '确认删除',
      cancelButtonText: '取消'
    })
  } catch {
    return
  }

  loading.value = true
  try {
    await removeMaterials([row.id])
    successMessage.value = '物料删除成功'
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

onMounted(() => {
  void loadData()
})
</script>

<style scoped src="./wms-page.css"></style>
