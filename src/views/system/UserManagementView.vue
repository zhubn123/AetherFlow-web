<template>
  <div class="wms-page">
    <header class="page-header">
      <div>
        <h1>用户管理</h1>
        <p>维护账号基础信息、角色分配与启停状态。权限通过角色配置，用户页展示的是当前生效权限。</p>
      </div>
      <div class="actions-row">
        <RouterLink to="/system/roles"><el-button type="primary" plain>角色管理</el-button></RouterLink>
        <RouterLink to="/dashboard"><el-button plain>返回首页</el-button></RouterLink>
      </div>
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
            <el-option
              v-for="role in roleOptions"
              :key="role.roleKey"
              :label="role.roleName"
              :value="role.roleKey"
            />
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
      <p class="muted-tip">权限通过角色继承，不在用户上单独维护。要调整权限集合，请进入“角色管理”。</p>
      <el-table :data="rows" v-loading="loading" empty-text="暂无数据">
        <el-table-column prop="username" label="用户名" min-width="150">
          <template #default="{ row }">
            <div class="tag-stack">
              <span>{{ row.username }}</span>
              <el-tag v-if="row.immutable" type="danger" size="small" effect="light">内置管理员</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="昵称" min-width="140">
          <template #default="{ row }">{{ row.nickname || '-' }}</template>
        </el-table-column>
        <el-table-column label="角色" min-width="210">
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
        <el-table-column label="生效权限" min-width="280">
          <template #default="{ row }">
            <div class="permission-preview">
              <template v-if="row.permissionNames.length">
                <el-tag
                  v-for="permission in row.permissionNames.slice(0, 4)"
                  :key="permission"
                  size="small"
                  effect="plain"
                  type="info"
                >
                  {{ permission }}
                </el-tag>
                <span v-if="row.permissionNames.length > 4" class="permission-more">
                  +{{ row.permissionNames.length - 4 }}
                </span>
              </template>
              <span v-else>-</span>
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
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              size="small"
              :disabled="row.immutable"
              @click="startEdit(row)"
            >
              编辑
            </el-button>
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
      width="860px"
      :close-on-click-modal="false"
      @closed="resetForm"
    >
      <el-alert
        class="message"
        type="info"
        :closable="false"
        :show-icon="true"
        title="权限通过角色自动继承。如需调整权限集合，请先到角色管理里维护角色。"
      />
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
            <el-option
              v-for="role in roleOptions"
              :key="role.roleKey"
              :label="role.roleName"
              :value="role.roleKey"
              :disabled="role.status !== 0"
            />
          </el-select>
        </div>
      </div>

      <div class="permission-panel">
        <div class="panel-header">
          <h3>角色联动后的生效权限</h3>
          <span class="panel-tip">共 {{ selectedPermissionNames.length }} 项</span>
        </div>
        <div class="tag-list">
          <el-tag
            v-for="permission in selectedPermissionNames"
            :key="permission"
            size="small"
            effect="plain"
            type="info"
          >
            {{ permission }}
          </el-tag>
          <span v-if="selectedPermissionNames.length === 0">当前未选角色</span>
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
import { queryRoleOptionsApi, type RoleOption } from '@/api/role'
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
const formVisible = ref(false)
const roleFilter = ref('')
const statusFilter = ref('')
const roleOptions = ref<RoleOption[]>([])

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

const roleOptionMap = computed(() => {
  return new Map(roleOptions.value.map((role) => [role.roleKey, role]))
})

const selectedPermissionNames = computed(() => {
  const permissionNames = new Set<string>()
  form.roleKeys.forEach((roleKey) => {
    const role = roleOptionMap.value.get(roleKey)
    role?.permissionNames.forEach((permissionName) => permissionNames.add(permissionName))
  })
  return Array.from(permissionNames)
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

async function loadRoleOptions(): Promise<void> {
  roleOptions.value = await queryRoleOptionsApi()
}

async function loadData(): Promise<void> {
  clearMessages()
  normalizeQuery()
  loading.value = true
  try {
    const result = await queryUserPage(query)
    rows.value = result.records
    total.value = result.total
    pages.value = Math.max(result.pages, 1)
    query.pageNo = result.pageNo
    query.pageSize = result.pageSize
  } catch (error) {
    rows.value = []
    total.value = 0
    pages.value = 0
    errorMessage.value = error instanceof Error ? error.message : '用户列表加载失败'
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
    successMessage.value = '用户更新成功'
    closeDialog()
    await Promise.all([loadRoleOptions(), loadData()])
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '保存失败'
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
  const role = roleOptionMap.value.get(roleKey)
  if (role) {
    return role.roleName
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

onMounted(async () => {
  loading.value = true
  try {
    await Promise.all([loadRoleOptions(), loadData()])
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '初始化用户管理失败'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped src="../wms/wms-page.css"></style>

<style scoped>
.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag-stack {
  display: flex;
  align-items: center;
  gap: 8px;
}

.permission-preview {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.permission-more {
  color: #7b8ead;
  font-size: 12px;
}

.permission-panel {
  margin-top: 18px;
  display: grid;
  gap: 10px;
  border-top: 1px solid #e3e8f3;
  padding-top: 16px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.panel-header h3 {
  margin: 0;
  font-size: 15px;
  color: #1f3355;
}

.panel-tip {
  font-size: 12px;
  color: #7b8ead;
}
</style>
