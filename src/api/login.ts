import { requestApi } from '@/utils/request'

export interface LoginRequest {
    username: string
    password: string
}

export interface UserInfo {
    id: string
    username: string
    nickname?: string
    email?: string
    phone?: string
}

export interface LoginResponse {
    token: string
    userInfo: UserInfo
    roles: string[]
}

export const loginApi = async (data: LoginRequest): Promise<LoginResponse> => {
    const result = await requestApi<{
        token: string
        userInfo: {
            id: number | string
            username: string
            nickname?: string
            email?: string
            phone?: string
        }
        roles?: string[]
    }>({
        url: '/auth/login',
        method: 'post',
        data
    })

    return {
        token: result.token,
        userInfo: {
            id: String(result.userInfo.id),
            username: result.userInfo.username,
            nickname: result.userInfo.nickname,
            email: result.userInfo.email,
            phone: result.userInfo.phone
        },
        roles: result.roles || []
    }
}

export const logoutApi = async (): Promise<void> => {
    await requestApi<void>({
        url: '/auth/logout',
        method: 'post'
    })
}
