<template>
    <div class="login-container">
        <div class="left-panel">
            <div class="brand-section">
                <div class="brand-logo">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                    </svg>
                </div>
                <h1 class="brand-title">AetherFlow</h1>
                <p class="brand-description">现代化的工作流管理平台，提升团队协作效率</p>
            </div>
            <div class="features">
                <div class="feature-item">
                    <div class="feature-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                        </svg>
                    </div>
                    <div class="feature-text">
                        <h3>高效协作</h3>
                        <p>实时同步，团队无缝协作</p>
                    </div>
                </div>
                <div class="feature-item">
                    <div class="feature-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        </svg>
                    </div>
                    <div class="feature-text">
                        <h3>安全可靠</h3>
                        <p>企业级安全保障</p>
                    </div>
                </div>
                <div class="feature-item">
                    <div class="feature-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                        </svg>
                    </div>
                    <div class="feature-text">
                        <h3>灵活配置</h3>
                        <p>自定义工作流程</p>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="right-panel">
            <div class="login-wrapper">
                <div class="login-header">
                    <h2>欢迎回来</h2>
                    <p>请登录您的账户继续使用</p>
                </div>
                
                <form @submit.prevent="login" class="login-form">
                    <div class="form-group">
                        <label for="username">用户名</label>
                        <input
                            type="text"
                            id="username"
                            v-model="username"
                            placeholder="请输入用户名"
                            class="form-input"
                        />
                    </div>
                    
                    <div class="form-group">
                        <label for="password">密码</label>
                        <input
                            type="password"
                            id="password"
                            v-model="password"
                            placeholder="请输入密码"
                            class="form-input"
                        />
                    </div>
                    
                    <div class="form-options">
                        <label class="checkbox-label">
                            <input type="checkbox" v-model="rememberMe" />
                            <span>记住我</span>
                        </label>
                        <a href="#" class="forgot-password">忘记密码？</a>
                    </div>
                    
                    <div v-if="errorMessage" class="error-message">
                        <svg class="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="12" y1="8" x2="12" y2="12"/>
                            <line x1="12" y1="16" x2="12" y2="16"/>
                        </svg>
                        {{ errorMessage }}
                    </div>
                    
                    <button type="submit" class="login-button" :disabled="loading">
                        <span v-if="!loading">登录</span>
                        <span v-else class="loading-text">
                            <svg class="spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10" stroke-dasharray="60" stroke-dashoffset="20"/>
                            </svg>
                            登录中...
                        </span>
                    </button>
                </form>
                
                <!-- TODO -->
                <div class="login-footer">
                    <p>还没有账户？<a href="#">立即注册</a></p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const username = ref('')
const password = ref('')
const rememberMe = ref(false)
const loading = ref(false)
const errorMessage = ref('')

onMounted(() => {
    const savedUsername = localStorage.getItem('username')
    if (savedUsername) {
        username.value = savedUsername
        rememberMe.value = true
    }
})

const login = async () => {
    errorMessage.value = ''
    
    if (!username.value) {
        errorMessage.value = '请输入用户名'
        return
    }
    
    if (!password.value) {
        errorMessage.value = '请输入密码'
        return
    }
    
    loading.value = true
    
    const success = await userStore.login({
        username: username.value,
        password: password.value
    })
    
    if (success) {
        if (rememberMe.value) {
            localStorage.setItem('username', username.value)
        } else {
            localStorage.removeItem('username')
        }
        
        router.push('/dashboard')
    } else {
        errorMessage.value = '登录失败，请检查用户名和密码'
    }
    
    loading.value = false
}
</script>

<style scoped>
.login-container {
    min-height: 100vh;
    display: flex;
}

.left-panel {
    flex: 1;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 4rem;
    color: white;
    position: relative;
    overflow: hidden;
}

.left-panel::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/></svg>');
    background-size: 400px;
    animation: rotate 60s linear infinite;
}

@keyframes rotate {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}

.brand-section {
    position: relative;
    z-index: 1;
    margin-bottom: 4rem;
}

.brand-logo {
    width: 80px;
    height: 80px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 2rem;
    backdrop-filter: blur(10px);
}

.brand-logo svg {
    width: 40px;
    height: 40px;
}

.brand-title {
    font-size: 3rem;
    font-weight: 700;
    margin: 0 0 1rem 0;
    letter-spacing: -0.02em;
}

.brand-description {
    font-size: 1.1rem;
    opacity: 0.9;
    margin: 0;
    line-height: 1.6;
}

.features {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

.feature-item {
    display: flex;
    align-items: center;
    gap: 1.5rem;
}

.feature-icon {
    width: 56px;
    height: 56px;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(10px);
}

.feature-icon svg {
    width: 28px;
    height: 28px;
}

.feature-text h3 {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0 0 0.25rem 0;
}

.feature-text p {
    font-size: 0.95rem;
    opacity: 0.85;
    margin: 0;
}

.right-panel {
    flex: 1;
    background: #f8fafc;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4rem;
}

.login-wrapper {
    width: 100%;
    max-width: 480px;
}

.login-header {
    margin-bottom: 3rem;
}

.login-header h2 {
    font-size: 2rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 0.5rem 0;
}

.login-header p {
    color: #64748b;
    font-size: 1rem;
    margin: 0;
}

.login-form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.form-group label {
    font-size: 0.9rem;
    font-weight: 500;
    color: #374151;
}

.form-input {
    padding: 0.875rem 1rem;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    font-size: 1rem;
    transition: all 0.2s ease;
    background: white;
}

.form-input:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-input::placeholder {
    color: #94a3b8;
}

.form-options {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    font-size: 0.9rem;
    color: #64748b;
    user-select: none;
}

.checkbox-label input[type="checkbox"] {
    cursor: pointer;
    width: 16px;
    height: 16px;
    accent-color: #667eea;
}

.forgot-password {
    font-size: 0.9rem;
    color: #667eea;
    text-decoration: none;
    font-weight: 500;
    transition: color 0.2s;
}

.forgot-password:hover {
    color: #764ba2;
}

.error-message {
    padding: 0.875rem 1rem;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 8px;
    color: #dc2626;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.error-icon {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
}

.login-button {
    padding: 0.875rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.login-button:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.login-button:active:not(:disabled) {
    transform: translateY(0);
}

.login-button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
}

.loading-text {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
}

.spinner {
    width: 16px;
    height: 16px;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}

.login-footer {
    margin-top: 2rem;
    text-align: center;
    padding-top: 2rem;
    border-top: 1px solid #e2e8f0;
}

.login-footer p {
    color: #64748b;
    font-size: 0.9rem;
    margin: 0;
}

.login-footer a {
    color: #667eea;
    text-decoration: none;
    font-weight: 500;
    transition: color 0.2s;
}

.login-footer a:hover {
    color: #764ba2;
}

@media (max-width: 1024px) {
    .left-panel {
        display: none;
    }
    
    .right-panel {
        padding: 2rem;
    }
}
</style>