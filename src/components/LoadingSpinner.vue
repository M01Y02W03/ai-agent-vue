<template>
  <div class="loading-spinner-container">
    <div class="loading-content">
      <div class="ikun-gif-container" :style="gifContainerStyle">
        <div class="ikun-detection-area">
          <img 
            src="/ikun.gif" 
            alt="Loading..." 
            class="ikun-gif" 
            @click="handleIkunClick"
          />
        </div>
      </div>
      <h2 v-if="title" class="loading-title">{{ title }}</h2>
      <p v-if="message" class="loading-message">{{ message }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed } from 'vue'

interface Props {
  title?: string
  message?: string
  fullscreen?: boolean
}

withDefaults(defineProps<Props>(), {
  title: '加载中...',
  message: '点击哥哥~有彩蛋哦~',
  fullscreen: true
})

// 音频播放相关
const audioRef = ref<HTMLAudioElement | null>(null)
const isAudioPlaying = ref(false)

// 图片避让相关
const gifPosition = ref({ x: 0, y: 0 })
const isAvoiding = ref(false)

// 计算图片容器样式
const gifContainerStyle = computed(() => ({
  transform: `translate(${gifPosition.value.x}px, ${gifPosition.value.y}px)`,
  transition: isAvoiding.value ? 'transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'transform 0.5s ease-in-out'
}))

// 处理图片点击事件，同时启动音频播放和避让
const handleIkunClick = (event: MouseEvent) => {
  event.stopPropagation() // 阻止事件冒泡
  
  // 启动音频播放
  if (audioRef.value && !isAudioPlaying.value) {
    audioRef.value.play().then(() => {
      isAudioPlaying.value = true
    }).catch(error => {
      console.warn('音频播放失败:', error)
    })
  }
  
  // 触发避让
  avoidMouse()
}

// 图片避让鼠标
const avoidMouse = () => {
  // 每次点击都触发避让，不限制冷却时间
  isAvoiding.value = true
  
  // 生成随机位置（增大避让范围）
  const maxX = 500
  const maxY = 350
  const newX = (Math.random() - 0.5) * maxX
  const newY = (Math.random() - 0.5) * maxY
  
  gifPosition.value = { x: newX, y: newY }
  
  // 2秒后重置位置，给足够时间展示流畅动画
  setTimeout(() => {
    gifPosition.value = { x: 0, y: 0 }
    setTimeout(() => {
      isAvoiding.value = false
    }, 800) // 等待重置动画完成
  }, 2000)
}

onMounted(() => {
  // 创建音频元素
  audioRef.value = new Audio('/ikun_mp3.mp3')
  audioRef.value.loop = true // 设置循环播放
  audioRef.value.volume = 0.5 // 设置音量为50%
  
  // 尝试自动播放音频（可能会被浏览器阻止）
  audioRef.value.play().then(() => {
    isAudioPlaying.value = true
  }).catch(error => {
    console.warn('自动播放被阻止，需要用户交互:', error)
    // 浏览器阻止自动播放，等待用户点击
  })
})

onUnmounted(() => {
  // 组件卸载时停止音频播放
  if (audioRef.value) {
    audioRef.value.pause()
    audioRef.value.currentTime = 0
    audioRef.value = null
  }
})
</script>

<style scoped>
.loading-spinner-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  height: 100vh;
  width: 100vw;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #1e3c72 100%);
  position: fixed;
  top: 0;
  left: 0;
  z-index: 9999;
}

.loading-content {
  text-align: center;
  color: white;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.ikun-gif-container {
  margin-bottom: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  will-change: transform;
}

.ikun-detection-area {
  position: relative;
  padding: 50px; /* 进一步扩大检测区域 */
  cursor: none; /* 隐藏鼠标指针 */
  border-radius: 50%; /* 圆形检测区域 */
}

.ikun-gif {
  width: 120px;
  height: 120px;
  object-fit: contain;
  pointer-events: auto;
  cursor: pointer;
}

.loading-title {
  margin: 0 0 10px 0;
  font-size: 24px;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.loading-message {
  margin: 0;
  font-size: 16px;
  opacity: 0.9;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.audio-hint {
  margin: 15px 0 0 0;
  font-size: 14px;
  color: #ffd700;
  opacity: 0.8;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  animation: pulse 2s infinite;
  cursor: pointer;
}

@keyframes pulse {
  0% {
    opacity: 0.8;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.8;
  }
}

/* 非全屏模式样式 */
.loading-spinner-container:not(.fullscreen) {
  min-height: auto;
  padding: 40px;
  background: transparent;
}

.loading-spinner-container:not(.fullscreen) .loading-content {
  color: #333;
}

.loading-spinner-container:not(.fullscreen) .loading-title {
  color: #333;
  text-shadow: none;
}

.loading-spinner-container:not(.fullscreen) .loading-message {
  color: #666;
  text-shadow: none;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .ikun-gif {
    width: 100px;
    height: 100px;
  }
  
  .loading-title {
    font-size: 20px;
  }
  
  .loading-message {
    font-size: 14px;
  }
}
</style>