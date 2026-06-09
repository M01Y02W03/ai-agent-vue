import { http } from '../utils/http'

// 开场白VO类型定义
export interface LlmOpeningGreetings {
  id: number
  conversationType: 'chat' | 'rag' | 'tool'
  greetingTitle: string
  greetingContent: string
  toolNames: string | null
  isActive: number
  sortOrder: number
  createTime: string
  updateTime: string
}

// 工具对话会话信息
export interface ToolConversation {
  id: string
  title: string
  isMaxConversation: boolean
  remainingCount: number
  createTime: string
}

// 工具对话记录
export interface ToolRecord {
  id: number
  conversationId: string
  messageType: 'user' | 'assistant'
  content: string
  hasToolCalls: boolean
  toolCallCount: number
  toolsCalledList: string[]
  toolCallSummary: string
  createTime: string
  formattedTime: string
}

// 工具配置信息
export interface ToolConfig {
  id: number
  toolName: string
  toolProvider: string
  toolUrl: string
  officialWebsite: string
  toolDescription: string
  status: number
  statusDesc: string
  createdBy: string
  updatedBy: string
  createTime: string
  updateTime: string
  usageCount: number
}

// 获取工具对话会话列表
export const getToolConversations = () => {
  return http.get<ToolConversation[]>('/history/toolConversations')
}

// 获取指定会话的对话记录
export const getToolRecords = (conversationId: string) => {
  return http.get<ToolRecord[]>('/history/toolRecords', {
    params: { conversationId }
  })
}

// 根据工具名称获取工具配置信息
export const getToolConfigByName = (toolName: string) => {
  return http.get<ToolConfig>(`/tool-config/by-name/${toolName}`)
}

// 发送工具调用请求
export const callAITool = (conversationId: string, userMessage: string) => {
  const formData = new FormData()
  formData.append('userMessage', userMessage)
  
  return fetch(`${__API_BASE_URL__}/ai/tools/${conversationId}`, {
    method: 'POST',
    headers: {
      'token': localStorage.getItem('token') || ''
    },
    body: formData
  })
}

// 生成新的对话ID
export const generateConversationId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

/**
 * 根据对话类型获取开场白列表
 * @param conversationType 对话类型：tool(工具调用)
 * @returns Promise<ApiResponse<LlmOpeningGreetings[]>>
 */
export const getGreetingsByType = (conversationType: 'tool') => {
  return http.get<LlmOpeningGreetings[]>(`/ai/greetings/type/${conversationType}`)
}

// 工具配置管理相关接口类型定义
export interface ToolsConfigVo {
  id: number
  toolName: string
  toolProvider: string
  toolUrl: string
  officialWebsite: string
  toolDescription: string
  status: number
  statusDesc: string
  createdBy: string
  updatedBy: string
  createTime: string
  updateTime: string
  usageCount: number
}

export interface ToolsConfigCreateDto {
  toolName: string
  toolProvider: string
  toolUrl?: string
  officialWebsite?: string
  toolDescription?: string
  status: number
  createdBy?: string
}

export interface ToolsConfigUpdateDto {
  id: number
  toolName?: string
  toolProvider?: string
  toolUrl?: string
  officialWebsite?: string
  toolDescription?: string
  status?: number
  updatedBy?: string
}

export interface ToolsConfigQueryDto {
  page?: number
  pageSize?: number
  toolName?: string
  toolProvider?: string
  status?: number
  createdBy?: string
}

// 工具使用统计相关接口类型定义
export interface DailyUsageVo {
  date: string
  callCount: number
  successCount: number
  failedCount: number
}

export interface HourlyUsageVo {
  hour: number
  callCount: number
  avgResponseTime: number
}

export interface ToolsUsageStatisticsVo {
  toolName: string
  toolProvider?: string
  totalCalls: number
  successCalls: number
  failedCalls: number
  successRate: number
  avgResponseTime: number
  maxResponseTime: number
  minResponseTime: number
  todayCalls: number
  weekCalls: number
  monthCalls: number
  dailyUsage: DailyUsageVo[]
  hourlyUsage: HourlyUsageVo[]
}

export interface ToolsUsageRecordVo {
  id: number
  toolConfigId: number
  toolName: string
  callTime: string
  responseTime: number
  httpStatus: number
  success: boolean
  successDesc: string
  errorMessage: string
  requestParams: string
  callerIp: string
  createTime: string
  toolProvider: string
  toolUrl: string
}

export interface PageResult<T> {
  total: number
  records: T[]
}

// 工具配置相关API
export const toolConfigApi = {
  // 创建工具配置
  create: (data: ToolsConfigCreateDto) => 
    http.post<boolean>('/tool-config', data),

  // 更新工具配置
  update: (data: ToolsConfigUpdateDto) => 
    http.put<boolean>('/tool-config', data),

  // 更新工具状态
  updateStatus: (id: number, status: number) => 
    http.put<boolean>(`/tool-config/${id}/status`, null, { params: { status } }),

  // 获取工具配置详情
  getById: (id: number) => 
    http.get<ToolsConfigVo>(`/tool-config/${id}`),

  // 删除工具配置
  delete: (id: number) => 
    http.delete<boolean>(`/tool-config/${id}`),

  // 分页查询工具配置
  getPage: (params: ToolsConfigQueryDto) => 
    http.get<PageResult<ToolsConfigVo>>('/tool-config/page', { params }),

  // 根据工具名称获取配置
  getByName: (toolName: string) => 
    http.get<ToolsConfigVo>(`/tool-config/by-name/${toolName}`)
}

// 工具使用统计相关API
export const toolUsageApi = {
  // 获取工具使用统计
  getStatistics: (toolName: string) => 
    http.get<ToolsUsageStatisticsVo>(`/tool-usage/statistics/${toolName}`),

  // 获取每小时使用统计
  getHourlyStatistics: (toolName: string) => 
    http.get<HourlyUsageVo[]>(`/tool-usage/statistics/${toolName}/hourly`),

  // 获取每日使用统计
  getDailyStatistics: (toolName: string, days?: number) => 
    http.get<DailyUsageVo[]>(`/tool-usage/statistics/${toolName}/daily`, { 
      params: days ? { days } : undefined 
    }),

  // 获取所有工具使用概览
  getOverview: () => 
    http.get<ToolsUsageStatisticsVo[]>('/tool-usage/statistics/overview'),

  // 分页查询使用记录
  getRecords: (current: number, size: number, toolName?: string) => 
    http.get<PageResult<ToolsUsageRecordVo>>('/tool-usage/records', { 
      params: { current, size, toolName } 
    }),

  // 获取工具使用趋势图数据
  getTrendData: (toolName: string, days?: number) => 
    http.get<DailyUsageVo[]>(`/tool-usage/charts/${toolName}/trend`, { 
      params: days ? { days } : undefined 
    }),

  // 获取每小时分布图数据
  getHourlyDistribution: (toolName: string) => 
    http.get<HourlyUsageVo[]>(`/tool-usage/charts/${toolName}/hourly-distribution`)
}