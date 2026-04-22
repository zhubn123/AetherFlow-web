import { defineStore } from 'pinia'
import { ref } from 'vue'
import { loginApi, type LoginRequest, type UserInfo } from '@/api/login'

export const useUserStore = defineStore('user', () => {
    const token = ref<string>('')
    const userInfo = ref<UserInfo | null>(null)
    const isLoggedIn = ref(false)

    const login = async (data: LoginRequest): Promise<void> => {
        const response = await loginApi(data)
        token.value = response.token
        userInfo.value = response.userInfo
        isLoggedIn.value = true
        localStorage.setItem('token', response.token)
    }

    const logout = () => {
        token.value = ''
        userInfo.value = null
        isLoggedIn.value = false
        localStorage.removeItem('token')
    }

    return {
        token,
        userInfo,
        isLoggedIn,
        login,
        logout
    }
})
