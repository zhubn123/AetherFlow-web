import { requestApi } from '@/utils/request'

export interface LoginRequest {
    username: string
    password: string
}

export interface UserInfo {
    id: string
    username: string
    email: string
}

export interface LoginResponse {
    token: string
    userInfo: UserInfo
}

export const loginApi = async (data: LoginRequest): Promise<LoginResponse> => {
    const token = await requestApi<string>({
        url: '/login',
        method: 'post',
        data
    })
    return {
        token,
        // TODO 后端登录目前返回的是 token 字符串，所以前端 userInfo 还是用当前最小映射（用户名回填），等后端补用户详情接口后再切成真实用户信息
        userInfo: {
            id: '1',
            username: data.username,
            email: data.username + '@example.com'
        }
    }
}
