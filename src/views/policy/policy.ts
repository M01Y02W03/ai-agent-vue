import { createHttpClient } from '../../utils/http'

// 创建HTTP客户端实例
const httpClient = createHttpClient()

// 政策条款数据接口
export interface PolicyTerms {
  id: number
  termsContent: string
  privacyContent: string
  version: string
  status: number
  createTime: string
  updateTime: string
  createdBy: string
  updatedBy: string | null
}

// API响应接口（适配 http.ts 处理后的格式）
export interface ApiResponse<T> {
  success: boolean
  data: T
  message: string
  needLogin?: boolean
}

// 获取服务条款和隐私政策
export const getPolicyTerms = async (): Promise<ApiResponse<PolicyTerms[]>> => {
  try {
    const response = await httpClient.get(`${__API_BASE_URL__}/home/policyTerms`)
    
    return response.data
  } catch (error) {
    console.error('获取政策条款失败:', error)
    throw error
  }
}

// 获取最新的政策条款（通常取第一条）
export const getLatestPolicyTerms = async (): Promise<PolicyTerms | null> => {
  try {
    const response = await getPolicyTerms()
    
    if (response.success && response.data && response.data.length > 0) {
      return response.data[0]
    }
    
    return null
  } catch (error) {
    console.error('获取最新政策条款失败:', error)
    return null
  }
}