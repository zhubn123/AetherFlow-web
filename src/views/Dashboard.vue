<template>
    <div class="home-v1">
        <header class="topbar">
            <div>
                <p class="brand">AetherFlow WMS</p>
                <h1>欢迎回来，{{ displayName }}</h1>
                <p class="subline">今天是 {{ currentDateText }}，先从一个模块开始推进就很好。</p>
            </div>
            <button @click="handleLogout" class="logout-button">退出登录</button>
        </header>

        <WmsNav />

        <section class="hero panel stagger-1">
            <div class="hero-copy">
                <h2>首页 V1</h2>
                <p>这一版聚焦“业务入口清晰、状态一眼可见、下一步有方向”。</p>
            </div>
            <div class="hero-kpis">
                <div class="kpi-item">
                    <p>阶段目标</p>
                    <strong>主链路打通</strong>
                </div>
                <div class="kpi-item">
                    <p>当前范围</p>
                    <strong>WMS 核心模块</strong>
                </div>
                <div class="kpi-item">
                    <p>完成节奏</p>
                    <strong>每日可演示</strong>
                </div>
            </div>
        </section>

        <section class="panel stagger-2">
            <div class="panel-title">
                <h3>业务模块入口</h3>
                <span>Phase 1</span>
            </div>
            <div class="module-grid">
                <article v-for="module in modules" :key="module.key" class="module-card">
                    <div class="module-icon" :style="{ background: module.iconBg }">{{ module.icon }}</div>
                    <h4>{{ module.title }}</h4>
                    <p>{{ module.desc }}</p>
                    <div class="module-foot">
                        <span class="status-chip">{{ module.status }}</span>
                        <RouterLink v-if="module.path" :to="module.path" class="todo-link">进入模块</RouterLink>
                        <span v-else class="todo-text">页面建设中</span>
                    </div>
                </article>
            </div>
        </section>

        <section class="bottom-grid stagger-3">
            <article class="panel">
                <div class="panel-title">
                    <h3>最近动作</h3>
                    <span>本地开发</span>
                </div>
                <ul class="activity-list">
                    <li>已完成入库、出库主流程同构</li>
                    <li>已统一前端 ResultCode 错误处理</li>
                    <li>已补齐库位、物料、库存接口骨架</li>
                </ul>
            </article>

            <article class="panel">
                <div class="panel-title">
                    <h3>系统状态</h3>
                    <span>V1</span>
                </div>
                <ul class="state-list">
                    <li><b>前端：</b>Vue 3 + Vite</li>
                    <li><b>后端：</b>Spring Boot + MyBatis-Plus</li>
                    <li><b>接口前缀：</b>/api</li>
                    <li><b>当前页面：</b>Dashboard Home V1</li>
                </ul>
            </article>
        </section>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'
import WmsNav from '@/components/WmsNav.vue'

interface ModuleCard {
    key: string
    icon: string
    iconBg: string
    title: string
    desc: string
    status: string
    path?: string
}

const userStore = useUserStore()
const router = useRouter()

const modules: ModuleCard[] = [
    { key: 'warehouse', icon: '仓', iconBg: 'linear-gradient(135deg,#fed7aa,#fdba74)', title: '仓库管理', desc: '维护仓库主数据与状态。', status: '可推进', path: '/wms/warehouses' },
    { key: 'location', icon: '位', iconBg: 'linear-gradient(135deg,#bfdbfe,#93c5fd)', title: '库位管理', desc: '定义仓库内部储位结构。', status: '可推进', path: '/wms/locations' },
    { key: 'material', icon: '料', iconBg: 'linear-gradient(135deg,#c7d2fe,#a5b4fc)', title: '物料管理', desc: '统一物料编码与基础属性。', status: '可推进', path: '/wms/materials' },
    { key: 'inbound', icon: '入', iconBg: 'linear-gradient(135deg,#bbf7d0,#86efac)', title: '入库管理', desc: '草稿、确认与库存入账流程。', status: '可推进', path: '/wms/inbound-orders' },
    { key: 'outbound', icon: '出', iconBg: 'linear-gradient(135deg,#fecaca,#fca5a5)', title: '出库管理', desc: '草稿、确认与库存扣减流程。', status: '可推进', path: '/wms/outbound-orders' },
    { key: 'stock', icon: '存', iconBg: 'linear-gradient(135deg,#f5d0fe,#e9d5ff)', title: '库存查询', desc: '按维度查看实时库存状态。', status: '可推进', path: '/wms/stocks' }
]

const displayName = computed(() => userStore.userInfo?.username || '同学')
const currentDateText = computed(() => {
    const now = new Date()
    return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }).format(now)
})

const handleLogout = () => {
    userStore.logout()
    router.push('/login')
}
</script>

<style scoped>
.home-v1 {
    min-height: 100vh;
    padding: 28px;
    background:
        radial-gradient(circle at 18% 10%, rgba(255, 214, 170, 0.4), transparent 34%),
        radial-gradient(circle at 82% 24%, rgba(191, 219, 254, 0.5), transparent 36%),
        linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%);
    color: #0f172a;
}

.topbar {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: flex-start;
    margin-bottom: 20px;
    animation: rise-in 0.55s ease both;
}

.brand {
    margin: 0 0 6px;
    font-size: 13px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #475569;
}

.topbar h1 {
    margin: 0;
    font-size: 34px;
    line-height: 1.2;
    letter-spacing: -0.02em;
}

.subline {
    margin: 8px 0 0;
    color: #475569;
    font-size: 15px;
}

.logout-button {
    border: 0;
    cursor: pointer;
    border-radius: 10px;
    padding: 10px 14px;
    font-size: 14px;
    color: #fff;
    background: linear-gradient(135deg, #1d4ed8 0%, #4338ca 100%);
    box-shadow: 0 10px 20px rgba(37, 99, 235, 0.24);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.logout-button:hover {
    transform: translateY(-1px);
    box-shadow: 0 14px 26px rgba(37, 99, 235, 0.3);
}

.panel {
    background: rgba(255, 255, 255, 0.75);
    backdrop-filter: blur(6px);
    border: 1px solid rgba(148, 163, 184, 0.3);
    border-radius: 16px;
    padding: 18px;
    box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
}

.hero {
    display: grid;
    grid-template-columns: 1.4fr 1fr;
    gap: 16px;
    margin-bottom: 16px;
}

.hero h2 {
    margin: 0 0 8px;
    font-size: 22px;
}

.hero p {
    margin: 0;
    color: #475569;
}

.hero-kpis {
    display: grid;
    gap: 10px;
}

.kpi-item {
    background: #f8fafc;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    padding: 10px 12px;
}

.kpi-item p {
    margin: 0;
    color: #64748b;
    font-size: 12px;
}

.kpi-item strong {
    display: block;
    margin-top: 6px;
    font-size: 14px;
}

.panel-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
}

.panel-title h3 {
    margin: 0;
    font-size: 18px;
}

.panel-title span {
    font-size: 12px;
    color: #64748b;
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
    border-radius: 999px;
    padding: 4px 10px;
}

.module-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
}

.module-card {
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    background: #fff;
    padding: 12px;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.module-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.09);
}

.module-icon {
    width: 32px;
    height: 32px;
    border-radius: 9px;
    display: grid;
    place-items: center;
    font-size: 14px;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 10px;
}

.module-card h4 {
    margin: 0;
    font-size: 15px;
}

.module-card p {
    margin: 8px 0 10px;
    font-size: 13px;
    color: #64748b;
    min-height: 36px;
}

.module-foot {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
}

.status-chip {
    font-size: 12px;
    border-radius: 999px;
    padding: 3px 8px;
    border: 1px solid #bbf7d0;
    color: #166534;
    background: #f0fdf4;
}

.todo-text {
    font-size: 12px;
    color: #64748b;
}

.todo-link {
    font-size: 12px;
    color: #1d4ed8;
    text-decoration: none;
}

.bottom-grid {
    margin-top: 16px;
    display: grid;
    gap: 16px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
}

.activity-list,
.state-list {
    margin: 0;
    padding-left: 18px;
    display: grid;
    gap: 8px;
    color: #475569;
    font-size: 14px;
}

.stagger-1 {
    animation: rise-in 0.6s ease 0.08s both;
}

.stagger-2 {
    animation: rise-in 0.6s ease 0.16s both;
}

.stagger-3 {
    animation: rise-in 0.6s ease 0.24s both;
}

@keyframes rise-in {
    from {
        transform: translateY(12px);
        opacity: 0;
    }
    to {
        transform: translateY(0);
        opacity: 1;
    }
}

@media (max-width: 1024px) {
    .home-v1 {
        padding: 18px;
    }

    .hero {
        grid-template-columns: 1fr;
    }

    .module-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .bottom-grid {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 640px) {
    .topbar {
        flex-direction: column;
        align-items: stretch;
    }

    .topbar h1 {
        font-size: 28px;
    }

    .module-grid {
        grid-template-columns: 1fr;
    }
}
</style>
