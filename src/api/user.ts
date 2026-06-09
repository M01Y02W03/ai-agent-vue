import { createHttpClient } from '../utils/http'
import type { ApiResponse } from '../utils/http'

// 创建用户API专用的HTTP客户端
const userApi = createHttpClient()

// 用户信息接口
export interface UserProfile {
  id: number
  username: string
  email: string
  avatar: string
  mainRoleId: number // 0-管理员，1-普通用户
  roleName: string // 角色名称
  status: number // 0-账号正常，1-账号异常
  statusDesc: string // 状态描述
  location: string | null // 用户位置信息
  loginIp: string // 登录IP地址
  loginDevice: string // 登录设备信息
  registerTime: string
  lastLoginTime: string
}

// 使用统一的API响应类型
export type UserApiResponse<T = any> = ApiResponse<T>

/**
 * 获取用户资料信息
 * @returns Promise<UserApiResponse<UserProfile>>
 */
export const getUserProfile = async (): Promise<UserApiResponse<UserProfile>> => {
  try {
    const response = await userApi.get('/user/profile/info')
    return response.data
  } catch (error: any) {
    console.error('获取用户资料失败:', error)
    return error
  }
}

/**
 * 退出登录
 * @returns Promise<UserApiResponse<null>>
 */
export const logout = async (): Promise<UserApiResponse<null>> => {
  try {
    const response = await userApi.post('/mutex/logout')
    return response.data
  } catch (error: any) {
    console.error('退出登录失败:', error)
    return error
  }
}

/**
 * 更新用户头像
 * @param file 头像文件
 * @returns Promise<UserApiResponse<string>>
 */
export const updateUserAvatar = async (file: File): Promise<UserApiResponse<string>> => {
  try {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await userApi.put('/user/profile/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  } catch (error: any) {
    console.error('更新用户头像失败:', error)
    return error
  }
}

/**
 * 更新用户资料
 * @param profileData 用户资料数据
 * @returns Promise<UserApiResponse<any>>
 */
export const updateUserProfile = async (profileData: { username?: string; email?: string; location?: string }): Promise<UserApiResponse<any>> => {
  try {
    const queryParams = new URLSearchParams()
    
    if (profileData.username !== undefined) {
      queryParams.append('username', profileData.username)
    }
    if (profileData.email !== undefined) {
      queryParams.append('email', profileData.email)
    }
    if (profileData.location !== undefined) {
      queryParams.append('location', profileData.location)
    }
    
    // 调试信息：打印构建的查询参数
    console.log('构建的查询参数:', queryParams.toString())
    console.log('完整的请求URL:', `/user/profile/update?${queryParams.toString()}`)
    
    const response = await userApi.put(`/user/profile/update?${queryParams.toString()}`, null, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
    return response.data
  } catch (error: any) {
    console.error('更新用户资料失败:', error)
    return error
  }
}

/**
 * 重置密码
 * @param email 邮箱地址
 * @param pwd 新密码
 * @returns Promise<UserApiResponse<string>>
 */
export const resetPassword = async (email: string, pwd: string): Promise<UserApiResponse<string>> => {
  try {
    const queryParams = new URLSearchParams({
      email,
      pwd
    })
    
    const response = await userApi.put(`/mutex/resetPWD?${queryParams.toString()}`, null, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
    return response.data
  } catch (error: any) {
    console.error('重置密码失败:', error)
    return error
  }
}

/**
 * 判断用户是否为新注册用户
 * @param registerTime 注册时间
 * @param lastLoginTime 最后登录时间
 * @returns boolean
 */
export const isNewUser = (registerTime: string, lastLoginTime: string): boolean => {
  try {
    const registerDate = new Date(registerTime)
    const lastLoginDate = new Date(lastLoginTime)
    
    // 如果最近登录时间和注册时间相差不超过5分钟，认为是新用户
    const timeDiff = Math.abs(lastLoginDate.getTime() - registerDate.getTime())
    const fiveMinutes = 5 * 60 * 1000 // 5分钟的毫秒数
    
    return timeDiff <= fiveMinutes
  } catch (error) {
    console.error('判断新用户失败:', error)
    return false
  }
}

// AI头像相关接口类型定义
export interface TagQueryVO {
  categoryName: string
  tagNameList: string[]
  descriptionList: string[]
}

/**
 * 获取所有分类的标签集合
 * @returns Promise<UserApiResponse<TagQueryVO[]>>
 */
export const getAvatarTags = async (): Promise<UserApiResponse<TagQueryVO[]>> => {
  try {
    const response = await userApi.get('/avatarGenerate/aiAvatarTags')
    return response.data
  } catch (error: any) {
    console.error('获取AI头像标签失败:', error)
    return error
  }
}

/**
 * 生成用户头像
 * @param prompt 提示词
 * @returns Promise<UserApiResponse<string>>
 */
export const generateAvatar = async (prompt: string): Promise<UserApiResponse<string>> => {
  try {
    const params = new URLSearchParams({
      prompt
    })
    
    const response = await userApi.post(`/avatarGenerate?${params.toString()}`, null, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
    return response.data
  } catch (error: any) {
    console.error('生成AI头像失败:', error)
    return error
  }
}

/**
 * 通过URL更新用户头像
 * @param url 头像URL
 * @returns Promise<UserApiResponse<string>>
 */
export const updateUserAvatarByUrl = async (url: string): Promise<UserApiResponse<string>> => {
  try {
    const params = new URLSearchParams({
      url
    })
    
    const response = await userApi.put(`/user/profile/avatar?${params.toString()}`, null, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
    return response.data
  } catch (error: any) {
    console.error('通过URL更新用户头像失败:', error)
    return error
  }
}

/**
 * 获取用户上次生成的头像
 * @returns Promise<UserApiResponse<string>>
 */
export const getLastGeneratedAvatar = async (): Promise<UserApiResponse<string>> => {
  try {
    const response = await userApi.get('/avatarGenerate/lastAvatar')
    return response.data
  } catch (error: any) {
    console.error('获取上次生成的头像失败:', error)
    return error
  }
}