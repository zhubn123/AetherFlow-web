import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

export const constantRoutes = [
    {
        path: '/',
        redirect: '/dashboard'
    },
    {
        path: '/login',
        component: () => import('@/views/login.vue'),
        meta: { requiresGuest: true }
    },
    {
        path: '/register',
        component: () => import('@/views/register.vue'),
        meta: { requiresGuest: true }
    },
    {
        path: '/',
        component: () => import('@/layouts/AppLayout.vue'),
        meta: { requiresAuth: true },
        children: [
            {
                path: 'dashboard',
                component: () => import('@/views/Dashboard.vue')
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
                path: 'wms/stocks',
                component: () => import('@/views/wms/InventoryView.vue')
            },
            {
                path: 'profile',
                component: () => import('@/views/ProfileView.vue')
            }
        ]
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
