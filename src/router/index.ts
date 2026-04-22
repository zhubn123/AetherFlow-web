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
    },
    {
        path: '/wms/warehouses',
        component: () => import('@/views/wms/WarehouseView.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/wms/locations',
        component: () => import('@/views/wms/LocationView.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/wms/materials',
        component: () => import('@/views/wms/MaterialView.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/wms/inbound-orders',
        component: () => import('@/views/wms/InboundOrderView.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/wms/outbound-orders',
        component: () => import('@/views/wms/OutboundOrderView.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/wms/stocks',
        component: () => import('@/views/wms/InventoryView.vue'),
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

router.beforeEach((to) => {
    const userStore = useUserStore()
    
    if (to.meta.requiresAuth && !userStore.isLoggedIn) {
        return '/login'
    } else if (to.meta.requiresGuest && userStore.isLoggedIn) {
        return '/dashboard'
    }
    return true
})

export default router
