<template>
  <el-dialog
    v-model="visible"
    title="重置密码"
    width="500px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    class="password-dialog"
    @close="handleClose"
  >
    <div class="password-form-content">
      <div class="form-row">
        <label class="form-label">邮箱地址</label>
        <el-input
          v-model="passwordForm.email"
          placeholder="请输入邮箱地址"
          :disabled="emailDisabled"
          class="form-input"
        />
      </div>

      <div class="form-row">
        <label class="form-label">邮箱验证码</label>
        <div class="verification-row">
          <el-input
            v-model="passwordForm.verificationCode"
            placeholder="请输入验证码"
            class="form-input verification-input"
          />
          <button
            class="send-code-btn"
            :disabled="isSendingCode || countdown > 0"
            @click="handleSendCode"
          >
            {{ isSendingCode ? '发送中...' : countdown > 0 ? `${countdown}s` : '获取验证码' }}
          </button>
        </div>
      </div>

      <div class="form-row">
        <label class="form-label">图形验证码</label>
        <div class="hutool-captcha-container">
          <div class="captcha-inline-row">
            <el-input
              v-model="hutoolCaptchaCode"
              placeholder="请输入右侧验证码"
              class="form-input captcha-input"
              maxlength="10"
              show-word-limit
            />
            <div 
              class="captcha-image-wrapper" 
              v-loading="isLoadingHutoolCaptcha" 
              element-loading-text="加载中..."
              @click="refreshHutoolCaptcha"
              :class="{ clickable: !isLoadingHutoolCaptcha }"
              title="点击刷新验证码"
            >
              <img 
                v-if="hutoolCaptchaData.imageBase64 && !hutoolCaptchaError"
                :src="hutoolCaptchaData.imageBase64" 
                alt="验证码" 
                class="captcha-image"
              />
              <div v-else-if="hutoolCaptchaError" class="captcha-error">
                <span class="error-text">{{ hutoolCaptchaError }}</span>
                <button type="button" class="retry-btn" @click.stop="refreshHutoolCaptcha">重试</button>
              </div>
              <div v-else class="captcha-loading">
                <span>加载中...</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="form-row">
        <label class="form-label">新密码</label>
        <el-input
          v-model="passwordForm.newPassword"
          type="password"
          placeholder="请输入新密码（至少6位）"
          show-password
          class="form-input"
        />
      </div>

      <div class="form-row">
        <label class="form-label">确认密码</label>
        <el-input
          v-model="passwordForm.confirmPassword"
          type="password"
          placeholder="请再次输入新密码"
          show-password
          class="form-input"
        />
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel" :disabled="isChangingPassword">
          取消
        </el-button>
        <el-button
          type="primary"
          @click="handleSubmitPasswordChange"
          :loading="isChangingPassword"
        >
          {{ isChangingPassword ? '重置中...' : '确认重置' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, ElDialog, ElInput, ElButton, ElLoading } from 'element-plus'
import { sendEmailCode, verifyEmailCode } from '../views/login/login-code'
import { resetPassword } from '../api/user'
import { getRandomCaptchaType, generateHutoolCaptcha, validateHutoolCaptcha } from '../api/hutool-captcha'

// Props
interface Props {
  modelValue: boolean
  email?: string
  emailDisabled?: boolean
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  email: '',
  emailDisabled: false,
  title: '重置密码'
})

// Emits
interface Emits {
  'update:modelValue': [value: boolean]
  'success': []
  'cancel': []
}

const emit = defineEmits<Emits>()

// 响应式数据
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const isChangingPassword = ref(false)
const isSendingCode = ref(false)
const countdown = ref(0)
const countdownTimer = ref<NodeJS.Timeout | null>(null)

// Hutool验证码相关
const hutoolCaptchaData = reactive({
  captchaId: '',
  imageBase64: '',
  captchaType: '',
  width: 0,
  height: 0
})
const hutoolCaptchaCode = ref('')
const isLoadingHutoolCaptcha = ref(false)
const hutoolCaptchaError = ref('')

// 修改密码表单数据
const passwordForm = reactive({
  email: '',
  verificationCode: '',
  newPassword: '',
  confirmPassword: ''
})

// 监听 props.email 变化，同步到表单
watch(() => props.email, (newEmail) => {
  passwordForm.email = newEmail || ''
}, { immediate: true })

// 监听弹窗显示状态
watch(visible, (newVal) => {
  if (newVal) {
    // 弹窗打开时初始化表单和加载验证码
    resetForm()
    passwordForm.email = props.email || ''
    loadHutoolCaptcha()
  } else {
    // 弹窗关闭时清理倒计时
    clearCountdown()
  }
})

// 重置表单
const resetForm = () => {
  passwordForm.verificationCode = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
  hutoolCaptchaCode.value = ''
  hutoolCaptchaError.value = ''
}

// 清理倒计时
const clearCountdown = () => {
  if (countdownTimer.value) {
    clearInterval(countdownTimer.value)
    countdownTimer.value = null
    countdown.value = 0
  }
}

// 发送验证码
const handleSendCode = async () => {
  if (!passwordForm.email) {
    ElMessage.error('邮箱地址不能为空')
    return
  }

  // 验证邮箱格式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(passwordForm.email)) {
    ElMessage.error('请输入有效的邮箱地址')
    return
  }

  isSendingCode.value = true

  try {
    const result = await sendEmailCode(passwordForm.email)

    if (result.success) {
      ElMessage.success('验证码已发送到您的邮箱')
      startCountdown()
    } else {
      ElMessage.error(result.error || '验证码发送失败')
    }
  } catch (error) {
    console.error('发送验证码错误:', error)
    ElMessage.error('验证码发送失败，请稍后重试')
  } finally {
    isSendingCode.value = false
  }
}

// 开始倒计时
const startCountdown = () => {
  countdown.value = 60
  countdownTimer.value = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearCountdown()
    }
  }, 1000)
}

// 加载Hutool验证码
const loadHutoolCaptcha = async () => {
  isLoadingHutoolCaptcha.value = true
  hutoolCaptchaError.value = ''
  hutoolCaptchaCode.value = ''
  
  try {
    // 获取随机验证码类型
    const randomType = await getRandomCaptchaType()
    const captchaType = randomType ? randomType.type : undefined
    
    // 生成验证码
    const result = await generateHutoolCaptcha(captchaType)
    
    if (result.success && result.data) {
      hutoolCaptchaData.captchaId = result.data.captchaId
      hutoolCaptchaData.imageBase64 = result.data.imageBase64
      hutoolCaptchaData.captchaType = result.data.captchaType
      hutoolCaptchaData.width = result.data.width
      hutoolCaptchaData.height = result.data.height
    } else {
      hutoolCaptchaError.value = result.error || '获取验证码失败'
    }
  } catch (error) {
    console.error('加载Hutool验证码失败:', error)
    hutoolCaptchaError.value = '获取验证码失败，请重试'
  } finally {
    isLoadingHutoolCaptcha.value = false
  }
}

// 刷新Hutool验证码
const refreshHutoolCaptcha = () => {
  loadHutoolCaptcha()
}

// 提交修改密码
const handleSubmitPasswordChange = async () => {
  // 表单验证
  if (!passwordForm.email) {
    ElMessage.error('邮箱地址不能为空')
    return
  }

  if (!passwordForm.verificationCode) {
    ElMessage.error('验证码不能为空')
    return
  }

  if (!hutoolCaptchaCode.value) {
    ElMessage.error('请输入人机验证码')
    return
  }

  if (!passwordForm.newPassword) {
    ElMessage.error('新密码不能为空')
    return
  }

  if (passwordForm.newPassword.length < 6) {
    ElMessage.error('密码长度不能少于6位')
    return
  }

  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    ElMessage.error('两次输入的密码不一致')
    return
  }

  isChangingPassword.value = true
  const loadingInstance = ElLoading.service({
    text: '正在重置密码...',
    background: 'rgba(0, 0, 0, 0.7)'
  })

  try {
    // 先验证Hutool验证码
    const hutoolResult = await validateHutoolCaptcha(hutoolCaptchaData.captchaId, hutoolCaptchaCode.value)
    
    if (!hutoolResult.success) {
      ElMessage.error(hutoolResult.error || '人机验证失败')
      // 验证失败后刷新验证码
      refreshHutoolCaptcha()
      return
    }

    // 验证邮箱验证码
    const verifyResult = await verifyEmailCode(passwordForm.email, passwordForm.verificationCode)

    if (!verifyResult.success) {
      ElMessage.error(verifyResult.error || '验证码验证失败')
      return
    }

    // 验证码正确，重置密码
    const resetResult = await resetPassword(passwordForm.email, passwordForm.newPassword)

    if (resetResult.success) {
      ElMessage.success('密码重置成功！')
      emit('success')
      visible.value = false
    } else {
      ElMessage.error(resetResult.message || '密码重置失败')
    }
  } catch (error) {
    console.error('重置密码错误:', error)
    ElMessage.error('密码重置失败，请稍后重试')
  } finally {
    isChangingPassword.value = false
    loadingInstance.close()
  }
}

// 取消操作
const handleCancel = () => {
  emit('cancel')
  visible.value = false
}

// 弹窗关闭处理
const handleClose = () => {
  resetForm()
  clearCountdown()
}

// 暴露给父组件的方法
defineExpose({
  resetForm,
  clearCountdown
})


</script>

<style scoped>
/* 弹窗容器 */
.password-dialog {
  --el-dialog-bg-color: #1e1e1e;
  --el-dialog-border-color: rgba(255, 255, 255, 0.2);
  --el-dialog-title-color: #fff;
  --el-dialog-header-padding: 24px;
  --el-dialog-footer-padding: 24px;
  --el-dialog-padding: 24px;

  /* 自定义属性，用于样式 */
  --form-label-color: #fff;
  --input-bg-color: #2a2a2a;
  --input-border-color: #3b3b3b;
  --input-text-color: #e0e0e0;
  --input-placeholder-color: #888;
  --send-code-bg: #4a90e2;
  --send-code-hover: #3a7bd5;
  --send-code-disabled-bg: #555;
  --send-code-disabled-color: #999;
}

/* 弹窗内容区 */
.password-dialog .el-dialog__header {
  padding: var(--el-dialog-header-padding);
  border-bottom: 1px solid var(--el-dialog-border-color);
  background-color: var(--el-dialog-bg-color);
}

.password-dialog .el-dialog__title {
  color: var(--el-dialog-title-color);
  font-size: 18px;
}

.password-dialog .el-dialog__body {
  padding: var(--el-dialog-padding);
  background-color: var(--el-dialog-bg-color);
}

.password-dialog .el-dialog__footer {
  padding: var(--el-dialog-footer-padding);
  border-top: 1px solid var(--el-dialog-border-color);
  background-color: var(--el-dialog-bg-color);
}

/* 密码表单 */
.password-form-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 14px;
  color: var(--form-label-color);
  font-weight: 500;
}

/* 输入框 */
.form-input {
  --el-input-bg-color: var(--input-bg-color);
  --el-input-border-color: var(--input-border-color);
  --el-input-text-color: var(--input-text-color);
  --el-input-placeholder-color: var(--input-placeholder-color);
}

.form-input.is-disabled .el-input__wrapper {
  background-color: #222;
  box-shadow: none;
}

/* 验证码行 */
.verification-row {
  display: flex;
  gap: 12px;
}

.verification-input {
  flex-grow: 1;
}

/* 验证码按钮 */
.send-code-btn {
  padding: 0 16px;
  background-color: #444;
  color: #fff;
  border: 1px solid #555;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 120px;
  height: 40px;
  font-size: 14px;
  white-space: nowrap;
}

.send-code-btn:hover:not(:disabled) {
  background-color: #555;
}

.send-code-btn:disabled {
  background-color: #333;
  color: #777;
  border-color: #444;
  cursor: not-allowed;
}

/* 底部按钮 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.el-button--primary {
  background: linear-gradient(to right, #121212, #636b6b);
  border: none;
  color: white;
}

/* Hutool验证码样式 */
.hutool-captcha-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 验证码内联行样式 */
.captcha-inline-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.captcha-image-wrapper {
  position: relative;
  height: 32px; /* 与Element Plus输入框高度一致 */
  width: auto; /* 根据内容自适应宽度 */
  min-width: 80px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  border-radius: 8px;
  border: 1px solid #ddd;
  overflow: hidden;
  transition: all 0.2s ease;
  padding: 2px;
}

.captcha-image-wrapper.clickable {
  cursor: pointer;
}

.captcha-image-wrapper.clickable:hover {
  background-color: #e8e8e8;
  border-color: #ccc;

}

.captcha-image {
  width: 100%;            /* 宽度占满容器 */
  height: 100%;           /* 高度占满容器 */
  border-radius: 4px;
  object-fit: fill;       /* 填充整个容器，可能会拉伸 */
  display: block;
}

.captcha-input {
  flex: 1;
  min-width: 0;
}

.captcha-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 4px;
  color: #f56c6c;
  font-size: 12px;
  text-align: center;
}

.error-text {
  font-size: 12px;
  line-height: 1.2;
}

.retry-btn {
  padding: 2px 8px;
  background: #f56c6c;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 10px;
  transition: all 0.2s ease;
}

.retry-btn:hover {
  background: #f78989;
}

.captcha-loading {
  padding: 8px 4px;
  color: #909399;
  font-size: 12px;
  text-align: center;
  line-height: 1.2;
}

/* 媒体查询 */
@media (max-width: 768px) {
  .password-dialog {
    width: 90% !important;
  }

  .verification-row {
    flex-direction: column;
    gap: 8px;
  }

  .verification-input {
    width: 100%;
  }

  .send-code-btn {
    width: 100%;
  }
  
  .hutool-captcha-container {
    gap: 8px;
  }
  
  .captcha-inline-row {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  
  .captcha-image-wrapper {
    height: 32px;           /* 与输入框高度一致 */
    width: 100%;
    min-width: auto;
    order: 2; /* 在移动端将验证码放在输入框下方 */
  }
  
  .captcha-input {
    width: 100%;
    order: 1;
  }
}
</style>