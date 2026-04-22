<template>
  <div class="wms-page">
    <header class="page-header">
      <div>
        <h1>物料管理</h1>
        <p>维护物料主数据，统一编码、规格和计量单位。</p>
      </div>
      <RouterLink to="/dashboard" class="btn ghost">返回首页</RouterLink>
    </header>

    <WmsNav />

    <section class="panel">
      <h2>查询条件</h2>
      <div class="field-grid">
        <div class="field">
          <label>物料编码</label>
          <input v-model.trim="query.materialCode" type="text" placeholder="支持精确匹配" />
        </div>
        <div class="field">
          <label>物料名称</label>
          <input v-model.trim="query.materialName" type="text" placeholder="支持模糊匹配" />
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
      <h2>物料列表</h2>
      <div v-if="successMessage" class="message success">{{ successMessage }}</div>
      <div v-if="errorMessage" class="message error">{{ errorMessage }}</div>
      <div class="actions-row">
        <button class="btn" :disabled="loading" @click="openCreateDialog">新增物料</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>编码</th>
              <th>名称</th>
              <th>规格</th>
              <th>单位</th>
              <th>状态</th>
              <th>备注</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="String(row.id)">
              <td>{{ row.id }}</td>
              <td>{{ row.materialCode || '-' }}</td>
              <td>{{ row.materialName }}</td>
              <td>{{ row.specification || '-' }}</td>
              <td>{{ row.unit || '-' }}</td>
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
              <td class="empty-cell" colspan="8">暂无数据</td>
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
            <label>物料名称 *</label>
            <input v-model.trim="form.materialName" type="text" placeholder="请输入物料名称" />
          </div>
          <div class="field">
            <label>规格型号</label>
            <input v-model.trim="form.specification" type="text" placeholder="可选" />
          </div>
          <div class="field">
            <label>计量单位</label>
            <input v-model.trim="form.unit" type="text" placeholder="例如 个 / 箱 / kg" />
          </div>
          <div class="field">
            <label>状态</label>
            <select v-model.number="form.status">
              <option :value="0">正常</option>
              <option :value="1">停用</option>
            </select>
          </div>
        </div>
        <div class="actions-row">
          <button class="btn" :disabled="loading" @click="submitForm">{{ isEditing ? '保存修改' : '创建物料' }}</button>
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
  const confirmed = window.confirm(`确认删除物料「${row.materialName}」吗？`)
  if (!confirmed) {
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
