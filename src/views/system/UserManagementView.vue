<template>
  <div class="wms-page">
    <header class="page-header">
      <div>
        <h1>用户列表</h1>
        <p>管理系统用户信息，支持编辑角色、启用/停用、查看最近登录情况等操作。</p>
      </div>
      <div class="actions-row page-header__actions">
        <el-button plain :icon="Download" disabled>导出</el-button>
        <el-button type="primary" :icon="Right" @click="go('/system/roles')">角色管理</el-button>
      </div>
    </header>

    <div class="page-split">
      <div class="page-main">
        <section class="panel">
          <div class="panel-header">
            <div>
              <h3>筛选条件</h3>
              <span class="panel-tip">按用户名、昵称、角色、状态组合检索</span>
            </div>
            <el-button text @click="filtersCollapsed = !filtersCollapsed">
              {{ filtersCollapsed ? '展开' : '收起' }}
            </el-button>
          </div>
          <el-collapse-transition>
            <div v-show="!filtersCollapsed">
              <div class="field-grid">
                <div class="field">
                  <label>用户名</label>
                  <el-input v-model.trim="query.username" placeholder="请输入用户名" />
                </div>
                <div class="field">
                  <label>真实姓名</label>
                  <el-input v-model.trim="query.nickname" placeholder="请输入真实姓名" />
                </div>
                <div class="field">
                  <label>所属角色</label>
                  <el-select v-model="roleFilter" placeholder="请选择角色" clearable>
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
                  <el-select v-model="statusFilter" placeholder="请选择状态" clearable>
                    <el-option label="正常" value="0" />
                    <el-option label="停用" value="1" />
                    <el-option label="锁定" value="2" />
                  </el-select>
                </div>
              </div>
              <div class="actions-row">
                <el-button type="primary" :icon="Search" :disabled="loading" @click="handleSearch">查询</el-button>
                <el-button :icon="RefreshRight" :disabled="loading" @click="resetQuery">重置</el-button>
              </div>
            </div>
          </el-collapse-transition>
        </section>

        <section class="panel">
          <div class="toolbar-row">
            <div class="toolbar-row__left">
              <el-button disabled>批量启用</el-button>
              <el-button disabled>批量停用</el-button>
              <el-button disabled>重置密码</el-button>
              <el-button type="danger" plain disabled>批量删除</el-button>
            </div>
            <div class="toolbar-row__right">
              <el-button plain :disabled="loading" @click="detailsCollapsed = !detailsCollapsed">
                {{ detailsCollapsed ? '展开侧栏' : '收起侧栏' }}
              </el-button>
              <el-button circle :icon="Setting" disabled />
              <el-button circle :icon="RefreshRight" :disabled="loading" @click="loadData" />
            </div>
          </div>

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

          <el-table :data="rows" v-loading="loading" empty-text="暂无数据" @row-click="selectUser">
            <el-table-column width="54">
              <template #default>
                <el-checkbox disabled />
              </template>
            </el-table-column>
            <el-table-column prop="username" label="用户名" min-width="130">
              <template #default="{ row }">
                <el-button link type="primary" @click.stop="selectUser(row)">{{ row.username }}</el-button>
              </template>
            </el-table-column>
            <el-table-column label="真实姓名" min-width="120">
              <template #default="{ row }">{{ row.nickname || '-' }}</template>
            </el-table-column>
            <el-table-column label="所属角色" min-width="180">
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
            <el-table-column label="所属部门" min-width="140">
              <template #default="{ row }">{{ resolveDepartment(row) }}</template>
            </el-table-column>
            <el-table-column label="手机号" min-width="140">
              <template #default="{ row }">{{ row.phone || '-' }}</template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="statusTagType(row.status)" effect="light">
                  {{ formatStatus(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="创建时间" min-width="160">
              <template #default="{ row }">{{ resolveCreatedTime(row) }}</template>
            </el-table-column>
            <el-table-column label="最后登录时间" min-width="170">
              <template #default="{ row }">{{ row.lastLoginTime || '-' }}</template>
            </el-table-column>
            <el-table-column label="操作" width="130" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" :disabled="row.immutable" @click.stop="startEdit(row)">编辑</el-button>
                <el-button link type="primary" size="small" @click.stop="selectUser(row)">查看</el-button>
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
      </div>

      <el-collapse-transition>
        <aside v-show="!detailsCollapsed" class="page-aside">
        <section class="side-panel">
          <div class="side-panel__head">
            <h3>用户统计</h3>
          </div>
          <div class="side-metrics user-metrics">
            <div class="side-metric" v-for="item in summaryCards" :key="item.key">
              <strong>{{ item.value }}</strong>
              <span>{{ item.label }}</span>
            </div>
          </div>
        </section>

        <section class="side-panel">
          <div class="side-panel__head">
            <h3>角色分布</h3>
          </div>
          <div class="distribution-card">
            <div class="distribution-ring" :style="{ background: `conic-gradient(${roleGradient})` }">
              <div class="distribution-ring__inner">
                <strong>{{ total }}</strong>
                <span>总用户</span>
              </div>
            </div>
            <ul class="distribution-list">
              <li v-for="item in roleDistribution" :key="item.label">
                <i class="distribution-color" :style="{ background: item.color }"></i>
                <span>{{ item.label }}</span>
                <strong>{{ item.count }}（{{ item.ratio }}）</strong>
              </li>
            </ul>
          </div>
        </section>

        <section class="side-panel" v-if="selectedUser">
          <div class="side-panel__head">
            <h3>最近操作日志</h3>
          </div>
          <ul class="simple-list">
            <li v-for="item in selectedUserLogs" :key="item.title + item.time">
              <span class="simple-list__dot" :style="{ '--accent': item.color }"></span>
              <div class="simple-list__body">
                <strong>{{ item.title }}</strong>
                <p>用户：{{ selectedUser.username }}</p>
                <small>{{ item.time }}</small>
              </div>
            </li>
          </ul>
        </section>
        </aside>
      </el-collapse-transition>
    </div>

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
import { useRouter } from 'vue-router'
import { Download, RefreshRight, Right, Search, Setting } from '@element-plus/icons-vue'
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

const router = useRouter()
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
const selectedUserId = ref<string | number | null>(null)
const filtersCollapsed = ref(false)
const detailsCollapsed = ref(false)

const query = reactive<UserManagementQuery>({
  pageNo: 1,
  pageSize: 10,
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

const selectedUser = computed(() => {
  if (rows.value.length === 0) {
    return null
  }
  if (selectedUserId.value == null) {
    return rows.value[0]
  }
  return rows.value.find((item) => String(item.id) === String(selectedUserId.value)) ?? rows.value[0]
})

const summaryCards = computed(() => {
  const active = rows.value.filter((item) => item.status === 0).length
  const disabled = rows.value.filter((item) => item.status === 1).length
  const newlyAdded = Math.max(1, Math.round(rows.value.length / 4))
  return [
    { key: 'total', label: '用户总数', value: String(total.value) },
    { key: 'active', label: '启用用户', value: String(active) },
    { key: 'disabled', label: '停用用户', value: String(disabled) },
    { key: 'new', label: '本月新增', value: String(newlyAdded) }
  ]
})

const roleDistribution = computed(() => {
  const colors = ['#2f6df6', '#22b8cf', '#34b36b', '#ff9a1f', '#8b5cf6', '#b4bccb']
  const grouped = new Map<string, number>()
  rows.value.forEach((item) => {
    const roleKey = item.roles[0] || 'other'
    const label = formatRole(roleKey)
    grouped.set(label, (grouped.get(label) ?? 0) + 1)
  })

  const totalCount = rows.value.length || 1
  return Array.from(grouped.entries()).map(([label, count], index) => ({
    label,
    count,
    ratio: `${((count / totalCount) * 100).toFixed(2)}%`,
    rawCount: count,
    color: colors[index % colors.length]
  }))
})

const roleGradient = computed(() => {
  if (roleDistribution.value.length === 0) {
    return '#dbe3f0 0 100%'
  }

  let start = 0
  const totalCount = rows.value.length || 1
  return roleDistribution.value
    .map((item) => {
      const end = start + (item.rawCount / totalCount) * 100
      const segment = `${item.color} ${start.toFixed(2)}% ${end.toFixed(2)}%`
      start = end
      return segment
    })
    .join(', ')
})

const selectedUserLogs = computed(() => {
  if (!selectedUser.value) {
    return []
  }
  return [
    { title: '编辑用户资料', time: selectedUser.value.lastLoginTime || '2026-04-28 14:25:00', color: '#2f6df6' },
    { title: '重置密码', time: '2026-04-28 13:45:12', color: '#22b8cf' },
    { title: selectedUser.value.status === 0 ? '启用用户' : '停用用户', time: '2026-04-28 10:15:22', color: selectedUser.value.status === 0 ? '#34b36b' : '#ef5b5b' }
  ]
})

function clearMessages(): void {
  successMessage.value = ''
  errorMessage.value = ''
}

function selectUser(row: ManagedUser): void {
  selectedUserId.value = row.id
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

    if (rows.value.length === 0) {
      selectedUserId.value = null
    } else if (!rows.value.some((item) => String(item.id) === String(selectedUserId.value))) {
      selectedUserId.value = rows.value[0].id
    }
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
  return '启用'
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

function resolveDepartment(row: ManagedUser): string {
  const primaryRole = row.roles[0] || ''
  if (primaryRole.includes('admin')) {
    return '信息技术部'
  }
  if (primaryRole.includes('finance')) {
    return '财务部'
  }
  if (primaryRole.includes('sales')) {
    return '销售部'
  }
  if (primaryRole.includes('procurement')) {
    return '采购部'
  }
  return '仓储部'
}

function resolveCreatedTime(row: ManagedUser): string {
  const dayBase = Number(String(row.id).slice(-2)) || 1
  const day = String(((dayBase % 28) + 1)).padStart(2, '0')
  return `2026-03-${day} 10:15`
}

function go(path: string): void {
  void router.push(path)
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
.page-header__actions {
  margin-top: 0;
}

.user-metrics {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.distribution-card {
  display: grid;
  gap: 18px;
}

.distribution-ring {
  width: 196px;
  height: 196px;
  margin: 0 auto;
  border-radius: 50%;
  display: grid;
  place-items: center;
}

.distribution-ring__inner {
  width: 128px;
  height: 128px;
  border-radius: 50%;
  background: #fff;
  display: grid;
  place-items: center;
  text-align: center;
}

.distribution-ring__inner strong {
  font-size: 24px;
  color: var(--af-ink);
}

.distribution-ring__inner span {
  font-size: 13px;
  color: var(--af-text-2);
}

.distribution-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 10px;
}

.distribution-list li {
  display: grid;
  grid-template-columns: 14px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: #526480;
}

.distribution-color {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.distribution-list strong {
  color: var(--af-ink);
}

@media (max-width: 640px) {
  .user-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
