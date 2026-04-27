<template>
  <div class="profile-page">
    <header class="profile-header">
      <div>
        <h1>个人信息</h1>
        <p>维护当前账号的基础资料，后续可扩展更多安全设置。</p>
      </div>
      <el-button @click="goBack">返回首页</el-button>
    </header>

    <el-card class="profile-card" shadow="never" v-loading="loading">
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
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getProfileApi, updateProfileApi, type ProfileInfo } from '@/api/user'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)
const saving = ref(false)

const form = reactive<ProfileInfo>({
  id: '',
  username: '',
  email: '',
  nickname: '',
  phone: ''
})

function applyLocalUserFallback(): void {
  const local = userStore.userInfo
  if (!local) {
    return
  }
  form.id = local.id || ''
  form.username = local.username || ''
  form.email = local.email || ''
}

async function loadProfile(): Promise<void> {
  loading.value = true
  try {
    // TODO(接口预留): 当前优先走后端 /users/profile，未实现时回退本地登录态信息
    const result = await getProfileApi()
    form.id = result.id || ''
    form.username = result.username || ''
    form.email = result.email || ''
    form.nickname = result.nickname || ''
    form.phone = result.phone || ''
  } catch {
    applyLocalUserFallback()
    ElMessage.warning('个人信息接口未就绪，已展示本地登录信息')
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
    // TODO(接口预留): /users/profile 更新接口完成后，这里可直接提交并返回最新资料
    await updateProfileApi({
      username: form.username,
      email: form.email,
      nickname: form.nickname,
      phone: form.phone
    })
    userStore.userInfo = {
      id: form.id,
      username: form.username,
      email: form.email || ''
    }
    ElMessage.success('保存成功')
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '保存失败')
  } finally {
    saving.value = false
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

@media (max-width: 900px) {
  .profile-page {
    padding: 12px;
  }

  .profile-header {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
