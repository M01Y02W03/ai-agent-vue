import { createHttpClient } from '../utils/http'
import type { ApiResponse } from '../utils/http'

// 创建Sidebar API专用的HTTP客户端
const sidebarApi = createHttpClient()

// 知识库文档管理接口
export interface LLMDocManagementVO {
  id: number // 知识库ID
  docName: string // 知识库名称
  size: number // 知识库大小(字节)
  docUrl: string // 知识库文件URL
  docCount: number // 当前文档片段总数
  usageScenario: string // 使用场景
  type: string // 文档类型
  createTime: string // 创建时间
  updateTime: string // 更新时间
}

// 待审核文档接口
export interface LLMDocTempVO {
  docName: string // 文档名称
  docType: string // 文档类型
  size: number // 文档大小
  usageScenario: string // 使用场景
  auditStatus: number // 审核状态: 0-待审核, 1-审核通过, 2-审核不通过
  auditComment: string // 审核意见
  createTime: string // 创建时间
}

// 使用统一的API响应类型
export type SidebarApiResponse<T = any> = ApiResponse<T>

// 知识库更新参数接口
export interface DocUpdateParams {
  docId: number // 文档ID
  docName: string // 文档名称
  usageScenario: string // 使用场景
}

// 文档上传参数接口
export interface DocUploadParams {
  modelId: number // 模型ID
  docName: string // 文档名称
  usageScenario: string // 使用场景
  file: File // 文件
}

/**
 * 获取我的文档
 * @returns Promise<SidebarApiResponse<LLMDocManagementVO[]>>
 */
export const getMyDocuments = async (): Promise<SidebarApiResponse<LLMDocManagementVO[]>> => {
  try {
    const response = await sidebarApi.get('/doc/docManagement')
    return response.data
  } catch (error: any) {
    console.error('获取我的文档失败:', error)
    return error
  }
}

/**
 * 知识库更新
 * @param params 更新参数
 * @returns Promise<SidebarApiResponse<string>>
 */
export const updateDocument = async (params: DocUpdateParams): Promise<SidebarApiResponse<string>> => {
  try {
    const response = await sidebarApi.put(`/doc/update/${params.docId}`, null, {
      params: {
        docName: params.docName,
        usageScenario: params.usageScenario
      }
    })
    return response.data
  } catch (error: any) {
    console.error('知识库更新失败:', error)
    return error
  }
}

/**
 * 知识库上传
 * @param params 上传参数
 * @returns Promise<SidebarApiResponse<string>>
 */
export const uploadKnowledgeDocument = async (params: DocUploadParams): Promise<SidebarApiResponse<string>> => {
  try {
    const formData = new FormData()
    formData.append('file', params.file)

    const response = await sidebarApi.post(`/doc/upload/${params.modelId}`, formData, {
      params: {
        docName: params.docName,
        usageScenario: params.usageScenario
      },
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  } catch (error: any) {
    console.error('知识库上传失败:', error)
    return error
  }
}

/**
 * 知识库删除
 * @param docId 文档ID
 * @returns Promise<SidebarApiResponse<string>>
 */
export const deleteKnowledgeDocument = async (docId: number): Promise<SidebarApiResponse<string>> => {
  try {
    const response = await sidebarApi.delete(`/doc/delete/${docId}`)
    return response.data
  } catch (error: any) {
    console.error('知识库删除失败:', error)
    return error
  }
}

/**
 * 获取待审核文档
 * @returns Promise<SidebarApiResponse<LLMDocTempVO[]>>
 */
export const getTempDocuments = async (): Promise<SidebarApiResponse<LLMDocTempVO[]>> => {
  try {
    const response = await sidebarApi.get('/doc/temp')
    return response.data
  } catch (error: any) {
    console.error('获取待审核文档失败:', error)
    return error
  }
}