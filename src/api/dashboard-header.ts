import { createHttpClient } from '../utils/http'
import type { ApiResponse } from '../utils/http'

// 创建Dashboard API专用的HTTP客户端
const dashboardApi = createHttpClient()

// Ollama模型管理接口
export interface OllamaModelManagement {
  id: number
  type: string // 模型类型(multi/embedding等)
  modelName: string // 模型名称(如gemma3:4b)
  logoUrl: string // 模型logo
  description: string // 模型描述
  size: string // 模型大小
  version: string // 模型版本
  provider: string // 模型提供商
  contextLength: number // 上下文长度(tokens)
  parameters: string // 参数量(如4B/7B)
  isMultimodal: number // 是否支持多模态(0-否 1-是)
  license: string // 许可协议
  creator: string // 创建人
  createTime: string // 创建时间
  updateTime: string // 更新时间
  status: number // 状态(0-启用 1-禁用)
}

// 分页结果接口
export interface PageResult<T = any> {
  total: number
  records: T[]
}

// 使用统一的API响应类型
export type DashboardApiResponse<T = any> = ApiResponse<T>

// 分页查询参数接口
export interface PageQueryParams {
  page: number // 页码
  size: number // 每页记录数
}

// 条件查询参数接口
export interface ModelQueryParams {
  type?: string // 模型类型
  modelName?: string // 模型名称
  isMultimodal?: number // 是否支持多模态
}

// 编辑模型数据传输对象接口
export interface OllamaModelDTO {
  id?: number // 模型ID
  type: string // 模型类型(multi/embedding等)
  modelName: string // 模型名称(如gemma3:4b)
  logoUrl?: string // 模型LogoUrl
  description?: string // 模型描述
  size?: string // 模型大小
  version?: string // 模型版本
  provider?: string // 模型提供商
  contextLength?: number // 上下文长度(tokens)
  parameters?: string // 参数量(如4B/7B)
  isMultimodal?: number // 是否支持多模态(0-否 1-是)
  license?: string // 许可协议
  creator?: string // 创建人
  status?: number // 状态(0-启用 1-禁用)
}

// 待办事项接口
export interface PendingOrder {
  id: number // 主键
  serviceId: number // 业务ID
  serviceName: string // 业务名称
  title: string // 标题
  orderDesc: string // 待办描述
  createTime: string // 创建时间
  updateTime: string // 更新时间
  createUser: string // 创建人
  createUserId: number // 创建人ID
  dealUser: string // 处理人
  dealUserId: number // 处理人ID
  level: number // 0-高，1-中，2-低
  dealStatus: number // 0-待处理，1-已处理
  dealResult: string // 处理结果
  dealRole: number // 处理角色：0-管理员；1-普通用户
  approvalResult: number // 审批结果：0-通过；1-不通过
  createUserEmail: string // 创建人邮箱
}

// 审核参数接口
export interface ApprovalParams {
  pendingOrderId: number // 待办ID
  approvalResult: number // 审批结果：0-通过；1-不通过
  comment?: string // 审核意见
}

// 提交作者信息接口
export interface CommitAuthor {
  name: string // 作者名称
  date: string // 作者提交日期
  email: string // 作者邮箱
}

// 代码提交记录接口
export interface CodeCommit {
  id: string // 提交ID(SHA值)
  author: CommitAuthor // 提交作者信息
  message: string // 提交信息
}

// 待办列表响应接口
export interface PendingListResponse {
  pendingOrders: PendingOrder[] // 待办订单列表
  count: number // 待办数量
}

// 审核历史响应接口
export interface ApprovalHistoryResponse {
  pendingOrders: PendingOrder[] // 审核历史列表
  count: number // 历史记录数量
}

/**
 * 分页查询模型列表
 * @param params 分页参数
 * @returns Promise<DashboardApiResponse<PageResult<OllamaModelManagement>>>
 */
export const getModelListByPage = async (params: PageQueryParams): Promise<DashboardApiResponse<PageResult<OllamaModelManagement>>> => {
  try {
    const response = await dashboardApi.get('/admin/ollama/page', {
      params: {
        page: params.page,
        pageSize: params.size
      }
    })
    return response.data
  } catch (error: any) {
    console.error('分页查询模型列表失败:', error)
    return error
  }
}

/**
 * 条件查询模型列表
 * @param params 查询条件
 * @returns Promise<DashboardApiResponse<OllamaModelManagement[]>>
 */
export const queryModelList = async (params: ModelQueryParams): Promise<DashboardApiResponse<OllamaModelManagement[]>> => {
  try {
    const response = await dashboardApi.get('/admin/ollama/query', {
      params: {
        type: params.type,
        modelName: params.modelName,
        isMultimodal: params.isMultimodal
      }
    })
    return response.data
  } catch (error: any) {
    console.error('条件查询模型列表失败:', error)
    return error
  }
}

/**
 * 删除模型
 * @param modelId 模型ID
 * @returns Promise<DashboardApiResponse<string>>
 */
export const deleteModel = async (modelId: number): Promise<DashboardApiResponse<string>> => {
  try {
    const response = await dashboardApi.delete(`/admin/ollama/delete/${modelId}`)
    return response.data
  } catch (error: any) {
    console.error('删除模型失败:', error)
    return error
  }
}

/**
 * 上传模型logo
 * @param logoFile logo文件
 * @returns Promise<DashboardApiResponse<string>>
 */
export const uploadModelLogo = async (logoFile: File): Promise<DashboardApiResponse<string>> => {
  try {
    const formData = new FormData()
    formData.append('logo', logoFile)
    
    const response = await dashboardApi.post('/admin/ollama/uploadLogo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  } catch (error: any) {
    console.error('上传模型logo失败:', error)
    return error
  }
}

/**
 * 编辑模型
 * @param modelData 模型数据
 * @returns Promise<DashboardApiResponse<string>>
 */
export const editModel = async (modelData: OllamaModelDTO): Promise<DashboardApiResponse<string>> => {
  try {
    const response = await dashboardApi.put('/admin/ollama/edit', modelData)
    return response.data
  } catch (error: any) {
    console.error('编辑模型失败:', error)
    return error
  }
}

/**
 * 添加模型
 * @param modelData 模型数据
 * @returns Promise<DashboardApiResponse<string>>
 */
export const addModel = async (modelData: OllamaModelDTO): Promise<DashboardApiResponse<string>> => {
  try {
    const response = await dashboardApi.post('/admin/ollama/add', modelData)
    return response.data
  } catch (error: any) {
    console.error('添加模型失败:', error)
    return error
  }
}

/**
 * 获取待办列表
 * @returns Promise<DashboardApiResponse<PendingListResponse>>
 */
export const getPendingList = async (): Promise<DashboardApiResponse<PendingListResponse>> => {
  try {
    const response = await dashboardApi.get('/admin/approval/pending')
    return response.data
  } catch (error: any) {
    console.error('获取待办列表失败:', error)
    return error
  }
}

/**
 * 获取审核历史
 * @returns Promise<DashboardApiResponse<ApprovalHistoryResponse>>
 */
export const getApprovalHistory = async (): Promise<DashboardApiResponse<ApprovalHistoryResponse>> => {
  try {
    const response = await dashboardApi.get('/admin/approval/history')
    return response.data
  } catch (error: any) {
    console.error('获取审核历史失败:', error)
    return error
  }
}

/**
 * 审核文档
 * @param params 审核参数
 * @returns Promise<DashboardApiResponse<string>>
 */
export const approveDocument = async (params: ApprovalParams): Promise<DashboardApiResponse<string>> => {
  try {
    const response = await dashboardApi.post('/admin/approval', null, {
      params: {
        pendingOrderId: params.pendingOrderId,
        approvalResult: params.approvalResult,
        comment: params.comment
      }
    })
    return response.data
  } catch (error: any) {
    console.error('审核文档失败:', error)
    return error
  }
}

/**
 * 获取指定仓库的提交记录
 * @param repoId 仓库ID
 * @returns Promise<DashboardApiResponse<CodeCommit[]>>
 */
export const getCommits = async (repoId: number): Promise<DashboardApiResponse<CodeCommit[]>> => {
  try {
    const response = await dashboardApi.get('/home/commits', {
      params: {
        repoId: repoId
      }
    })
    return response.data
  } catch (error: any) {
    console.error('获取提交记录失败:', error)
    return error
  }
}

// 知识库文档管理接口
export interface LLMDocManagement {
  id: number // 知识库ID
  userId: number // 创建用户ID
  collectionId: string // 关联向量数据的集合ID
  modelId: number // 向量模型ID
  docName: string // 知识库名称
  size: number // 知识库大小(字节)
  docUrl: string // 知识库文件URL
  docCount: number // 当前文档片段总数
  usageScenario: string // 使用场景
  type: string // 文档类型
  createTime: string // 创建时间
  updateTime: string // 更新时间
}

/**
 * 获取知识库文档列表
 * @returns Promise<DashboardApiResponse<LLMDocManagement[]>>
 */
export const getDocumentList = async (): Promise<DashboardApiResponse<LLMDocManagement[]>> => {
  try {
    const response = await dashboardApi.get('/admin/docManagement/list')
    return response.data
  } catch (error: any) {
    console.error('获取知识库文档列表失败:', error)
    return error
  }
}

/**
 * 删除知识库文档
 * @param userId 用户ID
 * @param docId 文档ID
 * @returns Promise<DashboardApiResponse<string>>
 */
export const deleteDocument = async (userId: number, docId: number): Promise<DashboardApiResponse<string>> => {
  try {
    const response = await dashboardApi.delete(`/admin/docManagement/delete/${userId}/${docId}`)
    return response.data
  } catch (error: any) {
    console.error('删除知识库文档失败:', error)
    return error
  }
}

// 嵌入模型接口
export interface OllamaModelVO {
  id: number // 模型ID
  modelName: string // 模型名称(如gemma3:4b)
  description: string // 模型描述
  size: string // 模型大小
  version: string // 模型版本
  provider: string // 模型提供商
  contextLength: number // 上下文长度(tokens)
  parameters: string // 参数量(如4B/7B)
  isMultimodal: number // 是否支持多模态(0-否 1-是)
  license: string // 许可协议
}

// 文档上传参数接口
export interface DocumentUploadParams {
  modelId: number // 模型ID
  docName: string // 文档名称
  usageScenario: string // 使用场景
  file: File // 文件
}

// 数据视图接口
export interface DataViewVO {
  chatCount: number // 模型对话次数
  docCount: number // 知识库文档数
  modelCount: number // 可使用的模型数
  detectCount: number // 检测记录数
}

// 系统用户接口
export interface SysUser {
  id: number // 用户ID
  username: string // 用户名
  password?: string // 密码
  email: string // 邮箱
  avatar: string // 头像
  mainRoleId: number // 角色 0-管理员 1-普通用户
  status: number // 账号状态 0-正常 1-异常
  location: string | null // 用户位置信息
  loginIp: string // 登录IP地址
  loginDevice: string // 登录设备信息
  registerTime: string // 注册时间
  lastLoginTime: string // 最近登录时间
}

// 用户多条件查询参数接口
export interface UserMultiQueryParams {
  usernameOrEmail?: string // 用户名或邮箱
  mainRoleId?: number // 角色
  status?: number // 状态
}

/**
 * 获取嵌入模型列表
 * @returns Promise<DashboardApiResponse<OllamaModelVO[]>>
 */
export const getEmbeddingModelList = async (): Promise<DashboardApiResponse<OllamaModelVO[]>> => {
  try {
    const response = await dashboardApi.get('/ollamaModel/embeddingModelList')
    return response.data
  } catch (error: any) {
    console.error('获取嵌入模型列表失败:', error)
    return error
  }
}

/**
 * 上传知识库文档
 * @param params 上传参数
 * @returns Promise<DashboardApiResponse<string>>
 */
export const uploadDocument = async (params: DocumentUploadParams): Promise<DashboardApiResponse<string>> => {
  try {
    const formData = new FormData()
    formData.append('file', params.file)
    
    const response = await dashboardApi.post(`/doc/upload/${params.modelId}`, formData, {
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
    console.error('上传知识库文档失败:', error)
    return error
  }
}

/**
 * 获取所有用户列表
 * @returns Promise<DashboardApiResponse<SysUser[]>>
 */
export const getAllUsers = async (): Promise<DashboardApiResponse<SysUser[]>> => {
  try {
    const response = await dashboardApi.get('/admin/user')
    return response.data
  } catch (error: any) {
    console.error('获取用户列表失败:', error)
    return error
  }
}

/**
 * 多条件查询用户
 * @param params 查询参数
 * @returns Promise<DashboardApiResponse<SysUser[]>>
 */
export const queryUsers = async (params: UserMultiQueryParams): Promise<DashboardApiResponse<SysUser[]>> => {
  try {
    const response = await dashboardApi.get('/admin/user/multi-query', {
      params: {
        usernameOrEmail: params.usernameOrEmail,
        mainRoleId: params.mainRoleId,
        status: params.status
      }
    })
    return response.data
  } catch (error: any) {
    console.error('多条件查询用户失败:', error)
    return error
  }
}

/**
 * 删除用户
 * @param userId 用户ID
 * @returns Promise<DashboardApiResponse<string>>
 */
export const deleteUser = async (userId: number): Promise<DashboardApiResponse<string>> => {
  try {
    const response = await dashboardApi.delete(`/admin/user/delete/${userId}`)
    return response.data
  } catch (error: any) {
    console.error('删除用户失败:', error)
    return error
  }
}

/**
 * 获取数据视图
 * @returns Promise<DashboardApiResponse<DataViewVO>>
 */
export const getDataView = async (): Promise<DashboardApiResponse<DataViewVO>> => {
  try {
    const response = await dashboardApi.get('/admin/approval/dataView')
    return response.data
  } catch (error: any) {
    console.error('获取数据视图失败:', error)
    return error
  }
}

/**
 * 切换用户状态
 * @param userId 用户ID
 * @param status 新状态
 * @returns Promise<DashboardApiResponse<string>>
 */
export const toggleUserStatus = async (userId: number, status: number): Promise<DashboardApiResponse<string>> => {
  try {
    const response = await dashboardApi.put(`/admin/user/status/${userId}`, null, {
      params: { status }
    })
    return response.data
  } catch (error: any) {
    console.error('切换用户状态失败:', error)
    return error
  }
}