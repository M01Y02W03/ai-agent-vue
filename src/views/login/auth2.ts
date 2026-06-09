import { createHttpClient } from '../../utils/http'
import { useAuthStore } from '../../stores/auth'
import { ElMessage } from 'element-plus'

// 创建HTTP客户端实例
const apiClient = createHttpClient()

/**
 * 获取Gitee第三方授权地址
 * @returns Promise<string> 授权地址
 */
export const getGiteeOAuth2AuthorizeUrl = async (): Promise<string> => {
  try {
    const response = await apiClient.get('/oauth2/gitee/authorizeUrl')
    console.log('Gitee OAuth2授权地址响应:', response.data)
    
    // 响应拦截器已经将格式转换为 {success: boolean, data: any, message: string}
    if (response.data.success && response.data.data) {
      // 直接返回后端提供的完整授权URL
      return response.data.data
    } else {
      throw new Error(response.data.message || '获取Gitee授权地址失败')
    }
  } catch (error: any) {
    console.error('获取Gitee授权地址失败:', error)
    throw new Error(error.message || '获取Gitee授权地址失败')
  }
}

/**
 * 获取GitHub第三方授权地址
 * @returns Promise<string> 授权地址
 */
export const getGitHubOAuth2AuthorizeUrl = async (): Promise<string> => {
  try {
    const response = await apiClient.get('/oauth2/github/authorizeUrl')
    console.log('GitHub OAuth2授权地址响应:', response.data)
    
    // 响应拦截器已经将格式转换为 {success: boolean, data: any, message: string}
    if (response.data.success && response.data.data) {
      // 直接返回后端提供的完整授权URL
      return response.data.data
    } else {
      throw new Error(response.data.message || '获取GitHub授权地址失败')
    }
  } catch (error: any) {
    console.error('获取GitHub授权地址失败:', error)
    throw new Error(error.message || '获取GitHub授权地址失败')
  }
}

/**
 * 获取第三方授权地址 (保持向后兼容，默认使用Gitee)
 * @returns Promise<string> 授权地址
 */
export const getOAuth2AuthorizeUrl = async (): Promise<string> => {
  return getGiteeOAuth2AuthorizeUrl()
}

/**
 * 处理Gitee登录回调
 * @param code 授权码
 * @returns Promise<{success: boolean, data?: any, error?: string}>
 */
export const handleGiteeOAuth2Callback = async (code: string): Promise<{
  success: boolean
  data?: string  // JWT token字符串
  error?: string
}> => {
  try {
    const response = await apiClient.get('/oauth2/gitee/redirectUri', {
      params: { code }
    })
    
    // 响应拦截器已经将格式转换为 {success: boolean, data: any, message: string}
    if (response.data.success && response.data.data) {
      return {
        success: true,
        data: response.data.data
      }
    } else {
      return {
        success: false,
        error: response.data.message || 'Gitee登录失败'
      }
    }
  } catch (error: any) {
    console.error('Gitee登录回调处理失败:', error)
    return {
      success: false,
      error: error.message || 'Gitee登录失败，请重试'
    }
  }
}

/**
 * 处理GitHub登录回调
 * @param code 授权码
 * @returns Promise<{success: boolean, data?: any, error?: string}>
 */
export const handleGitHubOAuth2Callback = async (code: string): Promise<{
  success: boolean
  data?: string  // JWT token字符串
  error?: string
}> => {
  try {
    const response = await apiClient.get('/oauth2/github/redirectUri', {
      params: { code }
    })
    
    // 响应拦截器已经将格式转换为 {success: boolean, data: any, message: string}
    if (response.data.success && response.data.data) {
      return {
        success: true,
        data: response.data.data
      }
    } else {
      return {
        success: false,
        error: response.data.message || 'GitHub登录失败'
      }
    }
  } catch (error: any) {
    console.error('GitHub登录回调处理失败:', error)
    return {
      success: false,
      error: error.message || 'GitHub登录失败，请重试'
    }
  }
}

/**
 * 处理第三方登录回调 (保持向后兼容，默认使用Gitee)
 * @param code 授权码
 * @returns Promise<{success: boolean, data?: any, error?: string}>
 */
export const handleOAuth2Callback = async (code: string): Promise<{
  success: boolean
  data?: string  // JWT token字符串
  error?: string
}> => {
  return handleGiteeOAuth2Callback(code)
}

/**
 * 发起Gitee登录流程
 */
export const initiateGiteeOAuth2Login = async () => {
  try {
    const authUrl = await getGiteeOAuth2AuthorizeUrl()
    if (authUrl) {
      // 跳转到授权页面
      window.location.href = authUrl
    }
  } catch (error: any) {
    ElMessage.error(error.message || '发起Gitee登录失败')
  }
}

/**
 * 发起GitHub登录流程
 */
export const initiateGitHubOAuth2Login = async () => {
  try {
    const authUrl = await getGitHubOAuth2AuthorizeUrl()
    if (authUrl) {
      // 跳转到授权页面
      window.location.href = authUrl
    }
  } catch (error: any) {
    ElMessage.error(error.message || '发起GitHub登录失败')
  }
}

/**
 * 发起第三方登录流程 (保持向后兼容，默认使用Gitee)
 */
export const initiateOAuth2Login = async () => {
  return initiateGiteeOAuth2Login()
}

/**
 * 处理OAuth2登录回调并自动登录
 * @param router Vue Router实例
 * @param platform 平台类型 ('gitee' | 'github')，如果不指定则根据URL路径自动判断
 */
export const processOAuth2Login = async (router: any, platform?: 'gitee' | 'github') => {
  const urlParams = new URLSearchParams(window.location.search)
  const code = urlParams.get('code')
  
  if (!code) {
    return false
  }
  
  // 如果没有指定平台，根据当前URL路径自动判断
  if (!platform) {
    const currentPath = window.location.pathname
    if (currentPath.includes('/oauth2/callback/github')) {
      platform = 'github'
    } else if (currentPath.includes('/oauth2/callback/gitee')) {
      platform = 'gitee'
    } else {
      // 默认使用Gitee
      platform = 'gitee'
    }
  }
  
  const platformName = platform === 'github' ? 'GitHub' : 'Gitee'
  
  try {
    const authStore = useAuthStore()
    
    console.log(`步骤1: 开始处理${platformName}授权回调`)
    
    // 步骤1: 处理OAuth2回调，获取token
    const result = platform === 'github' 
      ? await handleGitHubOAuth2Callback(code)
      : await handleGiteeOAuth2Callback(code)
    
    if (!result.success || !result.data) {
      throw new Error(result.error || `${platformName}授权验证失败`)
    }
    
    // 后端返回的data是JWT token字符串
    const token = result.data
    console.log(`步骤2: ${platformName}登录成功，获得token`)
    
    // 步骤2: 保存token
    localStorage.setItem('token', token)
    console.log('步骤3: Token已保存到本地存储')
    
    // 步骤3: 设置临时用户状态
    authStore.setUser({
      id: '',
      email: '',
      name: '',
      mainRoleId: 0
    })
    console.log('步骤4: 临时用户状态已设置')
    
    // 显示成功消息
    ElMessage.success(`${platformName}登录成功！正在获取用户信息...`)
    
    // 添加一个小延迟，让用户看到成功消息
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    console.log('步骤5: 开始获取用户详细信息')
    
    // 步骤4: 获取用户详细信息（增加重试机制）
    let profileResult
    let retryCount = 0
    const maxProfileRetries = 3
    
    while (retryCount < maxProfileRetries) {
      try {
        profileResult = await authStore.fetchUserProfile()
        if (profileResult.success) {
          break
        } else {
          throw new Error(profileResult.message || '获取用户信息失败')
        }
      } catch (profileError: any) {
        retryCount++
        console.log(`获取用户信息失败，第${retryCount}次重试:`, profileError)
        
        if (retryCount < maxProfileRetries) {
          // 等待2秒后重试
          await new Promise(resolve => setTimeout(resolve, 2000))
        } else {
          // 最后一次重试失败，但不影响登录流程
          console.warn('获取用户详细信息失败，但登录流程继续')
          profileResult = { success: false, message: profileError.message }
          break
        }
      }
    }
    
    console.log('步骤6: 用户信息获取完成，准备页面跳转')
    
    // 步骤5: 直接跳转到控制台，不再判断是否为新用户
    if (profileResult && profileResult.success) {
      console.log('登录成功，跳转到控制台')
      ElMessage.success('登录成功，正在跳转到控制台...')
      
      // 添加延迟让用户看到成功消息
      await new Promise(resolve => setTimeout(resolve, 1000))
      await router.push('/dashboard')
    } else {
      // 获取用户资料失败，但登录成功，直接跳转到控制台
      console.log('用户信息获取失败，但登录成功，跳转到控制台')
      ElMessage.warning('登录成功，但获取用户信息失败，正在跳转...')
      
      await new Promise(resolve => setTimeout(resolve, 1000))
      await router.push('/dashboard')
    }
    
    console.log(`${platformName}登录流程完成`)
    return true
    
  } catch (error: any) {
    console.error(`处理${platformName}登录回调失败:`, error)
    
    // 根据错误类型提供更具体的错误信息
    if (error.message.includes('网络') || error.message.includes('Network')) {
      throw new Error(`网络连接失败，请检查网络后重试`)
    } else if (error.message.includes('超时') || error.message.includes('timeout')) {
      throw new Error(`请求超时，请重试`)
    } else if (error.message.includes('授权')) {
      throw new Error(`${platformName}授权失败，请重新授权`)
    } else {
      throw new Error(error.message || `${platformName}登录处理失败`)
    }
  }
}

export default {
  // Gitee相关函数
  getGiteeOAuth2AuthorizeUrl,
  handleGiteeOAuth2Callback,
  initiateGiteeOAuth2Login,
  
  // GitHub相关函数
  getGitHubOAuth2AuthorizeUrl,
  handleGitHubOAuth2Callback,
  initiateGitHubOAuth2Login,
  
  // 通用函数（向后兼容）
  getOAuth2AuthorizeUrl,
  handleOAuth2Callback,
  initiateOAuth2Login,
  processOAuth2Login
}