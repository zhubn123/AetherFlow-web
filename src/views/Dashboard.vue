<template>
    <div class="dashboard-container">
        <div class="dashboard-header">
            <h1>欢迎回来，{{ userStore.userInfo?.username }}！</h1>
            <button @click="handleLogout" class="logout-button">退出登录</button>
        </div>
        <div class="dashboard-content">
            <div class="card">
                <h2>仪表盘</h2>
                <p>这是 AetherFlow 的主页面</p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'

const userStore = useUserStore()
const router = useRouter()

const handleLogout = () => {
    userStore.logout()
    router.push('/login')
}
</script>

<style scoped>
.dashboard-container {
    min-height: 100vh;
    background: #f8fafc;
    padding: 2rem;
}

.dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    padding: 1.5rem 2rem;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.dashboard-header h1 {
    margin: 0;
    font-size: 1.75rem;
    color: #1e293b;
}

.logout-button {
    padding: 0.625rem 1.25rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
}

.logout-button:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.dashboard-content {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
}

.card {
    background: white;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card h2 {
    margin: 0 0 0.5rem 0;
    font-size: 1.25rem;
    color: #1e293b;
}

.card p {
    margin: 0;
    color: #64748b;
}
</style>