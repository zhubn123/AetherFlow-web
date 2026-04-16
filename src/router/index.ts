import { createRouter, createWebHistory } from "vue-router";

export const constantRoutes = [
    {
        path: '/',
        redirect: '/login',
    },
    {
        path: '/login',
        component: () => import('@/views/login.vue'),
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

export default router