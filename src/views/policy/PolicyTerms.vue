<template>
  <div class="policy-container">
    <!-- 头部导航 -->
    <div 
      ref="headerRef"
      class="policy-header"
      :class="{ fixed: isHeaderFixed }"
    >
      <div class="header-content">
        <router-link :to="backRoute" class="back-link">
          <el-icon><ArrowLeft /></el-icon>
          {{ backText }}
        </router-link>
        <h1 class="page-title">服务条款与隐私政策</h1>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-content">
      <el-icon class="loading-icon" size="48">
        <Loading />
      </el-icon>
      <p>正在加载政策内容...</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-content">
      <el-icon size="48" color="#f56c6c">
        <CircleClose />
      </el-icon>
      <p>{{ error }}</p>
      <el-button type="primary" @click="loadPolicyData">重新加载</el-button>
    </div>

    <!-- 内容展示 -->
    <div v-else-if="policyData" class="policy-content">
      <!-- 标签页切换 -->
      <el-tabs v-model="activeTab" class="policy-tabs">
        <el-tab-pane label="服务条款" name="terms">
          <div class="content-wrapper">
            <div class="content-header">
              <h2>服务条款</h2>
              <div class="meta-info">
                <span>版本：{{ policyData.version }}</span>
                <span>最后更新：{{ formatDate(policyData.updateTime) }}</span>
              </div>
            </div>
            <div 
              class="markdown-content" 
              v-html="renderMarkdown(policyData.termsContent)"
            ></div>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="隐私政策" name="privacy">
          <div class="content-wrapper">
            <div class="content-header">
              <h2>隐私政策</h2>
              <div class="meta-info">
                <span>版本：{{ policyData.version }}</span>
                <span>最后更新：{{ formatDate(policyData.updateTime) }}</span>
              </div>
            </div>
            <div 
              class="markdown-content" 
              v-html="renderMarkdown(policyData.privacyContent)"
            ></div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Loading, CircleClose } from '@element-plus/icons-vue'
import { getPolicyTerms } from './policy'
import type { PolicyTerms } from './policy'
import { marked } from 'marked'

const route = useRoute()
const loading = ref(false)
const error = ref('')
const policyData = ref<PolicyTerms | null>(null)
const activeTab = ref('terms')
const isHeaderFixed = ref(false)
const headerRef = ref<HTMLElement | null>(null)
const headerHeight = ref(0)

// 从路由参数获取默认标签
const defaultTab = computed(() => {
  const tab = route.query.tab as string
  return tab === 'privacy' ? 'privacy' : 'terms'
})

// 计算返回路由和文本
const backRoute = computed(() => {
  const source = route.query.source as string
  if (source === 'login') {
    return '/login'
  } else if (source === 'register') {
    return '/register'
  }
  return '/'
})

const backText = computed(() => {
  const source = route.query.source as string
  if (source === 'login') {
    return '返回登录'
  } else if (source === 'register') {
    return '返回注册'
  }
  return '返回首页'
})

// 格式化日期
const formatDate = (dateString: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 渲染Markdown
const renderMarkdown = (content: string) => {
  if (!content) return ''
  
  // 配置marked选项
  marked.setOptions({
    breaks: true,
    gfm: true
  })
  
  return marked(content)
}

// 加载政策数据
const loadPolicyData = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const result = await getPolicyTerms()
    
    if (result.success && result.data && result.data.length > 0) {
      policyData.value = result.data[0]
      activeTab.value = defaultTab.value
    } else {
      error.value = '暂无政策内容'
    }
  } catch (err) {
    console.error('加载政策内容失败:', err)
    error.value = '加载政策内容失败，请稍后重试'
    ElMessage.error('加载政策内容失败')
  } finally {
    loading.value = false
  }
}

// 滚动监听函数
const handleScroll = () => {
  if (!headerRef.value) return
  
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop
  const headerOffsetTop = headerRef.value.offsetTop
  
  if (scrollTop > headerOffsetTop) {
    if (!isHeaderFixed.value) {
      isHeaderFixed.value = true
      // 为头部元素添加占位高度，防止内容跳动
      headerRef.value.style.marginBottom = `${headerHeight.value + 20}px`
    }
  } else {
    if (isHeaderFixed.value) {
      isHeaderFixed.value = false
      // 恢复原始边距
      headerRef.value.style.marginBottom = '20px'
    }
  }
}

onMounted(() => {
  loadPolicyData()
  
  // 延迟获取头部高度，确保DOM已渲染
  setTimeout(() => {
    if (headerRef.value) {
      headerHeight.value = headerRef.value.offsetHeight
    }
  }, 100)
  
  // 添加滚动监听
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onUnmounted(() => {
  // 清理滚动监听
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.policy-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 20px;
}

.policy-header {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  padding: 20px;
  transition: all 0.3s ease;
}

.policy-header.fixed {
  position: fixed;
  top: 0;
  left: 20px;
  right: 20px;
  border-radius: 0 0 12px 12px;
  margin: 0;
  z-index: 1000;
  max-width: calc(100vw - 40px);
}

.header-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.back-link {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #2a5298;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s ease;
}

.back-link:hover {
  color: #1e3c72;
  transform: translateX(-2px);
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #2a5298;
  margin: 0;
}

.loading-content,
.error-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.loading-icon {
  animation: rotate 2s linear infinite;
  margin-bottom: 16px;
}

.error-content p {
  color: #606266;
  margin-bottom: 16px;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.policy-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.policy-tabs {
  padding: 20px;
}

.content-wrapper {
  max-width: 800px;
  margin: 0 auto;
}

.content-header {
  margin-bottom: 32px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e4e7ed;
}

.content-header h2 {
  font-size: 28px;
  font-weight: 600;
  color: #2a5298;
  margin: 0 0 12px 0;
}

.meta-info {
  display: flex;
  gap: 20px;
  font-size: 14px;
  color: #909399;
}

.markdown-content {
  line-height: 1.8;
  color: #606266;
  font-size: 16px;
}

.markdown-content :deep(h1) {
  font-size: 24px;
  font-weight: 600;
  color: #2a5298;
  margin: 24px 0 16px 0;
}

.markdown-content :deep(h2) {
  font-size: 20px;
  font-weight: 600;
  color: #2a5298;
  margin: 20px 0 12px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid #e4e7ed;
}

.markdown-content :deep(h3) {
  font-size: 18px;
  font-weight: 600;
  color: #2a5298;
  margin: 16px 0 8px 0;
}

.markdown-content :deep(p) {
  margin: 12px 0;
  text-align: justify;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  margin: 12px 0;
  padding-left: 24px;
}

.markdown-content :deep(li) {
  margin: 4px 0;
}

.markdown-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
  font-size: 14px;
}

.markdown-content :deep(th),
.markdown-content :deep(td) {
  border: 1px solid #e4e7ed;
  padding: 8px 12px;
  text-align: left;
}

.markdown-content :deep(th) {
  background-color: #f5f7fa;
  font-weight: 600;
}

.markdown-content :deep(code) {
  background-color: #f5f7fa;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 14px;
}

.markdown-content :deep(pre) {
  background-color: #f5f7fa;
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  font-size: 14px;
}

.markdown-content :deep(blockquote) {
  border-left: 4px solid #2a5298;
  padding-left: 16px;
  margin: 16px 0;
  color: #606266;
  font-style: italic;
}

@media (max-width: 768px) {
  .policy-container {
    padding: 10px;
  }
  
  .policy-header {
    padding: 15px;
  }
  
  .policy-header.fixed {
    left: 10px;
    right: 10px;
    max-width: calc(100vw - 20px);
  }
  
  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .page-title {
    font-size: 20px;
  }
  
  .content-header h2 {
    font-size: 24px;
  }
  
  .meta-info {
    flex-direction: column;
    gap: 8px;
  }
}
</style>