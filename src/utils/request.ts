import axios, { type AxiosRequestConfig } from 'axios'
import { ResultCode } from '@/constants/result-code'

export interface ApiResult<T = unknown> {
  code: number
  message: string
  data: T
}

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000
})

request.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    if (typeof config.headers.set === 'function') {
      config.headers.set('Authorization', `Bearer ${token}`)
    } else {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

request.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error?.response?.data?.message || error?.message || '网络请求失败'
    return Promise.reject(new Error(message))
  }
)

export async function requestApi<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await request.request<ApiResult<T>>(config)
  const result = response.data

  if (result.code !== ResultCode.SUCCESS) {
    throw new Error(result.message || '请求失败')
  }

  return result.data
}

export default request
