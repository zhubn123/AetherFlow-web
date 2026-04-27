import { requestApi } from '@/utils/request'

export interface RegisterRequest {
  username: string
  password: string
  email?: string
}

export interface ProfileInfo {
  id: string
  username: string
  email?: string
  nickname?: string
  phone?: string
}

// TODO(接口预留): 后端实现注册接口后，按约定返回创建结果或用户信息
export const registerApi = async (data: RegisterRequest): Promise<void> => {
  await requestApi<void>({
    url: '/auth/register',
    method: 'post',
    data
  })
}

// TODO(接口预留): 后端补用户中心接口后，返回真实个人资料
export const getProfileApi = async (): Promise<ProfileInfo> => {
  return requestApi<ProfileInfo>({
    url: '/users/profile',
    method: 'get'
  })
}

// TODO(接口预留): 后端补用户资料更新接口后，按字段更新资料
export const updateProfileApi = async (data: Partial<ProfileInfo>): Promise<void> => {
  await requestApi<void>({
    url: '/users/profile',
    method: 'put',
    data
  })
}
