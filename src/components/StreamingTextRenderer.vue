<template>
  <div class="streaming-text-renderer">
    <div 
      ref="contentRef"
      class="content-container"
      :class="{ 
        'streaming': showStreamingEffect,
        'typing': isTyping,
        'loading': props.isStreaming && !displayedContent
      }"
    >
      <!-- 加载状态指示器 -->
      <div v-if="props.isStreaming && !displayedContent" class="loading-indicator">
        <div class="loading-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <span class="loading-text">AI正在思考中...</span>
      </div>
      
      <!-- 内容区域 -->
      <div 
        v-if="displayedContent || !props.isStreaming"
        class="content-wrapper"
        :class="{ 'fade-in': displayedContent }"
      >
        <div 
          v-html="renderedContent" 
          class="markdown-content"
        ></div>
        <span 
          v-if="showCursor" 
          class="inline-cursor"
          :class="{ 'typing': isTyping }"
        ></span>
      </div>
    </div>

    <!-- 图片预览组件 -->
    <ImagePreview
      :visible="previewVisible"
      :image-src="previewImageSrc"
      :image-alt="previewImageAlt"
      @close="closeImagePreview"
      @loaded="handleImageLoaded"
      @error="handleImageError"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import ImagePreview from './ImagePreview.vue'

// Props
interface Props {
  content: string
  isStreaming?: boolean
  typewriterSpeed?: number
  enableMarkdown?: boolean
  enableSyntaxHighlight?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isStreaming: false,
  typewriterSpeed: 30, // 每秒字符数
  enableMarkdown: true,
  enableSyntaxHighlight: true
})

// Emits
const emit = defineEmits<{
  streamingComplete: []
  contentUpdated: [content: string]
}>()

// 响应式数据
const contentRef = ref<HTMLElement>()
const displayedContent = ref('')
const isInternalStreaming = ref(false)
const typewriterTimer = ref<number>()
const showCursor = ref(false)
const isTyping = ref(false)
const showStreamingEffect = ref(false)

// 图片预览相关状态
const previewVisible = ref(false)
const previewImageSrc = ref('')
const previewImageAlt = ref('')

// 计算属性
const renderedContent = computed(() => {
  if (!props.enableMarkdown) {
    return displayedContent.value.replace(/\n/g, '<br>')
  }

  try {
    // 使用现代的marked配置方式
    const html = marked.parse(displayedContent.value, {
      breaks: true,
      gfm: true,
      async: false
    })
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre', 
        'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'a', 'img', 'table', 'thead', 
        'tbody', 'tr', 'th', 'td', 'hr', 'div', 'span'
      ],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id']
    })
  } catch (error) {
    console.error('Markdown渲染错误:', error)
    return displayedContent.value.replace(/\n/g, '<br>')
  }
})

// 方法
const startTypewriter = (targetContent: string) => {
  if (typewriterTimer.value) {
    clearInterval(typewriterTimer.value)
  }

  isInternalStreaming.value = true
  showCursor.value = true
  isTyping.value = true
  showStreamingEffect.value = true
  displayedContent.value = ''
  
  let currentIndex = 0
  const intervalTime = 1000 / props.typewriterSpeed

  typewriterTimer.value = setInterval(() => {
    if (currentIndex < targetContent.length) {
      displayedContent.value = targetContent.substring(0, currentIndex + 1)
      currentIndex++
      
      nextTick(() => {
        scrollToBottom()
        emit('contentUpdated', displayedContent.value)
      })
    } else {
      clearInterval(typewriterTimer.value)
      isInternalStreaming.value = false
      showCursor.value = false
      isTyping.value = false
      showStreamingEffect.value = false
      emit('streamingComplete')
    }
  }, intervalTime)
}

const updateContentInstantly = (content: string) => {
  if (typewriterTimer.value) {
    clearInterval(typewriterTimer.value)
  }
  
  displayedContent.value = content
  isInternalStreaming.value = false
  showCursor.value = false
  isTyping.value = false
  showStreamingEffect.value = false
  
  nextTick(() => {
    scrollToBottom()
    emit('contentUpdated', content)
  })
}

const appendContent = (newContent: string) => {
  displayedContent.value += newContent
  showCursor.value = props.isStreaming
  isTyping.value = props.isStreaming
  showStreamingEffect.value = props.isStreaming
  
  nextTick(() => {
    scrollToBottom()
    emit('contentUpdated', displayedContent.value)
  })
}

const scrollToBottom = () => {
  if (contentRef.value) {
    const container = contentRef.value.closest('.messages-container')
    if (container) {
      container.scrollTop = container.scrollHeight
    }
  }
}

const highlightCode = () => {
  if (!props.enableSyntaxHighlight) return

  nextTick(() => {
    const codeBlocks = contentRef.value?.querySelectorAll('pre code')
    codeBlocks?.forEach((block) => {
      // 这里可以集成代码高亮库，如 highlight.js 或 prism.js
      // 为了简化，我们只添加基本的样式类
      block.classList.add('highlighted-code')
    })
  })
}

// 监听器
watch(() => props.content, (newContent, oldContent) => {
  if (newContent === oldContent) return

  if (props.isStreaming) {
    // 流式模式：直接追加内容，不使用打字机效果
    if (newContent.length > displayedContent.value.length) {
      // 内容增加，追加新内容
      const newPart = newContent.substring(displayedContent.value.length)
      appendContent(newPart)
    } else {
      // 内容完全替换
      displayedContent.value = newContent
      showCursor.value = true
      isTyping.value = true
      showStreamingEffect.value = true
      nextTick(() => {
        scrollToBottom()
        emit('contentUpdated', displayedContent.value)
      })
    }
  } else {
    // 非流式模式：立即显示
    updateContentInstantly(newContent)
  }
}, { immediate: true })

watch(() => props.isStreaming, (streaming) => {
  if (!streaming) {
    // 流式结束，隐藏光标和效果
    showCursor.value = false
    isTyping.value = false
    showStreamingEffect.value = false
    if (isInternalStreaming.value) {
      updateContentInstantly(props.content)
    }
  } else {
    // 开始流式，显示光标和效果
    showCursor.value = true
    isTyping.value = true
    showStreamingEffect.value = true
  }
})

watch(renderedContent, () => {
  highlightCode()
  setupImageClickHandlers()
})

// 图片预览相关方法
const openImagePreview = (src: string, alt: string = '') => {
  previewImageSrc.value = src
  previewImageAlt.value = alt
  previewVisible.value = true
}

const closeImagePreview = () => {
  previewVisible.value = false
  previewImageSrc.value = ''
  previewImageAlt.value = ''
}

const handleImageLoaded = () => {
  console.log('图片加载成功')
}

const handleImageError = () => {
  console.error('图片加载失败')
}

// 设置图片点击事件处理器
const setupImageClickHandlers = () => {
  nextTick(() => {
    if (!contentRef.value) return
    
    const images = contentRef.value.querySelectorAll('img')
    images.forEach((img) => {
      // 移除之前的事件监听器（如果有）
      img.removeEventListener('click', handleImageClick)
      // 添加新的事件监听器
      img.addEventListener('click', handleImageClick)
      // 添加样式，表示可点击
      img.style.cursor = 'pointer'
      img.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      img.style.borderRadius = '8px'
      img.style.willChange = 'transform'
      
      // 添加悬停效果
      img.addEventListener('mouseenter', () => {
        img.style.transform = 'scale(1.05)'
        img.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.3)'
        img.style.filter = 'brightness(1.1)'
      })
      
      img.addEventListener('mouseleave', () => {
        img.style.transform = 'scale(1)'
        img.style.boxShadow = 'none'
        img.style.filter = 'brightness(1)'
      })
    })
  })
}

const handleImageClick = (event: Event) => {
  const img = event.target as HTMLImageElement
  if (img && img.src) {
    openImagePreview(img.src, img.alt || '')
  }
}

// 暴露方法给父组件
defineExpose({
  startTypewriter,
  updateContentInstantly,
  appendContent,
  scrollToBottom,
  openImagePreview,
  closeImagePreview
})

// 生命周期
onMounted(() => {
  highlightCode()
  setupImageClickHandlers()
})

onUnmounted(() => {
  if (typewriterTimer.value) {
    clearInterval(typewriterTimer.value)
  }
})
</script>

<style scoped>
.streaming-text-renderer {
  position: relative;
  width: 100%;
}

.content-container {
  line-height: 1.6;
  word-wrap: break-word;
  word-break: break-word;
  white-space: pre-wrap;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
}

.content-container.streaming {
  animation: gentle-pulse 2s ease-in-out infinite;
}

.content-container.loading {
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.loading-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 0;
  opacity: 0.8;
}

.loading-dots {
  display: flex;
  gap: 4px;
  align-items: center;
}

.loading-dots span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: linear-gradient(45deg, #FF6F61, #FF8A80);
  animation: loading-bounce 1.4s infinite ease-in-out;
}

.loading-dots span:nth-child(1) {
  animation-delay: 0s;
}

.loading-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.loading-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

.loading-text {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  font-style: italic;
}

.content-wrapper {
  width: 100%;
  transition: all 0.3s ease-in-out;
  margin: 0;
  padding: 0;
  height: fit-content;
  min-height: 0;
  display: block;
}

.content-wrapper.fade-in {
  animation: fade-in 0.5s ease-in-out;
}

.markdown-content {
  line-height: 1.3;
  margin: 0;
  padding: 0;
  min-height: 0;
  height: fit-content;
  display: block;
  width: 100%;
  overflow: hidden;
}

.inline-cursor {
  display: inline-block;
  width: 2px;
  height: 1.2em;
  background-color: #FF6F61;
  margin-left: 2px;
  vertical-align: text-bottom;
  animation: blink 1s infinite;
  transition: opacity 0.3s ease;
}

.inline-cursor.typing {
  animation: blink 0.8s infinite, pulse 1.5s ease-in-out infinite;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

@keyframes gentle-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.95; }
}

@keyframes pulse {
  0%, 100% { 
    transform: scaleY(1);
    background-color: #FF6F61;
  }
  50% { 
    transform: scaleY(1.2);
    background-color: #FF8A80;
  }
}

@keyframes loading-bounce {
  0%, 80%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1.2);
    opacity: 1;
  }
}

@keyframes fade-in {
  0% {
    opacity: 0;
    transform: translateY(10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Markdown样式 */
.content-container :deep(h1),
.content-container :deep(h2),
.content-container :deep(h3),
.content-container :deep(h4),
.content-container :deep(h5),
.content-container :deep(h6) {
  margin: 16px 0 8px 0;
  font-weight: 600;
  color: #FF6F61;
}

.content-container :deep(h1) { font-size: 1.5em; }
.content-container :deep(h2) { font-size: 1.3em; }
.content-container :deep(h3) { font-size: 1.2em; }
.content-container :deep(h4) { font-size: 1.1em; }
.content-container :deep(h5) { font-size: 1.05em; }
.content-container :deep(h6) { font-size: 1em; }

.content-container :deep(p) {
  margin: 8px 0;
}

.content-container :deep(strong) {
  font-weight: 600;
  color: #FFB366;
}

.content-container :deep(em) {
  font-style: italic;
  color: #66D9EF;
}

.content-container :deep(code) {
  background: rgba(255, 255, 255, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 0.9em;
  color: #A6E22E;
}

.content-container :deep(pre) {
  background: rgba(0, 0, 0, 0.3);
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 12px 0;
  border-left: 4px solid #FF6F61;
}

.content-container :deep(pre code) {
  background: none;
  padding: 0;
  color: #F8F8F2;
  font-size: 0.9em;
  line-height: 1.4;
}

.content-container :deep(blockquote) {
  border-left: 4px solid #FF6F61;
  padding-left: 16px;
  margin: 12px 0;
  color: rgba(255, 255, 255, 0.8);
  font-style: italic;
  background: rgba(255, 111, 97, 0.1);
  border-radius: 0 8px 8px 0;
  padding: 12px 16px;
}

.content-container :deep(ul),
.content-container :deep(ol) {
  margin: 8px 0;
  padding-left: 24px;
}

.content-container :deep(li) {
  margin: 4px 0;
}

.content-container :deep(a) {
  color: #66D9EF;
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: all 0.3s ease;
}

.content-container :deep(a:hover) {
  color: #FF6F61;
  border-bottom-color: #FF6F61;
}

.content-container :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 12px 0;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  overflow: hidden;
}

.content-container :deep(th),
.content-container :deep(td) {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.content-container :deep(th) {
  background: rgba(255, 111, 97, 0.2);
  font-weight: 600;
  color: #FF6F61;
}

.content-container :deep(hr) {
  border: none;
  height: 2px;
  background: linear-gradient(90deg, transparent, #FF6F61, transparent);
  margin: 20px 0;
}

.content-container :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 8px 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

/* 代码高亮样式 */
.content-container :deep(.highlighted-code) {
  background: rgba(0, 0, 0, 0.4);
  border-radius: 6px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .content-container {
    font-size: 13px;
  }
  
  .content-container :deep(pre) {
    padding: 12px;
    font-size: 12px;
  }
  
  .content-container :deep(table) {
    font-size: 12px;
  }
  
  .content-container :deep(th),
  .content-container :deep(td) {
    padding: 8px;
  }
}

/* 深色主题适配 */
@media (prefers-color-scheme: dark) {
  .content-container {
    color: rgba(255, 255, 255, 0.95);
  }
  
  .content-container :deep(code) {
    background: rgba(255, 255, 255, 0.15);
  }
  
  .content-container :deep(pre) {
    background: rgba(0, 0, 0, 0.5);
  }
}
</style>