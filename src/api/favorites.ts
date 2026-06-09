import { createHttpClient } from '../utils/http'
import type { ApiResponse } from '../utils/http'

// 创建收藏API专用的HTTP客户端
const favoritesApi = createHttpClient()

// 收藏分类DTO类型定义
export interface FavoriteCategoryDto {
  name?: string
  icon?: string
  parentId?: number
  sort?: number
  description?: string
  status?: number // 0-禁用 1-启用
}

// 收藏分类接口类型定义
export interface FavoriteCategoryVo {
  id: number
  userId: number
  name: string
  icon: string
  parentId: number
  level: number
  sort: number
  description: string
  status: number // 0-禁用 1-启用
  createTime: string
  updateTime: string
  children: FavoriteCategoryVo[]
  favoriteCount: number
}

// 收藏项DTO类型定义
export interface FavoriteDto {
  userId?: number
  title: string
  description?: string
  categoryId: number
  isPublic?: number // 0-私有 1-公开
  fileUrl?: string
}

// 收藏项VO类型定义
export interface FavoriteVo {
  id: number
  userId: number
  title: string
  url: string
  description: string
  categoryId: number
  categoryName: string
  categoryIcon: string
  fileType: string
  fileSize: number
  isPublic: number // 0-私有 1-公开
  accessCount: number
  lastAccessTime: string
  createTime: string
  updateTime: string
}

// 收藏统计类型定义
export interface FavoriteStatistics {
  total_access_count: number
  total_file_size: number
  total_count: number
  private_count: number
  public_count: number
  categoryStatistics: Array<{
    category_name: string
    count: number
  }>
  typeStatistics: Array<{
    file_type: string
    count: number
  }>
}

// 使用统一的API响应类型
export type FavoritesApiResponse<T = any> = ApiResponse<T>

/**
 * 获取收藏分类树形结构
 * @returns Promise<FavoritesApiResponse<FavoriteCategoryVo[]>>
 */
export const getFavoriteCategoryTree = async (): Promise<FavoritesApiResponse<FavoriteCategoryVo[]>> => {
  try {
    const response = await favoritesApi.get('/user/favorite-category/tree')
    return response.data
  } catch (error: any) {
    console.error('获取收藏分类树失败:', error)
    return error
  }
}

/**
 * 根据ID获取分类详情
 * @param id 分类ID
 * @returns Promise<FavoritesApiResponse<FavoriteCategoryVo>>
 */
export const getFavoriteCategoryDetail = async (id: number): Promise<FavoritesApiResponse<FavoriteCategoryVo>> => {
  try {
    const response = await favoritesApi.get(`/user/favorite-category/detail/${id}`)
    return response.data
  } catch (error: any) {
    console.error('获取分类详情失败:', error)
    return error
  }
}

/**
 * 根据父分类ID获取子分类列表
 * @param parentId 父分类ID
 * @returns Promise<FavoritesApiResponse<FavoriteCategoryVo[]>>
 */
export const getFavoriteCategoryChildren = async (parentId: number): Promise<FavoritesApiResponse<FavoriteCategoryVo[]>> => {
  try {
    const response = await favoritesApi.get(`/user/favorite-category/children/${parentId}`)
    return response.data
  } catch (error: any) {
    console.error('获取子分类失败:', error)
    return error
  }
}

/**
 * 获取文件夹图标映射
 * @param iconName 图标名称
 * @returns 图标类名或SVG路径
 */
export const getFolderIcon = (iconName: string): string => {
  const iconMap: Record<string, string> = {
    'folder': '📁',
    'document': '📄',
    'image': '🖼️',
    'video': '🎥',
    'music': '🎵',
    'code': '💻',
    'book': '📚',
    'star': '⭐',
    'heart': '❤️',
    'work': '💼',
    'study': '📖',
    'project': '🚀',
    'tech': '⚙️',
    'article': '📝',
    'link': '🔗',
    'archive': '📦'
  }
  
  return iconMap[iconName] || '📁'
}

/**
 * 创建收藏分类
 * @param categoryDto 分类信息
 * @returns Promise<FavoritesApiResponse<string>>
 */
export const createFavoriteCategory = async (categoryDto: FavoriteCategoryDto): Promise<FavoritesApiResponse<string>> => {
  try {
    const response = await favoritesApi.post('/user/favorite-category/create', categoryDto)
    return response.data
  } catch (error: any) {
    console.error('创建分类失败:', error)
    return error
  }
}

/**
 * 更新收藏分类
 * @param id 分类ID
 * @param categoryDto 分类信息
 * @returns Promise<FavoritesApiResponse<string>>
 */
export const updateFavoriteCategory = async (id: number, categoryDto: FavoriteCategoryDto): Promise<FavoritesApiResponse<string>> => {
  try {
    const response = await favoritesApi.put(`/user/favorite-category/update/${id}`, categoryDto)
    return response.data
  } catch (error: any) {
    console.error('更新分类失败:', error)
    return error
  }
}

/**
 * 删除收藏分类
 * @param id 分类ID
 * @returns Promise<FavoritesApiResponse<string>>
 */
export const deleteFavoriteCategory = async (id: number): Promise<FavoritesApiResponse<string>> => {
  try {
    const response = await favoritesApi.delete(`/user/favorite-category/delete/${id}`)
    return response.data
  } catch (error: any) {
    console.error('删除分类失败:', error)
    return error
  }
}

/**
 * 移动分类到新的父分类下
 * @param id 分类ID
 * @param newParentId 新父分类ID
 * @returns Promise<FavoritesApiResponse<string>>
 */
export const moveFavoriteCategory = async (id: number, newParentId: number): Promise<FavoritesApiResponse<string>> => {
  try {
    const response = await favoritesApi.put(`/user/favorite-category/move/${id}?newParentId=${newParentId}`)
    return response.data
  } catch (error: any) {
    console.error('移动分类失败:', error)
    return error
  }
}

// ==================== 收藏项相关API ====================

/**
 * 更新收藏信息
 * @param id 收藏ID
 * @param favoriteDto 收藏信息
 * @returns Promise<FavoritesApiResponse<string>>
 */
export const updateFavorite = async (id: number, favoriteDto: FavoriteDto): Promise<FavoritesApiResponse<string>> => {
  try {
    const response = await favoritesApi.put(`/user/favorites/update/${id}`, favoriteDto)
    return response.data
  } catch (error: any) {
    console.error('更新收藏失败:', error)
    return error
  }
}

/**
 * 移动收藏到分类
 * @param id 收藏ID
 * @param categoryId 目标分类ID
 * @returns Promise<FavoritesApiResponse<string>>
 */
export const moveFavorite = async (id: number, categoryId: number): Promise<FavoritesApiResponse<string>> => {
  try {
    const response = await favoritesApi.put(`/user/favorites/move/${id}?categoryId=${categoryId}`)
    return response.data
  } catch (error: any) {
    console.error('移动收藏失败:', error)
    return error
  }
}

/**
 * 添加收藏
 * @param favoriteDto 收藏信息
 * @returns Promise<FavoritesApiResponse<number>>
 */
export const addFavorite = async (favoriteDto: FavoriteDto): Promise<FavoritesApiResponse<number>> => {
  try {
    const response = await favoritesApi.post('/user/favorites/add', favoriteDto)
    return response.data
  } catch (error: any) {
    console.error('添加收藏失败:', error)
    return error
  }
}

/**
 * 获取收藏类型
 * @returns Promise<FavoritesApiResponse<string[]>>
 */
export const getFavoriteTypes = async (): Promise<FavoritesApiResponse<string[]>> => {
  try {
    const response = await favoritesApi.get('/user/favorites/types')
    return response.data
  } catch (error: any) {
    console.error('获取收藏类型失败:', error)
    return error
  }
}

/**
 * 根据类型获取收藏
 * @param type 文件类型
 * @returns Promise<FavoritesApiResponse<FavoriteVo[]>>
 */
export const getFavoritesByType = async (type: string): Promise<FavoritesApiResponse<FavoriteVo[]>> => {
  try {
    const response = await favoritesApi.get(`/user/favorites/type/${type}`)
    return response.data
  } catch (error: any) {
    console.error('根据类型获取收藏失败:', error)
    return error
  }
}

/**
 * 获取收藏统计
 * @returns Promise<FavoritesApiResponse<FavoriteStatistics>>
 */
export const getFavoriteStatistics = async (): Promise<FavoritesApiResponse<FavoriteStatistics>> => {
  try {
    const response = await favoritesApi.get('/user/favorites/statistics')
    return response.data
  } catch (error: any) {
    console.error('获取收藏统计失败:', error)
    return error
  }
}

/**
 * 搜索收藏
 * @param keyword 搜索关键词
 * @param categoryId 分类ID（可选）
 * @returns Promise<FavoritesApiResponse<FavoriteVo[]>>
 */
export const searchFavorites = async (keyword: string, categoryId?: number): Promise<FavoritesApiResponse<FavoriteVo[]>> => {
  try {
    const params = new URLSearchParams({ keyword })
    if (categoryId !== undefined) {
      params.append('categoryId', categoryId.toString())
    }
    const response = await favoritesApi.get(`/user/favorites/search?${params.toString()}`)
    return response.data
  } catch (error: any) {
    console.error('搜索收藏失败:', error)
    return error
  }
}

/**
 * 获取用户收藏列表
 * @param categoryId 分类ID（可选）
 * @param page 页码（可选）
 * @param size 每页大小（可选）
 * @returns Promise<FavoritesApiResponse<FavoriteVo[]>>
 */
export const getFavoriteList = async (categoryId?: number, page?: number, size?: number): Promise<FavoritesApiResponse<FavoriteVo[]>> => {
  try {
    const params = new URLSearchParams()
    if (categoryId !== undefined) {
      params.append('categoryId', categoryId.toString())
    }
    if (page !== undefined) {
      params.append('page', page.toString())
    }
    if (size !== undefined) {
      params.append('size', size.toString())
    }
    const queryString = params.toString()
    const response = await favoritesApi.get(`/user/favorites/list${queryString ? '?' + queryString : ''}`)
    return response.data
  } catch (error: any) {
    console.error('获取收藏列表失败:', error)
    return error
  }
}

/**
 * 根据分类获取收藏
 * @param categoryId 分类ID
 * @returns Promise<FavoritesApiResponse<FavoriteVo[]>>
 */
export const getFavoritesByCategory = async (categoryId: number): Promise<FavoritesApiResponse<FavoriteVo[]>> => {
  try {
    const response = await favoritesApi.get(`/user/favorites/category/${categoryId}`)
    return response.data
  } catch (error: any) {
    console.error('根据分类获取收藏失败:', error)
    return error
  }
}

/**
 * 删除收藏
 * @param id 收藏ID
 * @returns Promise<FavoritesApiResponse<string>>
 */
export const deleteFavorite = async (id: number): Promise<FavoritesApiResponse<string>> => {
  try {
    const response = await favoritesApi.delete(`/user/favorites/delete/${id}`)
    return response.data
  } catch (error: any) {
    console.error('删除收藏失败:', error)
    return error
  }
}