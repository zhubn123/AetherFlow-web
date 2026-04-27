<template>
  <div class="register-container">
    <div class="left-panel">
      <div class="brand-block">
        <h1>AetherFlow</h1>
        <p>创建你的账号，开始使用 WMS 管理平台。</p>
      </div>
    </div>

    <div class="right-panel">
      <div class="register-card">
        <h2>注册账号</h2>
        <p class="sub-title">填写基础信息，后续可在个人中心完善资料。</p>

        <el-form label-position="top" class="register-form" @submit.prevent>
          <el-form-item label="用户名">
            <el-input v-model.trim="form.username" placeholder="请输入用户名" />
          </el-form-item>

          <el-form-item label="邮箱（可选）">
            <el-input v-model.trim="form.email" placeholder="请输入邮箱" />
          </el-form-item>

          <el-form-item label="密码">
            <el-input v-model="form.password" type="password" show-password placeholder="请输入密码（至少 8 位，含字母+数字）" />
          </el-form-item>

          <el-form-item label="确认密码">
            <el-input v-model="confirmPassword" type="password" show-password placeholder="请再次输入密码" />
          </el-form-item>

          <el-alert v-if="errorMessage" :title="errorMessage" type="error" :closable="false" show-icon />

          <el-button type="primary" :loading="submitting" class="submit-btn" @click="submitRegister">
            注册
          </el-button>
        </el-form>

        <p class="footer-link">
          已有账号？
          <RouterLink to="/login">去登录</RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { ElMessage } from 'element-plus'
import { registerApi } from '@/api/user'

interface RegisterFormState {
  username: string
  email: string
  password: string
}

const router = useRouter()
const submitting = ref(false)
const errorMessage = ref('')
const confirmPassword = ref('')

const form = reactive<RegisterFormState>({
  username: '',
  email: '',
  password: ''
})

async function submitRegister(): Promise<void> {
  errorMessage.value = ''

  if (!form.username) {
    errorMessage.value = '请输入用户名'
    return
  }
  if (!form.password || form.password.length < 8) {
    errorMessage.value = '密码至少 8 位'
    return
  }
  const hasLetter = /[A-Za-z]/.test(form.password)
  const hasDigit = /\d/.test(form.password)
  if (!hasLetter || !hasDigit) {
    errorMessage.value = '密码必须包含字母和数字'
    return
  }
  if (confirmPassword.value !== form.password) {
    errorMessage.value = '两次输入的密码不一致'
    return
  }

  submitting.value = true
  try {
    const userId = await registerApi({
      username: form.username,
      password: form.password,
      email: form.email || undefined
    })
    ElMessage.success(`注册成功（用户ID：${userId}），请登录`)
    void router.push('/login')
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '注册失败'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.left-panel {
  display: grid;
  place-items: center;
  background: linear-gradient(145deg, #245de8 0%, #3f75ea 55%, #5f8ef2 100%);
  color: #fff;
  padding: 32px;
}

.brand-block {
  max-width: 420px;
}

.brand-block h1 {
  margin: 0;
  font-size: 46px;
}

.brand-block p {
  margin: 14px 0 0;
  font-size: 16px;
  opacity: 0.92;
}

.right-panel {
  display: grid;
  place-items: center;
  background: #f6f8fc;
  padding: 24px;
}

.register-card {
  width: 100%;
  max-width: 460px;
  border-radius: 14px;
  background: #fff;
  border: 1px solid #e2e8f3;
  box-shadow: 0 10px 28px rgba(18, 50, 110, 0.08);
  padding: 26px 24px;
}

.register-card h2 {
  margin: 0;
  font-size: 28px;
  color: #1c2f53;
}

.sub-title {
  margin: 8px 0 18px;
  color: #607296;
  font-size: 13px;
}

.register-form {
  display: grid;
  gap: 4px;
}

.submit-btn {
  width: 100%;
  margin-top: 6px;
}

.footer-link {
  margin: 16px 0 0;
  text-align: center;
  color: #617394;
  font-size: 13px;
}

.footer-link a {
  color: #2f6df6;
  text-decoration: none;
}

@media (max-width: 980px) {
  .register-container {
    grid-template-columns: 1fr;
  }

  .left-panel {
    display: none;
  }
}
</style>
