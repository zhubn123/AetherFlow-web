import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

export const constantRoutes = [
    {
        path: '/',
        redirect: '/login'
    },
    {
        path: '/login',
        component: () => import('@/views/login.vue'),
        meta: { requiresGuest: true }
    },
    {
        path: '/dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { requiresAuth: true }
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes: constantRoutes,
    scrollBehavior(_to, _from, savedPosition) {
        if (savedPosition) {
            return savedPosition
        } else {
            return { top: 0 }
        }
    }
})

router.beforeEach((to, from) => {
    const userStore = useUserStore()
    
    if (to.meta.requiresAuth && !userStore.isLoggedIn) {
        return '/login'
    } else if (to.meta.requiresGuest && userStore.isLoggedIn) {
        return '/dashboard'
    }
    return true
})

export default router