import { createHttpClient } from '../../utils/http'

// 基础配置
const API_BASE_URL = __API_BASE_URL__

// 创建HTTP客户端实例
const httpClient = createHttpClient()

// 发送验证码响应接口
interface SendCodeResponse {
  success: boolean
  message: string
  data: null
}

// 验证验证码响应接口
interface VerifyCodeResponse {
  success: boolean
  message: string
  data: {
    role: number // 后端实际返回的字段名
    userId: number
    token: string
    formattedLastLoginTime?: string
  } | null
}

// 发送邮箱验证码
export const sendEmailCode = async (email: string): Promise<{ success: boolean; error?: string }> => {
  try {
    // 构建URL
    const url = `${API_BASE_URL}/emailVerification/code`
    
    // 构建查询参数
    const queryParams = new URLSearchParams({
      email
    })
    
    // 发送POST请求
    const response = await httpClient.post<SendCodeResponse>(
      `${url}?${queryParams.toString()}`,
      null // POST请求体为空，参数在URL中
    )
    
    const result = response.data
    
    if (result.success) {
      return {
        success: true
      }
    } else {
      return {
        success: false,
        error: result.message || '验证码发送失败'
      }
    }
  } catch (error: any) {
    console.error('发送验证码请求失败:', error)
    
    // 处理网络错误或其他异常
    if (error.response?.data?.message) {
      return {
        success: false,
        error: error.response.data.message
      }
    } else if (error.message) {
      return {
        success: false,
        error: `${error.message}`
      }
    } else {
      return {
        success: false,
        error: '验证码发送失败，请检查网络连接'
      }
    }
  }
}

// 验证邮箱验证码并登录
export const verifyEmailCode = async (
  email: string, 
  code: string
): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    // 构建URL
    const url = `${API_BASE_URL}/emailVerification/verify`
    
    // 构建查询参数
    const queryParams = new URLSearchParams({
      email,
      code
    })
    
    // 发送POST请求
    const response = await httpClient.post<VerifyCodeResponse>(
      `${url}?${queryParams.toString()}`,
      null // POST请求体为空，参数在URL中
    )
    
    const result = response.data
    
    if (result.success && result.data) {
      // 验证成功前先清除所有旧的用户数据，确保不会有残留
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
      const isNewUser = !result.data.formattedLastLoginTime;
      
      return {
        success: true,
        data: {
          user: userInfo,
          token: tokenValue,
          tokenInfo: result.data,
          isNewUser: isNewUser
        }
      }
    } else {
      // 验证失败
      return {
        success: false,
        error: result.message || '验证码不正确'
      }
    }
  } catch (error: any) {
    console.error('验证码验证请求失败:', error)
    
    // 处理网络错误或其他异常
    if (error.response?.data?.message) {
      return {
        success: false,
        error: error.response.data.message
      }
    } else if (error.message) {
      return {
        success: false,
        error: `网络连接失败: ${error.message}`
      }
    } else {
      return {
        success: false,
        error: '验证码验证失败，请检查网络连接'
      }
    }
  }
}

// 便捷的验证码登录方法
export const doCodeLogin = async (
  email: string, 
  code: string
): Promise<{ success: boolean; data?: any; error?: string }> => {
  return await verifyEmailCode(email, code)
}