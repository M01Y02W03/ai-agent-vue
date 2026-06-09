<template>
  <div class="captcha-verification">
    <el-dialog
        v-model="visible"
        title="请完成安全验证"
        width="420px"
        :close-on-click-modal="false"
        :close-on-press-escape="false"
        :show-close="false"
        center
        class="captcha-dialog"
    >
      <transition name="fade-content" mode="out-in">
        <div v-if="captchaState === 'analyzing'" key="analyzing" class="analysis-container">
          <div class="analysis-icon-wrapper">
            <img src="/安全验证.svg" alt="安全验证" class="analysis-icon custom-svg-icon" />
            <div class="scan-line"></div>
          </div>
          <el-text size="large" tag="b" class="analysis-text">
            智能校验中...
          </el-text>
        </div>

        <div v-else key="captcha" class="captcha-body">
          <div class="captcha-header">
            <div class="captcha-instruction">
              <el-text size="large" tag="b">
                {{ captchaData.instruction || '请点击下图中的' }}
              </el-text>
            </div>
            <el-button
                link
                type="primary"
                @click="refreshCaptcha"
                :disabled="loading || verifying"
                class="refresh-button"
            >
              <el-icon><RefreshRight /></el-icon>
              <span>换一张</span>
            </el-button>
          </div>

          <div class="captcha-image-area" v-loading="loading" element-loading-text="加载中...">
            <div v-if="captchaData.bgImage" class="image-wrapper">
              <img
                  :src="`data:image/png;base64,${captchaData.bgImage}`"
                  alt="CAPTCHA"
                  class="captcha-image"
                  @click="handleImageClick"
                  @load="onImageLoad"
                  ref="captchaImageRef"
              />
              <div
                  v-if="clickPosition.x !== null"
                  class="click-marker"
                  :style="{ left: clickPosition.x + 'px', top: clickPosition.y + 'px' }"
              >
                <div class="marker-icon">
                  <el-icon color="#ffffff" size="16"><Select /></el-icon>
                </div>
              </div>
            </div>
            <div v-else class="no-image-placeholder">
              <el-text type="info">验证码加载失败</el-text>
            </div>
          </div>

          <div class="captcha-footer">
            <transition name="fade">
              <div v-if="errorMessage" class="error-message">
                <el-icon><WarningFilled /></el-icon>
                <span>{{ errorMessage }}</span>
              </div>
            </transition>
          </div>
        </div>
      </transition>

      <template #footer>
        <div v-if="captchaState === 'ready'" class="dialog-footer">
          <el-button @click="handleCancel" :disabled="verifying" class="cancel-btn">取消</el-button>
          <el-button
              type="primary"
              @click="handleVerify"
              :disabled="!canVerify || verifying"
              :loading="verifying"
              class="verify-btn"
          >
            {{ verifying ? '验证中...' : '确认验证' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick } from 'vue'
import { ElDialog, ElButton, ElText, ElIcon } from 'element-plus'
// Import new Shield icon for the animation
import { RefreshRight, Select, WarningFilled } from '@element-plus/icons-vue'
import { generateCaptcha, validateCaptcha } from './captcha'

// Props
interface Props {
  modelValue: boolean
}
const props = withDefaults(defineProps<Props>(), {
  modelValue: false
})

// Emits
interface Emits {
  'update:modelValue': [value: boolean]
  'success': []
  'cancel':[]
}
const emit = defineEmits<Emits>()

// Component's internal state
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// --- NEW State for managing content view ---
const captchaState = ref<'analyzing' | 'ready'>('analyzing')

const loading = ref(false)
const verifying = ref(false)
const errorMessage = ref('')
const captchaImageRef = ref<HTMLImageElement>()

const captchaData = reactive({
  captchaId: '',
  bgImage: '',
  instruction: ''
})

const clickPosition = reactive({
  x: null as number | null,
  y: null as number | null
})

const canVerify = computed(() => {
  return captchaData.captchaId &&
      clickPosition.x !== null &&
      clickPosition.y !== null &&
      !loading.value
})

watch(visible, (newVal) => {
  if (newVal) {
    // --- MODIFIED: Start the analysis and loading process ---
    startAnalysisAndLoadCaptcha()
  } else {
    // Dialog closes, reset everything for the next open
    resetCaptcha()
    // --- NEW: Reset the state to 'analyzing'
    captchaState.value = 'analyzing'
  }
})

// --- NEW Function to orchestrate the animation and API call ---
const startAnalysisAndLoadCaptcha = async () => {
  // 1. Set the initial state to show the animation
  captchaState.value = 'analyzing';
  resetCaptcha(); // Ensure old data is cleared

  // 2. Create two promises: one for the API call, one for a minimum animation delay
  const loadCaptchaPromise = loadCaptcha();
  const minDelayPromise = new Promise(resolve => setTimeout(resolve, 1500)); // Min 1.5s animation

  try {
    // 3. Wait for both the API call AND the timer to complete
    await Promise.all([loadCaptchaPromise, minDelayPromise]);
  } catch(error) {
    // Error during loading is handled inside loadCaptcha,
    // but we catch here to prevent unhandled promise rejection.
    console.error("Analysis & Loading phase failed:", error);
  } finally {
    // 4. Once both are done, switch to the CAPTCHA view
    captchaState.value = 'ready';
  }
}

const loadCaptcha = async () => {
  loading.value = true
  errorMessage.value = ''
  resetClickPosition()

  try {
    const result = await generateCaptcha()
    if (result.success && result.data) {
      captchaData.captchaId = result.data.captchaId
      captchaData.bgImage = result.data.bgImage
      captchaData.instruction = result.data.instruction
    } else {
      errorMessage.value = result.error || '获取验证码失败'
    }
  } catch (error) {
    console.error('加载验证码失败:', error)
    errorMessage.value = '获取验证码失败，请重试'
    // Re-throw the error to be caught by Promise.all if needed
    throw error;
  } finally {
    loading.value = false
  }
}

const refreshCaptcha = () => {
  // When user manually refreshes, we just load new data without the animation
  captchaState.value = 'ready';
  loadCaptcha()
}

const resetCaptcha = () => {
  captchaData.captchaId = ''
  captchaData.bgImage = ''
  captchaData.instruction = ''
  resetClickPosition()
  errorMessage.value = ''
}

const resetClickPosition = () => {
  clickPosition.x = null
  clickPosition.y = null
}

const onImageLoad = () => {
  resetClickPosition()
}

const handleImageClick = (event: MouseEvent) => {
  if (loading.value || verifying.value) return

  const img = event.target as HTMLImageElement
  const rect = img.getBoundingClientRect()
  const x = Math.round(event.clientX - rect.left)
  const y = Math.round(event.clientY - rect.top)

  if (x >= 0 && x <= img.width && y >= 0 && y <= img.height) {
    clickPosition.x = x
    clickPosition.y = y
    errorMessage.value = ''
  }
}

const handleVerify = async () => {
  if (!canVerify.value) return

  verifying.value = true
  errorMessage.value = ''

  try {
    const result = await validateCaptcha(
        captchaData.captchaId,
        clickPosition.x!,
        clickPosition.y!
    )
    if (result.success) {
      emit('success')
      visible.value = false
    } else {
      errorMessage.value = result.error || '验证失败，请重试'
      await nextTick()
      refreshCaptcha()
    }
  } catch (error) {
    console.error('验证失败:', error)
    errorMessage.value = '验证失败，请重试'
    refreshCaptcha()
  } finally {
    verifying.value = false
  }
}

const handleCancel = () => {
  emit('cancel')
  visible.value = false
}

defineExpose({
  loadCaptcha,
  refreshCaptcha
})
</script>

<style scoped>
/* --- NEW: Analysis Animation Styles --- */
.analysis-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  /* Match the aspect ratio of the captcha image area to prevent layout shifts */
  aspect-ratio: 3 / 2;
  user-select: none;
  padding: 2rem;
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
  border-radius: 12px;
  border: 1px solid rgba(64, 158, 255, 0.1);
  position: relative;
  overflow: hidden;
}

.analysis-container::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(45deg, transparent, rgba(64, 158, 255, 0.03), transparent);
  animation: shimmer-analysis 3s infinite;
}

@keyframes shimmer-analysis {
  0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
  100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
}

.analysis-icon-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #409eff;
  overflow: hidden; /* Important for the scan line */
  width: 100px;
  height: 100px;
  background: radial-gradient(circle, rgba(64, 158, 255, 0.1) 0%, transparent 70%);
  border-radius: 50%;
  animation: icon-glow 2s ease-in-out infinite;
}

@keyframes icon-glow {
  0%, 100% {
    box-shadow: 0 0 20px rgba(64, 158, 255, 0.3);
    transform: scale(1);
  }
  50% {
    box-shadow: 0 0 30px rgba(64, 158, 255, 0.5);
    transform: scale(1.05);
  }
}

.analysis-icon {
  z-index: 1;
  animation: icon-pulse 2s ease-in-out infinite;
}

.custom-svg-icon {
  width: 60px;
  height: 60px;
  filter: drop-shadow(0 0 10px rgba(64, 158, 255, 0.3));
}

@keyframes icon-pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

.scan-line {
  position: absolute;
  left: 0;
  width: 100%;
  height: 3px;
  background: linear-gradient(90deg, transparent, rgba(64, 158, 255, 0.8), transparent);
  box-shadow: 0 0 10px rgba(64, 158, 255, 0.7);
  z-index: 2;
  animation: scan-animation 2s infinite cubic-bezier(0.4, 0.0, 0.2, 1);
}

@keyframes scan-animation {
  0% {
    top: 0%;
  }
  50% {
    top: 100%;
  }
  100% {
    top: 0%;
  }
}

.analysis-text {
  color: #606266;
  text-align: center;
  position: relative;
  z-index: 1;
  animation: text-breathe 2.5s infinite ease-in-out;
}

.analysis-text b {
  background: linear-gradient(45deg, #409eff, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 600;
}

@keyframes text-breathe {
  0%, 100% {
    opacity: 1;
    transform: translateY(0);
  }
  50% {
    opacity: 0.8;
    transform: translateY(-2px);
  }
}

/* --- Original Styles (Unchanged) --- */
.captcha-body {
  display: flex;
  flex-direction: column;
  gap: 15px;
  user-select: none;
}

.captcha-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.refresh-button {
  align-items: center;
  gap: 4px;
  background: none !important;
  border: none !important;
  box-shadow: none !important;
}

.captcha-image-area {
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 2;
  border-radius: 8px;
  background-color: #f7f9fc;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

.captcha-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  cursor: crosshair;
  display: block;
}

.no-image-placeholder {
  color: #909399;
}

.click-marker {
  position: absolute;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background-color: rgba(64, 158, 255, 0.9);
  box-shadow: 0 0 0 4px rgba(64, 158, 255, 0.3);
  transform: translate(-50%, -50%);
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: marker-pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.marker-icon {
  animation: icon-fade-in 0.3s ease-out;
}

@keyframes marker-pop {
  from {
    transform: translate(-50%, -50%) scale(0.5);
    opacity: 0;
  }
  to {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
}

@keyframes icon-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.captcha-footer {
  height: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 6px;
  background-color: #fef0f0;
  color: #f56c6c;
  font-size: 13px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.verify-btn {
  min-width: 120px;
  background: #f0f0f0 !important;
  border: 1px solid #d0d0d0 !important;
  color: #333 !important;
}

.verify-btn:hover {
  background: #e0e0e0 !important;
  border-color: #c0c0c0 !important;
}

.verify-btn:active {
  background: #d0d0d0 !important;
}

@media (max-width: 480px) {
  .captcha-dialog {
    --el-dialog-width: 90% !important;
  }
  .captcha-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>