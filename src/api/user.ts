import { requestApi } from '@/utils/request'
import type { IdValue, PageResult } from '@/types/common'

export interface RegisterRequest {
  username: string
  password: string
  email?: string
  nickname?: string
  phone?: string
}

export interface ProfileInfo {
  id: string
  username: string
  email?: string
  nickname?: string
  phone?: string
}

export interface UserManagementQuery {
  pageNo: number
  pageSize: number
  username?: string
  nickname?: string
  roleKey?: string
  status?: number
}

export interface ManagedUser {
  id: IdValue
  username: string
  nickname?: string
  email?: string
  phone?: string
  status: number
  lastLoginTime?: string
  roles: string[]
}

export interface ManagedUserUpdateRequest {
  nickname?: string
  email?: string
  phone?: string
  status: number
  roleKeys: string[]
}

export interface ChangePasswordRequest {
  oldPassword: string
  newPassword: string
}

export const registerApi = async (data: RegisterRequest): Promise<string> => {
  const userId = await requestApi<number | string>({
    url: '/auth/register',
    method: 'post',
    data
  })
  return String(userId)
}

export const getProfileApi = async (): Promise<ProfileInfo> => {
  const result = await requestApi<{
    id: number | string
    username: string
    nickname?: string
    email?: string
    phone?: string
  }>({
    url: '/users/profile',
    method: 'get'
  })
  return {
    id: String(result.id),
    username: result.username,
    nickname: result.nickname,
    email: result.email,
    phone: result.phone
  }
}

export const updateProfileApi = async (data: Partial<ProfileInfo>): Promise<void> => {
  await requestApi<void>({
    url: '/users/profile',
    method: 'put',
    data
  })
}

export const updatePasswordApi = async (data: ChangePasswordRequest): Promise<void> => {
  await requestApi<void>({
    url: '/users/password',
    method: 'put',
    data
  })
}

export const queryUserPage = async (params: UserManagementQuery): Promise<PageResult<ManagedUser>> => {
  return requestApi<PageResult<ManagedUser>>({
    url: '/users/page',
    method: 'get',
    params
  })
}

export const updateManagedUserApi = async (
  userId: IdValue,
  data: ManagedUserUpdateRequest
): Promise<void> => {
  await requestApi<void>({
    url: `/users/${userId}`,
    method: 'put',
    data
  })
}
