<template>
  <div class="wms-page">
    <header class="page-header">
      <div>
        <h1>角色管理</h1>
        <p>维护角色、查看角色覆盖范围，并为角色分配权限。用户实际权限由所选角色自动继承。</p>
      </div>
      <div class="actions-row">
        <RouterLink to="/system/users"><el-button type="primary" plain>用户管理</el-button></RouterLink>
        <RouterLink to="/dashboard"><el-button plain>返回首页</el-button></RouterLink>
      </div>
    </header>

    <section class="panel">
      <h2>查询条件</h2>
      <div class="field-grid">
        <div class="field">
          <label>角色标识</label>
          <el-input v-model.trim="query.roleKey" placeholder="支持精确匹配" />
        </div>
        <div class="field">
          <label>角色名称</label>
          <el-input v-model.trim="query.roleName" placeholder="支持模糊匹配" />
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
        <el-button type="success" :disabled="loading" @click="startCreate">新增角色</el-button>
      </div>
    </section>

    <section class="panel">
      <h2>角色列表</h2>
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
      <p class="muted-tip">内置 `admin` 角色权限固定为全量；`operator`、`viewer` 可调整权限集合但不允许删除。</p>
      <el-table :data="rows" v-loading="loading" empty-text="暂无数据">
        <el-table-column label="角色标识" min-width="160">
          <template #default="{ row }">
            <div class="tag-stack">
              <span>{{ row.roleKey }}</span>
              <el-tag v-if="row.builtIn" type="warning" size="small" effect="light">内置</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="roleName" label="角色名称" min-width="160" />
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" effect="light">
              {{ formatStatus(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="关联用户" width="110">
          <template #default="{ row }">{{ row.userCount }}</template>
        </el-table-column>
        <el-table-column label="权限数" width="100">
          <template #default="{ row }">{{ row.permissionCount }}</template>
        </el-table-column>
        <el-table-column label="权限预览" min-width="300">
          <template #default="{ row }">
            <div class="tag-list">
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
              <span v-if="row.permissionNames.length === 0">-</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="备注" min-width="180">
          <template #default="{ row }">{{ row.remark || '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              size="small"
              :disabled="!row.modifiable"
              @click="startEdit(row)"
            >
              编辑
            </el-button>
            <el-button
              link
              type="danger"
              size="small"
              :disabled="!row.deletable || row.userCount > 0"
              @click="removeRole(row)"
            >
              删除
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
      width="980px"
      :close-on-click-modal="false"
      @closed="resetForm"
    >
      <div class="field-grid">
        <div class="field">
          <label>角色标识</label>
          <el-input
            v-model.trim="form.roleKey"
            placeholder="例如 custom:purchase:manager"
            :disabled="!form.roleKeyEditable"
          />
        </div>
        <div class="field">
          <label>角色名称</label>
          <el-input v-model.trim="form.roleName" placeholder="请输入角色名称" />
        </div>
        <div class="field">
          <label>状态</label>
          <el-select v-model="form.status" placeholder="请选择状态">
            <el-option label="正常" :value="0" />
            <el-option label="停用" :value="1" />
          </el-select>
        </div>
        <div class="field field--full">
          <label>备注</label>
          <el-input v-model.trim="form.remark" type="textarea" :rows="2" placeholder="请输入备注" />
        </div>
      </div>

      <div class="permission-panel">
        <div class="panel-header">
          <h3>权限分配</h3>
          <span class="panel-tip">已选 {{ form.permissionKeys.length }} 项</span>
        </div>
        <div class="permission-groups">
          <section
            v-for="group in permissionGroups"
            :key="group.module"
            class="permission-group"
          >
            <div class="group-heading">
              <h4>{{ group.moduleName }}</h4>
              <span>{{ group.permissions.length }} 项</span>
            </div>
            <el-checkbox-group v-model="form.permissionKeys" class="permission-checks">
              <el-checkbox
                v-for="permission in group.permissions"
                :key="permission.permKey"
                :label="permission.permKey"
              >
                <div class="permission-label">
                  <span>{{ permission.permName }}</span>
                  <small>{{ permission.permKey }}</small>
                </div>
              </el-checkbox>
            </el-checkbox-group>
          </section>
        </div>
      </div>

      <template #footer>
        <div class="actions-row">
          <el-button type="primary" :disabled="loading" @click="submitForm">保存角色</el-button>
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
import {
  createRoleApi,
  deleteRolesApi,
  getRoleDetailApi,
  listPermissionCatalogApi,
  queryRolePage,
  type PermissionGroup,
  type RoleManagementQuery,
  type RoleRecord,
  type RoleSaveRequest,
  updateRoleApi
} from '@/api/role'
import type { IdValue } from '@/types/common'

interface RoleManagementForm {
  id?: IdValue
  roleKey: string
  roleName: string
  status: number
  remark: string
  permissionKeys: string[]
  roleKeyEditable: boolean
}

const loading = ref(false)
const rows = ref<RoleRecord[]>([])
const total = ref(0)
const pages = ref(0)
const successMessage = ref('')
const errorMessage = ref('')
const statusFilter = ref('')
const formVisible = ref(false)
const permissionGroups = ref<PermissionGroup[]>([])

const query = reactive<RoleManagementQuery>({
  pageNo: 1,
  pageSize: 5,
  roleKey: '',
  roleName: '',
  status: undefined
})

const form = reactive<RoleManagementForm>({
  id: undefined,
  roleKey: '',
  roleName: '',
  status: 0,
  remark: '',
  permissionKeys: [],
  roleKeyEditable: true
})

const formTitle = computed(() => {
  return form.id ? `编辑角色：${form.roleName || form.roleKey}` : '新增角色'
})

function clearMessages(): void {
  successMessage.value = ''
  errorMessage.value = ''
}

function normalizeQuery(): void {
  query.status = statusFilter.value === '' ? undefined : Number(statusFilter.value)
}

function resetQuery(): void {
  query.pageNo = 1
  query.roleKey = ''
  query.roleName = ''
  statusFilter.value = ''
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
  form.roleKey = ''
  form.roleName = ''
  form.status = 0
  form.remark = ''
  form.permissionKeys = []
  form.roleKeyEditable = true
}

function closeDialog(): void {
  formVisible.value = false
  resetForm()
}

function startCreate(): void {
  clearMessages()
  resetForm()
  formVisible.value = true
}

async function startEdit(row: RoleRecord): Promise<void> {
  clearMessages()
  loading.value = true
  try {
    const detail = await getRoleDetailApi(row.id)
    formVisible.value = true
    form.id = detail.id
    form.roleKey = detail.roleKey
    form.roleName = detail.roleName
    form.status = detail.status
    form.remark = detail.remark || ''
    form.permissionKeys = [...detail.permissionKeys]
    form.roleKeyEditable = !detail.builtIn
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '角色详情加载失败'
  } finally {
    loading.value = false
  }
}

async function removeRole(row: RoleRecord): Promise<void> {
  try {
    await ElMessageBox.confirm(
      `确认删除角色“${row.roleName}”吗？删除后不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
  } catch {
    return
  }

  loading.value = true
  clearMessages()
  try {
    await deleteRolesApi([row.id])
    successMessage.value = '角色删除成功'
    await loadData()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '角色删除失败'
  } finally {
    loading.value = false
  }
}

async function loadPermissionCatalog(): Promise<void> {
  permissionGroups.value = await listPermissionCatalogApi()
}

async function loadData(): Promise<void> {
  clearMessages()
  normalizeQuery()
  loading.value = true
  try {
    const result = await queryRolePage(query)
    rows.value = result.records
    total.value = result.total
    pages.value = Math.max(result.pages, 1)
    query.pageNo = result.pageNo
    query.pageSize = result.pageSize
  } catch (error) {
    rows.value = []
    total.value = 0
    pages.value = 0
    errorMessage.value = error instanceof Error ? error.message : '角色列表加载失败'
  } finally {
    loading.value = false
  }
}

async function submitForm(): Promise<void> {
  clearMessages()
  if (form.permissionKeys.length === 0) {
    errorMessage.value = '至少选择一个权限'
    return
  }

  const payload: RoleSaveRequest = {
    roleKey: form.roleKey,
    roleName: form.roleName,
    status: form.status,
    remark: form.remark || undefined,
    permissionKeys: form.permissionKeys
  }

  loading.value = true
  try {
    if (form.id === undefined) {
      await createRoleApi(payload)
      successMessage.value = '角色创建成功'
    } else {
      await updateRoleApi(form.id, payload)
      successMessage.value = '角色更新成功'
    }
    closeDialog()
    await loadData()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '角色保存失败'
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

function formatStatus(status: number): string {
  return status === 1 ? '停用' : '正常'
}

function statusTagType(status: number): '' | 'success' | 'warning' {
  return status === 1 ? 'warning' : 'success'
}

onMounted(async () => {
  loading.value = true
  try {
    await Promise.all([loadPermissionCatalog(), loadData()])
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '初始化角色管理失败'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped src="../wms/wms-page.css"></style>

<style scoped>
.tag-stack {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.permission-more {
  color: #7b8ead;
  font-size: 12px;
}

.permission-panel {
  margin-top: 18px;
  display: grid;
  gap: 12px;
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

.permission-groups {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 12px;
}

.permission-group {
  border: 1px solid #dce4f2;
  border-radius: 14px;
  padding: 14px;
  background: #f8fbff;
  display: grid;
  gap: 12px;
}

.group-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.group-heading h4 {
  margin: 0;
  font-size: 14px;
  color: #1f3355;
}

.group-heading span {
  font-size: 12px;
  color: #7b8ead;
}

.permission-checks {
  display: grid;
  gap: 10px;
}

.permission-label {
  display: grid;
  gap: 2px;
}

.permission-label span {
  color: #213655;
}

.permission-label small {
  color: #7b8ead;
}

.field--full {
  grid-column: 1 / -1;
}
</style>
