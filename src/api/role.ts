import { requestApi } from '@/utils/request'
import type { IdValue, PageResult } from '@/types/common'

function buildIdsQuery(ids: IdValue[]): string {
  const query = new URLSearchParams()
  ids.forEach((id) => query.append('ids', String(id)))
  return query.toString()
}

export interface RoleManagementQuery {
  pageNo: number
  pageSize: number
  roleKey?: string
  roleName?: string
  status?: number
}

export interface RoleRecord {
  id: IdValue
  roleKey: string
  roleName: string
  status: number
  remark?: string
  builtIn: boolean
  modifiable: boolean
  deletable: boolean
  userCount: number
  permissionCount: number
  permissionKeys: string[]
  permissionNames: string[]
}

export interface RoleOption {
  id: IdValue
  roleKey: string
  roleName: string
  status: number
  builtIn: boolean
  modifiable: boolean
  permissionKeys: string[]
  permissionNames: string[]
}

export interface PermissionOption {
  id: IdValue
  permKey: string
  permName: string
  module: string
  moduleName: string
  action: string
  status: number
  remark?: string
}

export interface PermissionGroup {
  module: string
  moduleName: string
  permissions: PermissionOption[]
}

export interface RoleSaveRequest {
  roleKey: string
  roleName: string
  status: number
  remark?: string
  permissionKeys: string[]
}

export const queryRolePage = async (params: RoleManagementQuery): Promise<PageResult<RoleRecord>> => {
  return requestApi<PageResult<RoleRecord>>({
    url: '/roles',
    method: 'get',
    params
  })
}

export const getRoleDetailApi = async (roleId: IdValue): Promise<RoleRecord> => {
  return requestApi<RoleRecord>({
    url: `/roles/${roleId}`,
    method: 'get'
  })
}

export const queryRoleOptionsApi = async (): Promise<RoleOption[]> => {
  return requestApi<RoleOption[]>({
    url: '/roles/options',
    method: 'get'
  })
}

export const createRoleApi = async (data: RoleSaveRequest): Promise<void> => {
  await requestApi<void>({
    url: '/roles',
    method: 'post',
    data
  })
}

export const updateRoleApi = async (roleId: IdValue, data: RoleSaveRequest): Promise<void> => {
  await requestApi<void>({
    url: `/roles/${roleId}`,
    method: 'put',
    data
  })
}

export const deleteRolesApi = async (ids: IdValue[]): Promise<void> => {
  await requestApi<void>({
    url: `/roles?${buildIdsQuery(ids)}`,
    method: 'delete'
  })
}

export const listPermissionCatalogApi = async (): Promise<PermissionGroup[]> => {
  return requestApi<PermissionGroup[]>({
    url: '/permissions',
    method: 'get'
  })
}
