import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { loginApi, logoutApi, type LoginRequest, type UserInfo } from '@/api/login'

export const useUserStore = defineStore('user', () => {
    const token = ref<string>(localStorage.getItem('token') || '')
    const refreshToken = ref<string>(localStorage.getItem('refresh_token') || '')
    const userInfo = ref<UserInfo | null>(readLocalUserInfo())
    const roles = ref<string[]>(readLocalRoles())
    const isLoggedIn = computed(() => !!token.value)

    const login = async (data: LoginRequest): Promise<void> => {
        const response = await loginApi(data)
        token.value = response.token
        refreshToken.value = response.refreshToken || ''
        userInfo.value = response.userInfo
        roles.value = response.roles
        localStorage.setItem('token', response.token)
        if (response.refreshToken) {
            localStorage.setItem('refresh_token', response.refreshToken)
        } else {
            localStorage.removeItem('refresh_token')
        }
        localStorage.setItem('user_info', JSON.stringify(response.userInfo))
        localStorage.setItem('roles', JSON.stringify(response.roles))
    }

    const logout = async (): Promise<void> => {
        try {
            await logoutApi()
        } catch {
            // 后端登出失败时也执行本地退出，避免登录态卡死。
        }
        clearLocalState()
    }

    const forceLogout = (): void => {
        clearLocalState()
    }

    function clearLocalState(): void {
        token.value = ''
        refreshToken.value = ''
        userInfo.value = null
        roles.value = []
        localStorage.removeItem('token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user_info')
        localStorage.removeItem('roles')
    }

    function setUserInfo(info: UserInfo): void {
        userInfo.value = info
        localStorage.setItem('user_info', JSON.stringify(info))
    }

    function hasRole(roleKey: string): boolean {
        return roles.value.includes(roleKey)
    }

    return {
        token,
        refreshToken,
        userInfo,
        roles,
        isLoggedIn,
        login,
        logout,
        forceLogout,
        setUserInfo,
        hasRole
    }
})

function readLocalUserInfo(): UserInfo | null {
    const raw = localStorage.getItem('user_info')
    if (!raw) {
        return null
    }
    try {
        return JSON.parse(raw) as UserInfo
    } catch {
        localStorage.removeItem('user_info')
        return null
    }
}

function readLocalRoles(): string[] {
    const raw = localStorage.getItem('roles')
    if (!raw) {
        return []
    }
    try {
        const parsed = JSON.parse(raw) as unknown
        if (!Array.isArray(parsed)) {
            return []
        }
        return parsed.filter((item): item is string => typeof item === 'string')
    } catch {
        localStorage.removeItem('roles')
        return []
    }
}
