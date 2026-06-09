import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'

// 通用API响应接口
export interface ApiResponse<T = any> {
  success: boolean
  data: T
  message: string
  needLogin?: boolean
}

// 处理token失效的函数
const handleTokenExpired = async () => {
  // 彻底清除本地存储的所有用户相关信息
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  localStorage.removeItem('userProfile')
  localStorage.removeItem('isLoggedIn')
  
  // 动态导入router以避免循环依赖
  try {
    const { default: router } = await import('../router')
    // 跳转到登录页面，保存当前路径用于登录后重定向
    const currentPath = router.currentRoute.value.fullPath
    if (currentPath !== '/login') {
      router.push({
        name: 'Login',
        query: { redirect: currentPath }
      })
    }
  } catch (error) {
    console.error('Failed to import router:', error)
    // 如果动态导入失败，直接跳转到登录页
    window.location.href = '/login'
  }
}

// 创建axios实例的工厂函数
export const createHttpClient = (config?: AxiosRequestConfig): AxiosInstance => {
  const instance = axios.create({
    baseURL: __API_BASE_URL__,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json'
    },
    ...config
  })

  // 请求拦截器 - 添加token
  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token')
      if (token) {
        config.headers['token'] = token
      }
      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  // 响应拦截器
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      const { data } = response
      
      // 修改response.data为我们的格式
      if (data.code === 200) {
        response.data = {
          success: true,
          data: data.data,
          message: data.msg
        }
      } else if (data.code === 401) {
        // Token失效，清除本地存储并跳转到登录页
        handleTokenExpired()
        
        response.data = {
          success: false,
          data: null,
          message: data.msg || '登录已过期，请重新登录',
          needLogin: true
        }
      } else {
        response.data = {
          success: false,
          data: null,
          message: data.msg || '操作失败'
        }
      }
      
      return response
    },
    (error) => {
      console.error('API请求错误:', error)
      
      // 检查是否是401错误
      if (error.response?.status === 401) {
        handleTokenExpired()
      }
      
      return Promise.reject({
        success: false,
        data: null,
        message: error.response?.data?.msg || error.message || '网络错误'
      })
    }
  )

  return instance
}

// 默认的HTTP客户端实例
export const httpClient = createHttpClient()

// 导出常用的HTTP方法
export const http = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => 
    httpClient.get(url, config).then(res => res.data),
  
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => 
    httpClient.post(url, data, config).then(res => res.data),
  
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => 
    httpClient.put(url, data, config).then(res => res.data),
  
  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => 
    httpClient.delete(url, config).then(res => res.data),
  
  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => 
    httpClient.patch(url, data, config).then(res => res.data)
}

export default httpClient