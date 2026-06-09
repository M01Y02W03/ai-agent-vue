// noinspection Annotator

import { createHttpClient } from '../../utils/http'

// 基础配置
const API_BASE_URL = __API_BASE_URL__

// 创建HTTP客户端实例
const httpClient = createHttpClient()

// 删除未使用的接口，它们现在由 http.ts 统一处理

/**
 * 生成图形验证码
 * @returns Promise<CaptchaResponse>
 */
export const generateCaptcha = async (): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    // 使用 httpClient 直接获取原始响应
    const response = await httpClient.get(`${API_BASE_URL}/captcha/graphic`)
    
    // httpClient 的响应拦截器已经处理过了，直接使用 response.data
    const result = response.data
    
    if (result.success && result.data) {
      return {
        success: true,
        data: {
          captchaId: result.data.captchaId,
          bgImage: result.data.bgImage,
          instruction: result.data.instruction
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
 * 验证图形验证码
 * @param captchaId 验证码ID
 * @param x 点击的x坐标
 * @param y 点击的y坐标
 * @returns Promise<ValidateResponse>
 */
export const validateCaptcha = async (
  captchaId: string,
  x: number,
  y: number
): Promise<{ success: boolean; error?: string }> => {
  try {
    // 构建查询参数
    const queryParams = new URLSearchParams({
      captchaId,
      x: x.toString(),
      y: y.toString()
    })
    
    const response = await httpClient.post(
      `${API_BASE_URL}/captcha/validate?${queryParams.toString()}`,
      null // POST请求体为空，参数在URL中
    )
    
    // httpClient 的响应拦截器已经处理过了，直接使用 response.data
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