<template>
  <LoadingSpinner 
    :title="loadingTitle"
    :message="loadingMessage"
  />
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import LoadingSpinner from '../../components/LoadingSpinner.vue'
import { processOAuth2Login } from '../login/auth2'

const router = useRouter()
const route = useRoute()

// 加载状态
const loadingTitle = ref('正在处理第三方登录...')
const loadingMessage = ref('请稍候，正在验证授权信息')

// 重试相关
const maxRetries = 3
const retryDelay = 2000 // 2秒

// 延迟函数
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// 带重试的登录处理函数
const processLoginWithRetry = async (code: string, platform: 'github' | 'gitee', retryCount = 0): Promise<boolean> => {
  const platformName = platform === 'github' ? 'GitHub' : 'Gitee'
  
  try {
    // 更新加载状态
    if (retryCount > 0) {
      loadingTitle.value = `正在重试${platformName}登录...`
      loadingMessage.value = `第${retryCount}次重试，请耐心等待`
    } else {
      loadingTitle.value = `正在处理${platformName}登录...`
      loadingMessage.value = '正在验证授权信息，请稍候'
    }
    
    console.log(`开始处理${platformName}OAuth2回调，授权码:`, code, retryCount > 0 ? `(第${retryCount}次重试)` : '')
    
    // 添加超时处理
    const timeoutPromise = new Promise<boolean>((_, reject) => {
      setTimeout(() => reject(new Error('登录处理超时')), 30000) // 30秒超时
    })
    
    const loginPromise = processOAuth2Login(router, platform)
    
    const success = await Promise.race([loginPromise, timeoutPromise])
    
    if (success) {
      return true
    } else {
      throw new Error(`${platformName}登录处理失败`)
    }
  } catch (error: any) {
    console.error(`${platformName}OAuth2登录处理异常:`, error, retryCount > 0 ? `(第${retryCount}次重试)` : '')
    
    // 如果是网络错误或超时，且还有重试次数，则进行重试
    if (retryCount < maxRetries && (
      error.message.includes('网络') || 
      error.message.includes('超时') || 
      error.message.includes('timeout') ||
      error.message.includes('Network Error') ||
      error.code === 'NETWORK_ERROR'
    )) {
      loadingTitle.value = `${platformName}登录遇到网络问题`
      loadingMessage.value = `${retryDelay / 1000}秒后自动重试...`
      
      await delay(retryDelay)
      return await processLoginWithRetry(code, platform, retryCount + 1)
    }
    
    // 如果错误信息包含token，说明可能是token处理问题
    if (error.message && error.message.includes('eyJ')) {
      ElMessage.error(`${platformName}登录成功，但用户信息处理失败，请重新登录`)
    } else if (error.message.includes('超时')) {
      ElMessage.error(`${platformName}登录处理超时，请检查网络连接后重试`)
    } else {
      ElMessage.error(`${platformName}登录失败: ${error.message || '未知错误'}`)
    }
    
    return false
  }
}

onMounted(async () => {
  const code = route.query.code as string
  
  if (!code) {
    ElMessage.error('授权失败，缺少授权码')
    await router.push('/login')
    return
  }
  
  // 从路由路径中识别平台类型
  const platform = route.path.includes('/github') ? 'github' : 'gitee'
  const platformName = platform === 'github' ? 'GitHub' : 'Gitee'
  
  // 显示初始加载状态
  loadingTitle.value = `正在处理${platformName}登录...`
  loadingMessage.value = '正在连接服务器，请稍候'
  
  // 添加一个小延迟，让用户看到加载状态
  await delay(500)
  
  const success = await processLoginWithRetry(code, platform)
  
  if (!success) {
    console.error(`${platformName}OAuth2登录最终失败`)
    loadingTitle.value = '登录失败'
    loadingMessage.value = '即将返回登录页面...'
    
    await delay(2000)
    await router.push('/login')
  }
})
</script>