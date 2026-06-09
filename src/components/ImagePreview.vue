<template>
  <teleport to="body">
    <div 
      v-if="visible" 
      class="image-preview-overlay"
      :class="{ 'fade-in': visible }"
      @click="handleOverlayClick"
      @wheel="handleWheel"
    >
      <!-- 关闭按钮 -->
      <button 
        class="close-btn"
        @click="closePreview"
        aria-label="关闭预览"
      >
        <el-icon :size="24">
          <Close />
        </el-icon>
      </button>

      <!-- 工具栏 -->
      <div class="toolbar">
        <button 
          class="tool-btn"
          @click="zoomIn"
          :disabled="scale >= maxScale"
          title="放大"
        >
          <el-icon :size="20">
            <ZoomIn />
          </el-icon>
        </button>
        
        <button 
          class="tool-btn"
          @click="zoomOut"
          :disabled="scale <= minScale"
          title="缩小"
        >
          <el-icon :size="20">
            <ZoomOut />
          </el-icon>
        </button>
        
        <button 
          class="tool-btn"
          @click="resetZoom"
          title="重置"
        >
          <el-icon :size="20">
            <Refresh />
          </el-icon>
        </button>
        
        <button 
          class="tool-btn"
          @click="rotateImage"
          title="旋转"
        >
          <el-icon :size="20">
            <RefreshRight />
          </el-icon>
        </button>

        <div class="scale-indicator">
          {{ Math.round(scale * 100) }}%
        </div>
      </div>

      <!-- 图片容器 -->
      <div 
        class="image-container"
        ref="containerRef"
        @mousedown="handleMouseDown"
        @mousemove="handleMouseMove"
        @mouseup="handleMouseUp"
        @mouseleave="handleMouseUp"
      >
        <img
          ref="imageRef"
          :src="imageSrc"
          :alt="imageAlt"
          :class="['preview-image', { 'dragging': isDragging }]"
          :style="imageStyle"
          @load="handleImageLoad"
          @error="handleImageError"
          draggable="false"
        />
        
        <!-- 加载状态 -->
        <div v-if="loading" class="loading-overlay">
          <div class="loading-spinner">
            <div class="spinner"></div>
            <span>加载中...</span>
          </div>
        </div>

        <!-- 错误状态 -->
        <div v-if="error" class="error-overlay">
          <div class="error-content">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
              <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" stroke-width="2"/>
              <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" stroke-width="2"/>
            </svg>
            <span>图片加载失败</span>
          </div>
        </div>
      </div>

      <!-- 图片信息 -->
      <div v-if="showInfo" class="image-info">
        <div class="info-item">
          <span class="info-label">尺寸:</span>
          <span class="info-value">{{ imageWidth }} × {{ imageHeight }}</span>
        </div>
        <div class="info-item" v-if="imageAlt">
          <span class="info-label">描述:</span>
          <span class="info-value">{{ imageAlt }}</span>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { ElIcon } from 'element-plus'
import { Close, ZoomIn, ZoomOut, RefreshRight, Refresh } from '@element-plus/icons-vue'

interface Props {
  visible: boolean
  imageSrc: string
  imageAlt?: string
  showInfo?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  imageAlt: '',
  showInfo: true
})

const emit = defineEmits<{
  close: []
  loaded: [width: number, height: number]
  error: [error: Event]
}>()

// 响应式数据
const imageRef = ref<HTMLImageElement>()
const containerRef = ref<HTMLElement>()
const scale = ref(1)
const rotation = ref(0)
const translateX = ref(0)
const translateY = ref(0)
const loading = ref(true)
const error = ref(false)
const imageWidth = ref(0)
const imageHeight = ref(0)

// 拖拽相关
const isDragging = ref(false)
const dragStartX = ref(0)
const dragStartY = ref(0)
const dragStartTranslateX = ref(0)
const dragStartTranslateY = ref(0)

// 缩放限制
const minScale = 0.1
const maxScale = 5

// 计算样式
const imageStyle = computed(() => ({
  transform: `translate(${translateX.value}px, ${translateY.value}px) scale(${scale.value}) rotate(${rotation.value}deg)`,
  transition: isDragging.value ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  cursor: isDragging.value ? 'grabbing' : 'grab'
}))

// 方法
const closePreview = () => {
  emit('close')
}

const handleOverlayClick = (e: MouseEvent) => {
  if (e.target === e.currentTarget) {
    closePreview()
  }
}

const zoomIn = () => {
  if (scale.value < maxScale) {
    scale.value = Math.min(scale.value * 1.2, maxScale)
  }
}

const zoomOut = () => {
  if (scale.value > minScale) {
    scale.value = Math.max(scale.value / 1.2, minScale)
  }
}

const resetZoom = () => {
  scale.value = 1
  rotation.value = 0
  translateX.value = 0
  translateY.value = 0
}

const rotateImage = () => {
  rotation.value = (rotation.value + 90) % 360
}

const handleWheel = (e: WheelEvent) => {
  e.preventDefault()
  const delta = e.deltaY > 0 ? -0.1 : 0.1
  const newScale = Math.max(minScale, Math.min(maxScale, scale.value + delta))
  scale.value = newScale
}

const handleMouseDown = (e: MouseEvent) => {
  if (e.button === 0) { // 左键
    isDragging.value = true
    dragStartX.value = e.clientX
    dragStartY.value = e.clientY
    dragStartTranslateX.value = translateX.value
    dragStartTranslateY.value = translateY.value
    e.preventDefault()
  }
}

const handleMouseMove = (e: MouseEvent) => {
  if (isDragging.value) {
    const deltaX = e.clientX - dragStartX.value
    const deltaY = e.clientY - dragStartY.value
    translateX.value = dragStartTranslateX.value + deltaX
    translateY.value = dragStartTranslateY.value + deltaY
  }
}

const handleMouseUp = () => {
  isDragging.value = false
}

const handleImageLoad = () => {
  loading.value = false
  error.value = false
  if (imageRef.value) {
    imageWidth.value = imageRef.value.naturalWidth
    imageHeight.value = imageRef.value.naturalHeight
    emit('loaded', imageWidth.value, imageHeight.value)
  }
}

const handleImageError = (e: Event) => {
  loading.value = false
  error.value = true
  emit('error', e)
}

// 键盘事件处理
const handleKeydown = (e: KeyboardEvent) => {
  if (!props.visible) return
  
  switch (e.key) {
    case 'Escape':
      closePreview()
      break
    case '+':
    case '=':
      e.preventDefault()
      zoomIn()
      break
    case '-':
      e.preventDefault()
      zoomOut()
      break
    case '0':
      e.preventDefault()
      resetZoom()
      break
    case 'r':
    case 'R':
      e.preventDefault()
      rotateImage()
      break
  }
}

// 监听器
watch(() => props.visible, (visible) => {
  if (visible) {
    // 重置状态
    scale.value = 1
    rotation.value = 0
    translateX.value = 0
    translateY.value = 0
    loading.value = true
    error.value = false
    
    // 禁用页面滚动
    document.body.style.overflow = 'hidden'
  } else {
    // 恢复页面滚动
    document.body.style.overflow = ''
  }
})

watch(() => props.imageSrc, () => {
  if (props.imageSrc) {
    loading.value = true
    error.value = false
  }
})

// 生命周期
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})
</script>

<style scoped>
.image-preview-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(15px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.image-preview-overlay.fade-in {
  opacity: 1;
}

.close-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 48px;
  height: 48px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 10001;
  animation: buttonRotateIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.3s both;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

.toolbar {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(0, 0, 0, 0.7);
  padding: 12px 16px;
  border-radius: 24px;
  backdrop-filter: blur(10px);
  z-index: 10001;
  animation: toolbarSlideIn 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.2s both;
}

.tool-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform: scale(1);
}

.tool-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.25);
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(255, 255, 255, 0.1);
}

.tool-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.scale-indicator {
  color: white;
  font-size: 14px;
  font-weight: 500;
  padding: 0 8px;
  min-width: 50px;
  text-align: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.1);
}

.image-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  animation: imageZoomIn 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.preview-image {
  max-width: 90vw;
  max-height: 90vh;
  object-fit: contain;
  user-select: none;
  transform-origin: center;
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), 
              filter 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform;
}

.preview-image:hover:not(.dragging) {
  transform: translateY(-0.5px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.preview-image.dragging {
  cursor: grabbing !important;
}

.preview-image.dragging:hover {
  transform: none;
  box-shadow: none;
}

.loading-overlay,
.error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  color: white;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid #FF6F61;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.error-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  color: white;
  text-align: center;
}

.image-info {
  position: absolute;
  bottom: 20px;
  left: 20px;
  background: rgba(0, 0, 0, 0.7);
  padding: 16px;
  border-radius: 12px;
  backdrop-filter: blur(10px);
  color: white;
  z-index: 10001;
}

.info-item {
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-label {
  font-weight: 500;
  opacity: 0.8;
}

.info-value {
  font-weight: 400;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 淡入动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
    backdrop-filter: blur(0px);
  }
  to {
    opacity: 1;
    backdrop-filter: blur(15px);
  }
}

.fade-in {
  animation: fadeIn 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

/* 图片缩放进入动画 */
@keyframes imageZoomIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* 工具栏滑入动画 */
@keyframes toolbarSlideIn {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

/* 关闭按钮旋转进入动画 */
@keyframes buttonRotateIn {
  from {
    opacity: 0;
    transform: rotate(-90deg) scale(0.8);
  }
  to {
    opacity: 1;
    transform: rotate(0deg) scale(1);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .toolbar {
    top: 10px;
    padding: 8px 12px;
    gap: 6px;
  }
  
  .tool-btn {
    width: 36px;
    height: 36px;
  }
  
  .close-btn {
    top: 10px;
    right: 10px;
    width: 40px;
    height: 40px;
  }
  
  .image-info {
    bottom: 10px;
    left: 10px;
    right: 10px;
    padding: 12px;
  }
  
  .preview-image {
    max-width: 95vw;
    max-height: 85vh;
  }
}
</style>