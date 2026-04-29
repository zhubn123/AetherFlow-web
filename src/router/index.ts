import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

export const constantRoutes = [
    {
        path: '/',
        redirect: '/login'
    },
    {
        path: '/login',
        component: () => import('@/views/auth/LoginView.vue'),
        meta: { requiresGuest: true }
    },
    {
        path: '/register',
        component: () => import('@/views/auth/RegisterView.vue'),
        meta: { requiresGuest: true }
    },
    {
        path: '/404',
        component: () => import('@/views/system/NotFoundView.vue')
    },
    {
        path: '/',
        component: () => import('@/layouts/AppLayout.vue'),
        meta: { requiresAuth: true },
        children: [
            {
                path: 'dashboard',
                component: () => import('@/views/dashboard/DashboardView.vue')
            },
            {
                path: '403',
                component: () => import('@/views/system/ForbiddenView.vue')
            },
            {
                path: 'system/users',
                component: () => import('@/views/system/UserManagementView.vue'),
                meta: { roles: ['admin'] }
            },
            {
                path: 'system/roles',
                component: () => import('@/views/system/RoleManagementView.vue'),
                meta: { roles: ['admin'] }
            },
            {
                path: 'wms/warehouses',
                component: () => import('@/views/wms/WarehouseView.vue')
            },
            {
                path: 'wms/locations',
                component: () => import('@/views/wms/LocationView.vue')
            },
            {
                path: 'wms/areas',
                component: () => import('@/views/wms/AreaView.vue')
            },
            {
                path: 'wms/materials',
                component: () => import('@/views/wms/MaterialView.vue')
            },
            {
                path: 'wms/inbound-orders',
                component: () => import('@/views/wms/InboundOrderView.vue')
            },
            {
                path: 'wms/outbound-orders',
                component: () => import('@/views/wms/OutboundOrderView.vue')
            },
            {
                path: 'wms/inventory-adjustments',
                component: () => import('@/views/wms/InventoryAdjustmentView.vue')
            },
            {
                path: 'wms/stocks',
                component: () => import('@/views/wms/InventoryView.vue')
            },
            {
                path: 'profile',
                component: () => import('@/views/profile/ProfileView.vue')
            }
        ]
    },
    {
        path: '/:pathMatch(.*)*',
        redirect: (to) => ({
            path: '/404',
            query: {
                path: to.fullPath
            }
        })
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

function hasLocalAccessToken(): boolean {
    return !!localStorage.getItem('token')
}

router.beforeEach((to) => {
    const userStore = useUserStore()
    const hasAccessToken = hasLocalAccessToken()

    if (!hasAccessToken && userStore.token) {
        userStore.forceLogout()
    }

    if (to.meta.requiresAuth && (!userStore.isLoggedIn || !hasAccessToken)) {
        return {
            path: '/login',
            query: {
                reason: 'auth-required',
                redirect: to.fullPath
            }
        }
    } else if (Array.isArray(to.meta.roles) && to.meta.roles.length > 0) {
        const allowed = to.meta.roles.some((roleKey) => userStore.hasRole(String(roleKey)))
        if (!allowed) {
            return {
                path: '/403',
                query: {
                    reason: 'forbidden',
                    redirect: to.fullPath,
                    message: '当前账号没有访问该页面的权限'
                }
            }
        }
    } else if (to.meta.requiresGuest && userStore.isLoggedIn && hasAccessToken) {
        return '/dashboard'
    }
    return true
})

export default router
