<template>
  <div class="user-profile-container">
    <div class="profile-content">
      <div class="profile-header glass-card">
        <div class="avatar-section">
          <el-avatar :size="120" :src="userProfile?.avatar || '/default-avatar.png'" class="user-avatar" />
          <div class="avatar-actions">
            <button class="custom-button" @click="handleAvatarUpload" :disabled="isUploading">
              <el-icon><Camera /></el-icon>
              {{ isUploading ? '上传中...' : '更换头像' }}
            </button>
            <button class="custom-button ai-button" @click="handleAIGenerate">
              <el-icon><MagicStick /></el-icon>
              头像生成
            </button>
            <input
                ref="fileInputRef"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif"
                @change="handleFileChange"
                style="display: none;"
            />
          </div>
        </div>
        <div class="basic-info">
          <h2 class="username">{{ userProfile?.username || '未知用户' }}</h2>
          <div class="user-tags">
            <el-tag :type="userProfile?.mainRoleId === 0 ? 'danger' : 'info'" effect="dark">
              {{ userProfile?.roleName || '普通用户' }}
            </el-tag>
            <el-tag :type="userProfile?.status === 0 ? 'success' : 'warning'" effect="dark">
              {{ userProfile?.statusDesc || '状态未知' }}
            </el-tag>
          </div>
          <p class="user-email">{{ userProfile?.email || '未设置邮箱' }}</p>
        </div>

        <div class="header-actions">
          <button class="custom-button delete-account-btn" @click="handleDeleteAccount">
            <el-icon><Warning /></el-icon>
            账号注销
          </button>
          <button class="custom-button favorites-btn" @click="handleGoToFavorites">
            <el-icon><Star /></el-icon>
            我的收藏
          </button>
        </div>
      </div>

      <div class="profile-details">
        <div class="detail-card glass-card">
          <div class="card-header">
            <h3>账户信息</h3>
            <div class="header-actions" v-if="!isEditing">
              <button class="custom-button" @click="handleEditProfile">
                <el-icon><Edit /></el-icon>
                编辑资料
              </button>
            </div>
            <div class="header-actions" v-if="isEditing">
              <button class="custom-button save-btn" @click="handleSaveProfile" :disabled="isSaving">
                <el-icon><Check /></el-icon>
                {{ isSaving ? '保存中...' : '保存' }}
              </button>
              <button class="custom-button cancel-btn" @click="handleCancelEdit" :disabled="isSaving">
                <el-icon><Close /></el-icon>
                取消
              </button>
            </div>
          </div>
          <div class="detail-content">
            <!-- 账户信息视图 -->
            <div class="info-grid">
              <div class="info-item">
                <label>用户ID</label>
                <span>{{ userProfile?.id || '-' }}</span>
              </div>
              <div class="info-item">
                <label>用户名</label>
                <span v-if="!isEditing">{{ userProfile?.username || '-' }}</span>
                <el-input v-else v-model="editForm.username" placeholder="请输入用户名" class="edit-input" />
              </div>
              <div class="info-item">
                <label>邮箱地址</label>
                <span v-if="!isEditing">{{ userProfile?.email || '-' }}</span>
                <el-input v-else v-model="editForm.email" placeholder="请输入邮箱地址" class="edit-input" />
              </div>
              <div class="info-item">
                <label>地理位置</label>
                <span v-if="!isEditing">{{ userProfile?.location || '未设置' }}</span>
                <LocationSelector v-else v-model="editForm.location" class="edit-input" />
              </div>
              <div class="info-item">
                <label>用户角色</label>
                <span>{{ userProfile?.roleName || '-' }}</span>
              </div>
              <div class="info-item">
                <label>账户状态</label>
                <span class="status-display">
                  <span 
                    class="status-indicator" 
                    :class="userProfile?.status === 0 ? 'status-normal' : 'status-abnormal'"
                  ></span>
                  <span 
                    class="status-text"
                    :class="userProfile?.status === 0 ? 'text-normal' : 'text-abnormal'"
                  >
                    {{ userProfile?.statusDesc || '-' }}
                  </span>
                </span>
              </div>
              <div class="info-item">
                <label>登录IP</label>
                <span>{{ userProfile?.loginIp || '-' }}</span>
              </div>
              <div class="info-item">
                <label>登录设备</label>
                <span class="device-info">{{ formatDevice(userProfile?.loginDevice) }}</span>
              </div>
              <div class="info-item">
                <label>注册时间</label>
                <span>{{ formatTime(userProfile?.registerTime) }}</span>
              </div>
              <div class="info-item">
                <label>最近登录</label>
                <span>{{ formatTime(userProfile?.lastLoginTime) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="security-card glass-card">
          <div class="card-header">
            <h3>安全设置</h3>
          </div>
          <div class="security-content">
            <div class="security-item">
              <div class="security-info">
                <div class="security-title">登录密码</div>
                <div class="security-desc">定期更换密码可以提高账户安全性</div>
              </div>
              <button class="custom-button" @click="handleChangePassword">
                修改密码
              </button>
            </div>
            <div class="security-item">
              <div class="security-info">
                <div class="security-title">邮箱验证</div>
                <div class="security-desc">验证邮箱可以帮助您找回密码</div>
              </div>
              <el-button type="success" plain @click="handleVerifyEmail">
                验证邮箱
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 密码重置弹窗组件 -->
    <PasswordResetDialog 
      v-model="showPasswordDialog"
      :email="userProfile?.email || ''"
      :email-disabled="true"
      title="修改密码"
    />

    <!-- AI生成头像弹窗组件 -->
    <AIAvatarDialog 
      v-model:visible="showAIDialog" 
      @avatar-updated="handleAvatarUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { ElMessage, ElLoading } from 'element-plus'
import { updateUserAvatar, updateUserProfile } from '../../api/user'
import {
  Camera,
  Edit,
  Check,
  Close,
  MagicStick,
  Warning,
  Star,
} from '@element-plus/icons-vue'
import AIAvatarDialog from './AIAvatarDialog.vue'
import PasswordResetDialog from '../../components/PasswordResetDialog.vue'
import LocationSelector from '../../components/LocationSelector.vue'

// 路由和认证
const router = useRouter()
const authStore = useAuthStore()

// 计算属性
const userProfile = computed(() => authStore.userProfile)

// 响应式数据
const fileInputRef = ref<HTMLInputElement>()
const isUploading = ref(false)
const isEditing = ref(false)
const isSaving = ref(false)

// 修改密码相关
const showPasswordDialog = ref(false)

// 账号注销
const handleDeleteAccount = () => {
  ElMessage.info('该功能尚未开发')
}

// AI生成头像相关
const showAIDialog = ref(false)

// 编辑表单数据
const editForm = reactive({
  username: '',
  email: '',
  location: ''
})

// 修改密码表单数据 - 移除，使用组件内部管理

// 方法
const handleAvatarUpload = () => {
  // 触发文件选择
  fileInputRef.value?.click()
}

const handleFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  // 验证文件类型
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
  if (!allowedTypes.includes(file.type)) {
    ElMessage.error('请选择有效的图片文件（JPG、PNG、GIF）')
    return
  }

  // 验证文件大小（限制为5MB）
  const maxSize = 5 * 1024 * 1024 // 5MB
  if (file.size > maxSize) {
    ElMessage.error('图片文件大小不能超过5MB')
    return
  }

  // 开始上传
  isUploading.value = true
  const loadingInstance = ElLoading.service({
    text: '正在上传头像...',
    background: 'rgba(0, 0, 0, 0.7)'
  })

  try {
    const response = await updateUserAvatar(file)

    if (response.success) {
      ElMessage.success('头像更新成功！')
      // 刷新用户信息
      await authStore.fetchUserProfile()
    } else {
      ElMessage.error(response.message || '头像更新失败')
    }
  } catch (error) {
    console.error('头像上传错误:', error)
    ElMessage.error('头像上传失败，请稍后重试')
  } finally {
    isUploading.value = false
    loadingInstance.close()
    // 清空文件输入
    if (target) target.value = ''
  }
}

const handleEditProfile = () => {
  // 进入编辑模式，初始化表单数据
  editForm.username = userProfile.value?.username || ''
  editForm.email = userProfile.value?.email || ''
  editForm.location = userProfile.value?.location || ''
  isEditing.value = true
}

const handleCancelEdit = () => {
  // 取消编辑，重置状态
  isEditing.value = false
  editForm.username = ''
  editForm.email = ''
  editForm.location = ''
}

const handleSaveProfile = async () => {
  // 验证表单数据
  if (!editForm.username.trim()) {
    ElMessage.error('用户名不能为空')
    return
  }

  if (!editForm.email.trim()) {
    ElMessage.error('邮箱不能为空')
    return
  }

  // 验证邮箱格式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(editForm.email)) {
    ElMessage.error('请输入有效的邮箱地址')
    return
  }

  // 检查是否有变更
  const hasChanges = editForm.username !== userProfile.value?.username ||
      editForm.email !== userProfile.value?.email ||
      editForm.location !== (userProfile.value?.location || '')

  if (!hasChanges) {
    ElMessage.info('没有检测到任何变更')
    isEditing.value = false
    return
  }

  // 开始保存
  isSaving.value = true
  const loadingInstance = ElLoading.service({
    text: '正在保存资料...',
    background: 'rgba(0, 0, 0, 0.7)'
  })

  try {
    // 调试信息：打印要发送的数据
    console.log('准备发送的用户资料数据:', {
      username: editForm.username,
      email: editForm.email,
      location: editForm.location
    })
    
    const response = await updateUserProfile({
      username: editForm.username,
      email: editForm.email,
      location: editForm.location
    })

    if (response.success) {
      ElMessage.success(response.message || '资料更新成功')
      // 刷新用户信息
      await authStore.fetchUserProfile()
      isEditing.value = false
    } else {
      ElMessage.error(response.message || '资料更新失败')
    }
  } catch (error) {
    console.error('资料更新错误:', error)
    ElMessage.error('资料更新失败，请稍后重试')
  } finally {
    isSaving.value = false
    loadingInstance.close()
  }
}

const handleChangePassword = () => {
  // 显示修改密码弹窗
  showPasswordDialog.value = true
}


const handleVerifyEmail = () => {
  ElMessage.info('邮箱验证功能开发中')
}

const formatTime = (timeStr: string | undefined): string => {
  if (!timeStr) return '-'
  try {
    const date = new Date(timeStr)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (error) {
    return '-'
  }
}

const formatDevice = (deviceStr: string | undefined): string => {
  if (!deviceStr) return '-'
  
  // 简化设备信息显示，提取主要浏览器信息
  try {
    if (deviceStr.includes('Chrome')) {
      const chromeMatch = deviceStr.match(/Chrome\/([0-9.]+)/)
      const version = chromeMatch ? chromeMatch[1] : ''
      if (deviceStr.includes('Edg')) {
        return `Microsoft Edge ${version ? `(${version})` : ''}`
      }
      return `Google Chrome ${version ? `(${version})` : ''}`
    } else if (deviceStr.includes('Firefox')) {
      const firefoxMatch = deviceStr.match(/Firefox\/([0-9.]+)/)
      const version = firefoxMatch ? firefoxMatch[1] : ''
      return `Mozilla Firefox ${version ? `(${version})` : ''}`
    } else if (deviceStr.includes('Safari') && !deviceStr.includes('Chrome')) {
      return 'Safari 浏览器'
    } else {
      return '其他浏览器'
    }
  } catch (error) {
    return deviceStr.length > 50 ? deviceStr.substring(0, 50) + '...' : deviceStr
  }
}

// AI生成头像相关方法
const handleAIGenerate = () => {
  showAIDialog.value = true
}

const handleAvatarUpdated = () => {
  // 头像更新后的回调，可以在这里执行其他操作
  console.log('头像已更新')
}

// 跳转到我的收藏页面
const handleGoToFavorites = () => {
  // 如果正在编辑状态，先取消编辑
  if (isEditing.value) {
    handleCancelEdit()
  }
  // 跳转到Dashboard并激活favorites菜单
  router.push('/dashboard?menu=favorites')
}


</script>

<style scoped>
/* 全局变量 */
:root {
  --dashboard-accent-orange: #FF6F61;
  --dashboard-accent-purple: #7D00FF;
  --dashboard-text-primary: #d28787;
  --dashboard-glass-bg: rgba(255, 255, 255, 0.1);
  --dashboard-glass-border: rgba(255, 255, 255, 0.2);
}

/* 自定义按钮基础样式 */
.custom-button {
  background: transparent;
  border: 1px solid var(--dashboard-glass-border);
  color: #8d948b;
  padding: 8px 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
}

.custom-button:hover {
  background: rgba(255, 255, 255, 0.1);
}

.custom-button:active {
  background: rgba(255, 255, 255, 0.15);
}

.custom-button .el-icon {
  font-size: 16px;
}

.custom-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: rgba(255, 255, 255, 0.05);
}

.custom-button:disabled:hover {
  transform: none;
  background: rgba(255, 255, 255, 0.05);
}

/* 账号注销按钮样式 */
.delete-account-btn {
  border-color: rgba(220, 53, 69, 0.4);
  color: #DC3545;
}

.delete-account-btn:hover {
  background: rgba(220, 53, 69, 0.3);
  border-color: rgba(220, 53, 69, 0.6);
}

/* AI生成按钮样式 */
.ai-button {
  background: transparent;
  border-color: transparent;
  color: #B8860B;
  font-weight: bold;
}

.ai-button:hover {
  background: transparent;
  border-color: transparent;
}

/* 收藏按钮样式 */
.favorites-btn {
  border-color: rgba(255, 193, 7, 0.4);
  color: #FFC107;
}

.favorites-btn:hover {
  background: rgba(255, 193, 7, 0.2);
  border-color: rgba(255, 193, 7, 0.6);
}

/* 编辑功能样式 */
.header-actions {
  display: flex;
  gap: 12px;
}

/* profile-header中的header-actions特殊样式 */
.profile-header .header-actions {
  position: absolute;
  bottom: 24px;
  right: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.save-btn {
  background: rgba(46, 160, 67, 0.2);
  border-color: rgba(46, 160, 67, 0.4);
  color: #67C23A;
}

.save-btn:hover {
  background: rgba(46, 160, 67, 0.3);
  border-color: rgba(46, 160, 67, 0.6);
}

.cancel-btn {
  background: rgba(245, 108, 108, 0.2);
  border-color: rgba(245, 108, 108, 0.4);
  color: #F56C6C;
}

.cancel-btn:hover {
  background: rgba(245, 108, 108, 0.3);
  border-color: rgba(245, 108, 108, 0.6);
}

.edit-input {
  --el-input-bg-color: rgba(255, 255, 255, 0.1);
  --el-input-border-color: rgba(255, 255, 255, 0.2);
  --el-input-hover-border-color: rgba(250, 231, 231, 0.4);
  --el-input-focus-border-color: var(--dashboard-accent-orange);
  --el-input-text-color: #000000;
  --el-input-placeholder-color: rgba(255, 255, 255, 0.5);
}

.edit-input .el-input__wrapper {
  background-color: var(--el-input-bg-color);
  border: 1px solid var(--el-input-border-color);
  border-radius: 8px;
  transition: all 0.3s ease;
}

.edit-input .el-input__wrapper:hover {
  border-color: var(--el-input-hover-border-color);
}

.edit-input .el-input__wrapper.is-focus {
  border-color: var(--el-input-focus-border-color);
  box-shadow: 0 0 0 2px rgba(255, 111, 97, 0.2);
}

.edit-input .el-input__inner {
  color: var(--el-input-text-color);
}

.edit-input .el-input__inner::placeholder {
  color: var(--el-input-placeholder-color);
}

/* 主容器 */
.user-profile-container {
  width: 100%;
  height: 100%;
  padding: 20px;
  box-sizing: border-box;
  font-family: 'Inter', 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
  display: flex;
  flex-direction: column;
}

.profile-content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 24px;
  overflow-y: auto;
}

/* 玻璃态卡片基础样式 */
.glass-card {
  background: var(--dashboard-glass-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--dashboard-glass-border);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.glass-card:hover {
  transform: translateY(0px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

/* 用户头像和基本信息 */
.profile-header {
  display: flex;
  align-items: center;
  gap: 32px;
  padding: 32px;
  position: relative;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.user-avatar {
  border: 4px solid var(--dashboard-glass-border);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.avatar-actions {
  display: flex;
  gap: 8px;
}

.basic-info {
  flex: 1;
}

.username {
  font-size: 32px;
  font-weight: 700;
  color: var(--dashboard-text-primary);
  margin: 0 0 16px 0;
}

.user-tags {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.user-email {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
}

/* 详细信息区域 */
.profile-details {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--dashboard-glass-border);
}

.card-header h3 {
  font-size: 20px;
  font-weight: 600;
  color: var(--dashboard-text-primary);
  margin: 0;
}

/* 信息网格 */
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-item label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 500;
}

.info-item span {
  font-size: 16px;
  color: var(--dashboard-text-primary);
  font-weight: 400;
}

.device-info {
  font-size: 14px !important;
  color: rgba(255, 255, 255, 0.8) !important;
  word-break: break-word;
  line-height: 1.4;
}

/* 安全设置 */
.security-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.security-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.security-info {
  flex: 1;
}

.security-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--dashboard-text-primary);
  margin-bottom: 4px;
}

.security-desc {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
}

/* 状态指示器样式 */
.status-display {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}

.status-indicator.status-normal {
  background-color: #67C23A; /* 绿色 - 正常状态 */
  box-shadow: 0 0 4px rgba(103, 194, 58, 0.4);
}

.status-indicator.status-abnormal {
  background-color: #909399; /* 灰色 - 异常状态 */
  box-shadow: 0 0 4px rgba(144, 147, 153, 0.4);
}

.status-text.text-normal {
  color: #67C23A; /* 绿色文字 */
}

.status-text.text-abnormal {
  color: #909399; /* 灰色文字 */
}
.notice-text h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
}

.notice-text p {
  margin: 0;
  font-size: 14px;
  opacity: 0.8;
}

/* 媒体查询 */
@media (max-width: 1200px) {
  .profile-details {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .user-profile-container {
    padding: 16px;
  }
  
  .profile-header {
    flex-direction: column;
    text-align: center;
    padding: 24px;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .security-item {
    flex-direction: column;
    gap: 12px;
    text-align: center;
  }
}
</style>