import { createHttpClient } from '../../utils/http'

// 基础配置
const API_BASE_URL = __API_BASE_URL__

// 登录响应接口
interface LoginResponse {
  success: boolean
  message: string
  data: {
    role: number // 后端实际返回的字段名
    userId: number
    token: string
    formattedLastLoginTime?: string
  } | null
}

// 登录请求参数
interface LoginParams {
  email: string
  password: string
  isRememberMe: boolean
}

// 同端互斥登录
export const mutexLogin = async (params: LoginParams): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    // 创建HTTP客户端实例
    const httpClient = createHttpClient()
    const { email, password, isRememberMe } = params
    
    // 构建URL
    const url = `${API_BASE_URL}/mutex/doLogin`
    
    // 构建请求体
    const requestBody = {
      email,
      password,
      isRememberMe
    }
    
    // 发送POST请求
    const response = await httpClient.post<LoginResponse>(
      url,
      requestBody // JSON请求体
    )
    
    const result = response.data
    
    if (result.success && result.data) {
      // 登录成功前先清除所有旧的用户数据，确保不会有残留
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('userProfile')
      localStorage.removeItem('isLoggedIn')
      
      // 保存新的token
      const tokenValue = result.data.token
      localStorage.setItem('token', tokenValue)
      
      // 保存新的用户信息
      const userInfo = {
        id: result.data.userId,
        email: email,
        name: email.split('@')[0],
        mainRoleId: result.data.role // 使用实际的字段名
      }
      
      localStorage.setItem('user', JSON.stringify(userInfo))
      localStorage.setItem('isLoggedIn', 'true')
      
      // 根据formattedLastLoginTime是否为空判断是否首次注册
      const isNewUser = !result.data.formattedLastLoginTime
      
      return {
        success: true,
        data: {
          user: userInfo,
          token: tokenValue,
          tokenInfo: result.data,
          isNewUser
        }
      }
    } else {
      // 登录失败
      return {
        success: false,
        error: result.message || '用户名或密码错误'
      }
    }
  } catch (error: any) {
    console.error('登录请求失败:', error)
    
    // 处理网络错误或其他异常
    if (error.response?.data?.msg) {
      return {
        success: false,
        error: error.response.data.msg
      }
    } else if (error.message) {
      return {
        success: false,
        error: `网络连接失败: ${error.message}`
      }
    } else {
      return {
        success: false,
        error: '登录失败，请检查网络连接'
      }
    }
  }
}

// 便捷的登录方法
export const doLogin = async (
  email: string, 
  password: string, 
  isRememberMe: boolean = false
): Promise<{ success: boolean; data?: any; error?: string }> => {
  return await mutexLogin({
    email,
    password,
    isRememberMe
  })
}