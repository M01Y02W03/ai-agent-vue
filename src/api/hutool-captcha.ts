import { createHttpClient } from '../utils/http'

// 创建HTTP客户端实例
const httpClient = createHttpClient()

// 基础配置
const API_BASE_URL = __API_BASE_URL__

// 删除未使用的接口，使用通用的响应格式

/**
 * 获取支持的Hutool验证码类型
 * @returns Promise<{ success: boolean; data?: Record<string, string>; error?: string }>
 */
export const getHutoolCaptchaTypes = async (): Promise<{ success: boolean; data?: Record<string, string>; error?: string }> => {
  try {
    const response = await httpClient.get(`${API_BASE_URL}/captcha/hutool/types`)
    
    const result = response.data
    
    if (result.success && result.data) {
      return {
        success: true,
        data: result.data
      }
    } else {
      return {
        success: false,
        error: result.message || '获取验证码类型失败'
      }
    }
  } catch (error: any) {
    console.error('获取验证码类型失败:', error)
    
    if (error.success === false) {
      return {
        success: false,
        error: error.message
      }
    } else if (error.message) {
      return {
        success: false,
        error: `网络错误: ${error.message}`
      }
    } else {
      return {
        success: false,
        error: '获取验证码类型失败，请检查网络连接'
      }
    }
  }
}

/**
 * 生成Hutool图形验证码
 * @param type 验证码类型 (line, circle, shear, math)
 * @returns Promise<{ success: boolean; data?: any; error?: string }>
 */
export const generateHutoolCaptcha = async (type?: string): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    const url = type 
      ? `${API_BASE_URL}/captcha/hutool?type=${encodeURIComponent(type)}`
      : `${API_BASE_URL}/captcha/hutool`
    
    const response = await httpClient.get(url)
    
    const result = response.data
    
    if (result.success && result.data) {
      return {
        success: true,
        data: {
          captchaId: result.data.captchaId,
          imageBase64: result.data.imageBase64,
          captchaType: result.data.captchaType,
          width: result.data.width,
          height: result.data.height
        }
      }
    } else {
      return {
        success: false,
        error: result.message || '获取验证码失败'
      }
    }
  } catch (error: any) {
    console.error('获取验证码失败:', error)
    
    if (error.success === false) {
      return {
        success: false,
        error: error.message
      }
    } else if (error.message) {
      return {
        success: false,
        error: `网络错误: ${error.message}`
      }
    } else {
      return {
        success: false,
        error: '获取验证码失败，请检查网络连接'
      }
    }
  }
}

/**
 * 验证Hutool图形验证码
 * @param captchaId 验证码ID
 * @param code 用户输入的验证码
 * @returns Promise<{ success: boolean; error?: string }>
 */
export const validateHutoolCaptcha = async (
  captchaId: string,
  code: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // 构建查询参数
    const queryParams = new URLSearchParams({
      captchaId,
      code
    })
    
    const response = await httpClient.post(
      `${API_BASE_URL}/captcha/hutool/validate?${queryParams.toString()}`,
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
        error: result.message || '验证失败'
      }
    }
  } catch (error: any) {
    console.error('验证码验证失败:', error)
    
    if (error.success === false) {
      return {
        success: false,
        error: error.message
      }
    } else if (error.message) {
      return {
        success: false,
        error: `网络错误: ${error.message}`
      }
    } else {
      return {
        success: false,
        error: '验证失败，请检查网络连接'
      }
    }
  }
}

/**
 * 随机获取一个验证码类型
 * @returns Promise<{ type: string; description: string } | null>
 */
export const getRandomCaptchaType = async (): Promise<{ type: string; description: string } | null> => {
  try {
    const result = await getHutoolCaptchaTypes()
    
    if (result.success && result.data) {
      const types = Object.keys(result.data)
      const descriptions = Object.values(result.data)
      
      if (types.length > 0) {
        const randomIndex = Math.floor(Math.random() * types.length)
        return {
          type: types[randomIndex],
          description: descriptions[randomIndex]
        }
      }
    }
    
    return null
  } catch (error) {
    console.error('获取随机验证码类型失败:', error)
    return null
  }
}