<template>
  <div class="profile-page">
    <header class="profile-header">
      <div>
        <h1>个人信息</h1>
        <p>维护个人资料与登录密码，所有操作会记录审计日志。</p>
      </div>
      <el-button @click="goBack">返回首页</el-button>
    </header>

    <section class="profile-grid">
      <el-card class="profile-card" shadow="never" v-loading="loading">
        <template #header>
          <span>基础资料</span>
        </template>

        <el-form label-width="110px" class="profile-form">
          <el-form-item label="用户 ID">
            <el-input v-model="form.id" disabled />
          </el-form-item>
          <el-form-item label="用户名">
            <el-input v-model.trim="form.username" placeholder="请输入用户名" />
          </el-form-item>
          <el-form-item label="昵称">
            <el-input v-model.trim="form.nickname" placeholder="请输入昵称" />
          </el-form-item>
          <el-form-item label="邮箱">
            <el-input v-model.trim="form.email" placeholder="请输入邮箱" />
          </el-form-item>
          <el-form-item label="手机号">
            <el-input v-model.trim="form.phone" placeholder="请输入手机号" />
          </el-form-item>
        </el-form>

        <template #footer>
          <div class="actions">
            <el-button type="primary" :loading="saving" @click="submitProfile">保存修改</el-button>
            <el-button :disabled="saving" @click="loadProfile">刷新</el-button>
          </div>
        </template>
      </el-card>

      <el-card class="profile-card" shadow="never">
        <template #header>
          <span>修改密码</span>
        </template>

        <el-form label-width="110px" class="profile-form">
          <el-form-item label="旧密码">
            <el-input
              v-model="passwordForm.oldPassword"
              type="password"
              show-password
              placeholder="请输入旧密码"
            />
          </el-form-item>
          <el-form-item label="新密码">
            <el-input
              v-model="passwordForm.newPassword"
              type="password"
              show-password
              placeholder="至少 8 位，且包含字母和数字"
            />
          </el-form-item>
          <el-form-item label="确认新密码">
            <el-input
              v-model="passwordForm.confirmPassword"
              type="password"
              show-password
              placeholder="请再次输入新密码"
            />
          </el-form-item>
        </el-form>

        <template #footer>
          <div class="actions">
            <el-button type="primary" :loading="passwordSaving" @click="submitPassword">更新密码</el-button>
          </div>
        </template>
      </el-card>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getProfileApi, updatePasswordApi, updateProfileApi, type ProfileInfo } from '@/api/user'
import { useUserStore } from '@/stores/user'

interface PasswordFormState {
  oldPassword: string
  newPassword: string
  confirmPassword: string
}

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)
const saving = ref(false)
const passwordSaving = ref(false)

const form = reactive<ProfileInfo>({
  id: '',
  username: '',
  email: '',
  nickname: '',
  phone: ''
})

const passwordForm = reactive<PasswordFormState>({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

async function loadProfile(): Promise<void> {
  loading.value = true
  try {
    const result = await getProfileApi()
    form.id = result.id || ''
    form.username = result.username || ''
    form.email = result.email || ''
    form.nickname = result.nickname || ''
    form.phone = result.phone || ''
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '加载个人信息失败')
  } finally {
    loading.value = false
  }
}

async function submitProfile(): Promise<void> {
  if (!form.username) {
    ElMessage.warning('用户名不能为空')
    return
  }

  saving.value = true
  try {
    await updateProfileApi({
      username: form.username,
      email: form.email,
      nickname: form.nickname,
      phone: form.phone
    })
    userStore.setUserInfo({
      id: form.id,
      username: form.username,
      nickname: form.nickname,
      email: form.email,
      phone: form.phone
    })
    ElMessage.success('资料已更新')
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '保存失败')
  } finally {
    saving.value = false
  }
}

async function submitPassword(): Promise<void> {
  if (!passwordForm.oldPassword) {
    ElMessage.warning('请输入旧密码')
    return
  }
  if (!passwordForm.newPassword) {
    ElMessage.warning('请输入新密码')
    return
  }
  if (passwordForm.newPassword.length < 8) {
    ElMessage.warning('新密码至少 8 位')
    return
  }
  const hasLetter = /[A-Za-z]/.test(passwordForm.newPassword)
  const hasDigit = /\d/.test(passwordForm.newPassword)
  if (!hasLetter || !hasDigit) {
    ElMessage.warning('新密码必须包含字母和数字')
    return
  }
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    ElMessage.warning('两次输入的新密码不一致')
    return
  }

  passwordSaving.value = true
  try {
    await updatePasswordApi({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword
    })
    passwordForm.oldPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
    ElMessage.success('密码已更新，请重新登录')
    await userStore.logout()
    void router.push('/login')
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '更新密码失败')
  } finally {
    passwordSaving.value = false
  }
}

function goBack(): void {
  void router.push('/dashboard')
}

onMounted(() => {
  void loadProfile()
})
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  padding: 16px;
}

.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

.profile-header h1 {
  margin: 0;
  font-size: 24px;
  color: var(--af-ink);
}

.profile-header p {
  margin: 6px 0 0;
  color: var(--af-text-2);
  font-size: 13px;
}

.profile-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.profile-card {
  border-radius: 14px;
  border: 1px solid var(--af-border);
  box-shadow: var(--af-shadow);
}

.profile-form {
  max-width: 620px;
}

.actions {
  display: flex;
  gap: 8px;
}

@media (max-width: 980px) {
  .profile-page {
    padding: 12px;
  }

  .profile-header {
    flex-direction: column;
    align-items: stretch;
  }

  .profile-grid {
    grid-template-columns: 1fr;
  }
}
</style>
