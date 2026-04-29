<template>
  <div class="wms-page">
    <header class="page-header">
      <div>
        <h1>用户管理</h1>
        <p>维护账号基础信息、角色分配与启停状态，当前页面按现有管理页风格先行落地。</p>
      </div>
      <RouterLink to="/dashboard"><el-button plain>返回首页</el-button></RouterLink>
    </header>

    <section class="panel">
      <h2>查询条件</h2>
      <div class="field-grid">
        <div class="field">
          <label>用户名</label>
          <el-input v-model.trim="query.username" placeholder="支持精确匹配" />
        </div>
        <div class="field">
          <label>昵称</label>
          <el-input v-model.trim="query.nickname" placeholder="支持模糊匹配" />
        </div>
        <div class="field">
          <label>角色</label>
          <el-select v-model="roleFilter" placeholder="全部" clearable>
            <el-option label="管理员" value="admin" />
            <el-option label="操作员" value="operator" />
            <el-option label="只读" value="viewer" />
          </el-select>
        </div>
        <div class="field">
          <label>状态</label>
          <el-select v-model="statusFilter" placeholder="全部" clearable>
            <el-option label="正常" value="0" />
            <el-option label="停用" value="1" />
            <el-option label="锁定" value="2" />
          </el-select>
        </div>
      </div>
      <div class="actions-row">
        <el-button type="primary" :disabled="loading" @click="handleSearch">查询</el-button>
        <el-button :disabled="loading" @click="resetQuery">重置</el-button>
      </div>
    </section>

    <section class="panel">
      <h2>用户列表</h2>
      <el-alert
        v-if="backendPending"
        class="message"
        type="info"
        :closable="false"
        :show-icon="true"
        title="后端用户管理接口尚未接入，当前页面已先完成前端结构与交互承载。"
      />
      <el-alert
        v-if="successMessage"
        class="message"
        type="success"
        :closable="false"
        :show-icon="true"
        :title="successMessage"
      />
      <el-alert
        v-if="errorMessage"
        class="message"
        type="error"
        :closable="false"
        :show-icon="true"
        :title="errorMessage"
      />
      <p class="muted-tip">当前默认角色边界：`admin` 全权限，`operator` 主数据只读且单据可操作，`viewer` 全局只读。</p>
      <el-table :data="rows" v-loading="loading" empty-text="暂无数据">
        <el-table-column prop="username" label="用户名" min-width="140" />
        <el-table-column label="昵称" min-width="140">
          <template #default="{ row }">{{ row.nickname || '-' }}</template>
        </el-table-column>
        <el-table-column label="角色" min-width="180">
          <template #default="{ row }">
            <div class="tag-list">
              <el-tag
                v-for="role in row.roles"
                :key="role"
                :type="roleTagType(role)"
                effect="light"
              >
                {{ formatRole(role) }}
              </el-tag>
              <span v-if="!row.roles.length">-</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" effect="light">
              {{ formatStatus(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="邮箱" min-width="190">
          <template #default="{ row }">{{ row.email || '-' }}</template>
        </el-table-column>
        <el-table-column label="手机号" min-width="140">
          <template #default="{ row }">{{ row.phone || '-' }}</template>
        </el-table-column>
        <el-table-column label="最后登录" min-width="180">
          <template #default="{ row }">{{ row.lastLoginTime || '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="startEdit(row)">编辑</el-button>
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
          <label>用户名</label>
          <el-input v-model="form.username" disabled />
        </div>
        <div class="field">
          <label>状态</label>
          <el-select v-model="form.status" placeholder="请选择状态">
            <el-option label="正常" :value="0" />
            <el-option label="停用" :value="1" />
            <el-option label="锁定" :value="2" />
          </el-select>
        </div>
        <div class="field">
          <label>昵称</label>
          <el-input v-model.trim="form.nickname" placeholder="请输入昵称" />
        </div>
        <div class="field">
          <label>邮箱</label>
          <el-input v-model.trim="form.email" placeholder="请输入邮箱" />
        </div>
        <div class="field">
          <label>手机号</label>
          <el-input v-model.trim="form.phone" placeholder="请输入手机号" />
        </div>
        <div class="field">
          <label>角色 *</label>
          <el-select v-model="form.roleKeys" multiple placeholder="请选择角色">
            <el-option label="管理员" value="admin" />
            <el-option label="操作员" value="operator" />
            <el-option label="只读" value="viewer" />
          </el-select>
        </div>
      </div>
      <template #footer>
        <div class="actions-row">
          <el-button type="primary" :disabled="loading" @click="submitForm">保存修改</el-button>
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
import WmsPagination from '@/components/WmsPagination.vue'
import {
  queryUserPage,
  updateManagedUserApi,
  type ManagedUser,
  type ManagedUserUpdateRequest,
  type UserManagementQuery
} from '@/api/user'
import type { IdValue } from '@/types/common'

interface UserManagementForm {
  id?: IdValue
  username: string
  nickname: string
  email: string
  phone: string
  status: number
  roleKeys: string[]
}

const loading = ref(false)
const rows = ref<ManagedUser[]>([])
const total = ref(0)
const pages = ref(0)
const successMessage = ref('')
const errorMessage = ref('')
const backendPending = ref(false)
const formVisible = ref(false)
const roleFilter = ref('')
const statusFilter = ref('')

const query = reactive<UserManagementQuery>({
  pageNo: 1,
  pageSize: 5,
  username: '',
  nickname: '',
  roleKey: undefined,
  status: undefined
})

const form = reactive<UserManagementForm>({
  id: undefined,
  username: '',
  nickname: '',
  email: '',
  phone: '',
  status: 0,
  roleKeys: []
})

const formTitle = computed(() => {
  return form.username ? `编辑用户：${form.username}` : '编辑用户'
})

function clearMessages(): void {
  successMessage.value = ''
  errorMessage.value = ''
}

function normalizeQuery(): void {
  query.roleKey = roleFilter.value || undefined
  query.status = statusFilter.value === '' ? undefined : Number(statusFilter.value)
}

function resetQuery(): void {
  query.pageNo = 1
  query.username = ''
  query.nickname = ''
  roleFilter.value = ''
  statusFilter.value = ''
  query.roleKey = undefined
  query.status = undefined
  void loadData()
}

function handleSearch(): void {
  query.pageNo = 1
  normalizeQuery()
  void loadData()
}

function resetForm(): void {
  form.id = undefined
  form.username = ''
  form.nickname = ''
  form.email = ''
  form.phone = ''
  form.status = 0
  form.roleKeys = []
}

function closeDialog(): void {
  formVisible.value = false
  resetForm()
}

function startEdit(row: ManagedUser): void {
  clearMessages()
  formVisible.value = true
  form.id = row.id
  form.username = row.username
  form.nickname = row.nickname || ''
  form.email = row.email || ''
  form.phone = row.phone || ''
  form.status = row.status ?? 0
  form.roleKeys = [...row.roles]
}

async function loadData(): Promise<void> {
  clearMessages()
  normalizeQuery()
  loading.value = true
  try {
    const result = await queryUserPage(query)
    backendPending.value = false
    rows.value = result.records
    total.value = result.total
    pages.value = Math.max(result.pages, 1)
    query.pageNo = result.pageNo
    query.pageSize = result.pageSize
  } catch (error) {
    rows.value = []
    total.value = 0
    pages.value = 0
    if (isNotReadyError(error)) {
      backendPending.value = true
      errorMessage.value = ''
    } else {
      backendPending.value = false
      errorMessage.value = error instanceof Error ? error.message : '用户列表加载失败'
    }
  } finally {
    loading.value = false
  }
}

async function submitForm(): Promise<void> {
  clearMessages()
  if (form.id === undefined) {
    errorMessage.value = '请选择要编辑的用户'
    return
  }
  if (form.roleKeys.length === 0) {
    errorMessage.value = '至少选择一个角色'
    return
  }

  const payload: ManagedUserUpdateRequest = {
    nickname: form.nickname || undefined,
    email: form.email || undefined,
    phone: form.phone || undefined,
    status: form.status,
    roleKeys: form.roleKeys
  }

  loading.value = true
  try {
    await updateManagedUserApi(form.id, payload)
    backendPending.value = false
    successMessage.value = '用户更新成功'
    closeDialog()
    await loadData()
  } catch (error) {
    if (isNotReadyError(error)) {
      backendPending.value = true
      errorMessage.value = '后端用户管理写接口尚未接入，当前前端表单结构已准备完成。'
    } else {
      errorMessage.value = error instanceof Error ? error.message : '保存失败'
    }
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

function formatRole(roleKey: string): string {
  if (roleKey === 'admin') {
    return '管理员'
  }
  if (roleKey === 'operator') {
    return '操作员'
  }
  if (roleKey === 'viewer') {
    return '只读'
  }
  return roleKey
}

function roleTagType(roleKey: string): '' | 'success' | 'warning' | 'info' | 'danger' {
  if (roleKey === 'admin') {
    return 'danger'
  }
  if (roleKey === 'operator') {
    return 'success'
  }
  return 'info'
}

function formatStatus(status: number): string {
  if (status === 1) {
    return '停用'
  }
  if (status === 2) {
    return '锁定'
  }
  return '正常'
}

function statusTagType(status: number): '' | 'success' | 'warning' | 'info' | 'danger' {
  if (status === 1) {
    return 'warning'
  }
  if (status === 2) {
    return 'danger'
  }
  return 'success'
}

function isNotReadyError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false
  }
  const message = error.message.toLowerCase()
  return message.includes('404') || message.includes('资源不存在') || message.includes('not found')
}

onMounted(() => {
  void loadData()
})
</script>

<style scoped src="../wms/wms-page.css"></style>

<style scoped>
.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
</style>
