import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig
} from 'axios'
import { ElMessage } from 'element-plus'
import { ResultCode } from '@/constants/result-code'

export interface ApiResult<T = unknown> {
  code: number
  message: string
  data: T
}

interface AuthRequestConfig extends AxiosRequestConfig {
  _retry?: boolean
  skipAuthRefresh?: boolean
}

type AuthInternalRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean
  skipAuthRefresh?: boolean
}

interface RefreshTokenPayload {
  token?: string
  accessToken?: string
  refreshToken?: string
  userInfo?: unknown
  roles?: string[]
}

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'
const timeout = 10000

const request = axios.create({
  baseURL,
  timeout
})

const refreshRequest = axios.create({
  baseURL,
  timeout
})

let isRedirectingToLogin = false
let refreshPromise: Promise<string | null> | null = null

function clearAuthState(): void {
  localStorage.removeItem('token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('user_info')
  localStorage.removeItem('roles')
}

function getAccessToken(): string {
  return localStorage.getItem('token') || ''
}

function getRefreshToken(): string {
  return localStorage.getItem('refresh_token') || ''
}

function isPublicAuthRequest(config?: AxiosRequestConfig): boolean {
  const url = config?.url || ''
  return (
    url.includes('/auth/login') ||
    url.includes('/auth/register') ||
    url.includes('/auth/logout') ||
    url.includes('/auth/refresh')
  )
}

function setAuthorizationHeader(config: AuthInternalRequestConfig | AuthRequestConfig, token: string): void {
  if (!config.headers) {
    config.headers = {}
  }
  if (typeof config.headers.set === 'function') {
    config.headers.set('Authorization', `Bearer ${token}`)
  } else {
    config.headers.Authorization = `Bearer ${token}`
  }
}

function redirectToLogin(): void {
  if (isRedirectingToLogin) {
    return
  }

  isRedirectingToLogin = true
  clearAuthState()

  const currentPath = window.location.pathname
  if (currentPath === '/login') {
    isRedirectingToLogin = false
    return
  }

  ElMessage.warning('登录状态已失效，请重新登录')
  const params = new URLSearchParams({
    reason: 'session-expired',
    redirect: `${window.location.pathname}${window.location.search}`
  })
  window.location.replace(`/login?${params.toString()}`)
}

function isUnauthorizedCase(code?: number, message?: string): boolean {
  if (code === ResultCode.UNAUTHORIZED) {
    return true
  }
  if (!message) {
    return false
  }
  const text = message.toLowerCase()
  return (
    text.includes('认证失败') ||
    text.includes('未登录') ||
    text.includes('登录过期') ||
    text.includes('token 无效') ||
    text.includes('token无效') ||
    (text.includes('token') && text.includes('invalid')) ||
    (text.includes('token') && text.includes('expired'))
  )
}

function saveRefreshedAuthState(payload: RefreshTokenPayload): string | null {
  const nextToken = payload.token || payload.accessToken
  if (!nextToken) {
    return null
  }

  localStorage.setItem('token', nextToken)
  if (payload.refreshToken) {
    localStorage.setItem('refresh_token', payload.refreshToken)
  }
  if (payload.userInfo) {
    localStorage.setItem('user_info', JSON.stringify(payload.userInfo))
  }
  if (payload.roles) {
    localStorage.setItem('roles', JSON.stringify(payload.roles))
  }
  return nextToken
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) {
    return null
  }

  if (!refreshPromise) {
    refreshPromise = refreshRequest
      .post<ApiResult<RefreshTokenPayload>>('/auth/refresh', { refreshToken })
      .then((response) => {
        const result = response.data
        if (result.code !== ResultCode.SUCCESS) {
          return null
        }
        return saveRefreshedAuthState(result.data)
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

async function retryAfterRefresh<T>(
  config: AuthInternalRequestConfig,
  message = '登录状态已失效，请重新登录'
): Promise<AxiosResponse<T>> {
  if (config._retry || config.skipAuthRefresh || isPublicAuthRequest(config)) {
    throw new Error(message)
  }

  config._retry = true
  const nextToken = await refreshAccessToken()
  if (!nextToken) {
    redirectToLogin()
    throw new Error(message)
  }

  setAuthorizationHeader(config, nextToken)
  return request.request<T>(config)
}

request.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    setAuthorizationHeader(config, token)
  }
  return config
})

request.interceptors.response.use(
  async (response) => {
    const result = response.data as Partial<ApiResult> | undefined
    if (isUnauthorizedCase(result?.code, result?.message)) {
      return retryAfterRefresh(response.config as AuthInternalRequestConfig, result?.message)
    }
    return response
  },
  async (error: AxiosError<ApiResult>) => {
    const status = error.response?.status
    const message = error.response?.data?.message || error.message || '网络请求失败'
    if (isUnauthorizedCase(status, message) && error.config) {
      return retryAfterRefresh(error.config as AuthInternalRequestConfig, message)
    }
    throw new Error(message)
  }
)

export async function requestApi<T>(config: AuthRequestConfig): Promise<T> {
  const response = await request.request<ApiResult<T>>(config)
  const result = response.data

  if (result.code !== ResultCode.SUCCESS) {
    if (isUnauthorizedCase(result.code, result.message) && !isPublicAuthRequest(config)) {
      redirectToLogin()
    }
    throw new Error(result.message || '请求失败')
  }

  return result.data
}

export default request
