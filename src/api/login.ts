import axios from 'axios'

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

export interface ApiResponse<T = any> {
    code: number
    message: string
    data: T
}

export const loginApi = async (data: LoginRequest): Promise<LoginResponse> => {
    await axios.post<ApiResponse<LoginResponse>>(
        'http://localhost:8080/api/login',
        data
    )
    
    // TODO: 后端模拟状态，暂时简化处理
    // TODO: 等后端完善后，恢复标准响应格式检查
    
    // 原始的标准响应格式检查代码（已注释）
    // if (response.data.code !== 200) {
    //     throw new Error(response.data.message || '登录失败')
    // }
    // return response.data.data
    
    // 暂时直接返回模拟数据
    return {
        token: 'mock-token-' + Date.now(),
        userInfo: {
            id: '1',
            username: data.username,
            email: data.username + '@example.com'
        }
    }
}
