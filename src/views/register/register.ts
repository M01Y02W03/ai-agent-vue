import { createHttpClient } from '../../utils/http'

// 注册接口响应类型
interface RegisterResponse {
  success: boolean
  message: string
  data: any
}

// 注册请求参数类型
interface RegisterRequest {
  id?: number
  username: string
  email: string
  password: string
}

// 创建HTTP客户端实例
const apiClient = createHttpClient()

/**
 * 用户注册函数
 * @param username 用户名
 * @param email 邮箱
 * @param password 密码
 * @returns Promise<RegisterResponse>
 */
export const doRegister = async (
  username: string,
  email: string,
  password: string
): Promise<RegisterResponse> => {
  try {
    // 构建请求参数，id 默认为 0
    const registerData: RegisterRequest = {
      id: 0,
      username,
      email,
      password
    }

    // 发送注册请求
    const response = await apiClient.post<RegisterResponse>('/register', registerData)
    
    return response.data
  } catch (error: any) {
    // 处理网络错误或服务器错误
    // 由于http.ts中的拦截器已经处理了响应格式转换，这里直接返回错误信息
    if (error && typeof error === 'object' && error.message) {
      // 直接使用http拦截器处理后的错误信息
      return {
        success: false,
        message: error.message,
        data: error.data || null
      }
    } else if (error.response) {
      // 备用处理：如果拦截器没有处理，直接从response中获取
      const backendMessage = error.response.data?.msg || error.response.data?.message
      return {
        success: false,
        message: backendMessage || '服务器响应异常',
        data: error.response.data?.data || null
      }
    } else if (error.request) {
      // 请求发送失败
      return {
        success: false,
        message: '网络连接失败，请检查网络连接',
        data: null
      }
    } else {
      // 其他错误
      return {
        success: false,
        message: '请求处理异常',
        data: null
      }
    }
  }
}

/**
 * 验证注册表单数据
 * @param username 用户名
 * @param email 邮箱
 * @param password 密码
 * @returns 验证结果
 */
export const validateRegisterForm = (
  username: string,
  email: string,
  password: string
): { isValid: boolean; message?: string } => {
  // 用户名验证
  if (!username || username.trim().length === 0) {
    return { isValid: false, message: '请填写用户名' }
  }
  if (username.length < 2 || username.length > 20) {
    return { isValid: false, message: '用户名长度为2-20个字符' }
  }

  // 邮箱验证
  if (!email || email.trim().length === 0) {
    return { isValid: false, message: '请填写邮箱' }
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { isValid: false, message: '邮箱格式不正确' }
  }

  // 密码验证
  if (!password || password.trim().length === 0) {
    return { isValid: false, message: '请填写密码' }
  }
  if (password.length < 6) {
    return { isValid: false, message: '密码至少需要6位字符' }
  }

  return { isValid: true }
}

export default {
  doRegister,
  validateRegisterForm
}