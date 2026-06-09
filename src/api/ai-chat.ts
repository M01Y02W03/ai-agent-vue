import { createHttpClient, http } from '../utils/http'
import type { ApiResponse } from '../utils/http'

// 创建AI Chat API专用的HTTP客户端
const docQaApi = createHttpClient()

/**
 * 生成36位对话ID
 * @returns string 格式：ff9c9a72096f4113ad7127e0a4413efa
 */
export const generateConversationId = (): string => {
  return 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'.replace(/x/g, () => {
    return (Math.random() * 16 | 0).toString(16)
  })
}

// 知识库问答会话VO类型定义
export interface LLMDocQAConversationsVO {
  id: string
  docId: number
  title: string
  isMaxConversation: boolean
  remainingCount: number
  createTime: string
}

// 知识库问答记录VO类型定义
export interface LLMDocQARecordsVO {
  id: number
  conversationId: string
  modelId: number
  modelName: string
  documentFragment: string | null
  messageType: 'user' | 'assistant'
  content: string
  hasThinkingProcess: boolean
  thinkingContent: string | null
  pureAnswer: string
  createTime: string
  formattedTime: string
}

// 多模态对话会话VO类型定义
export interface LLMChatConversationsVO {
  id: string
  title: string
  isMaxConversation: boolean
  remainingCount: number
  createTime: string
}

// 占位符VO类型定义
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

// 多模态对话记录VO类型定义
export interface LLMChatRecordsVO {
  id: number
  conversationId: string
  modelId: number
  modelName: string
  messageType: 'user' | 'assistant'
  content: string
  isMultimodal: number
  imageUrl: string | null
  createTime: string
  formattedTime: string
}

// Ollama模型VO类型定义
export interface OllamaModelVO {
  id: number
  modelName: string
  description: string
  size: string
  version: string
  provider: string
  contextLength: number
  parameters: string
  isMultimodal: number
  license: string
}



/**
 * 获取文档问答会话列表
 * @returns Promise<ApiResponse<LLMDocQAConversationsVO[]>>
 */
export const getDocQaConversations = () => {
  return docQaApi.get<ApiResponse<LLMDocQAConversationsVO[]>>('/history/docQaConversations')
    .then(response => response.data)
}

/**
 * 获取文档问答记录
 * @param conversationId 会话ID
 * @returns Promise<ApiResponse<LLMDocQARecordsVO[]>>
 */
export const getDocQaRecords = (conversationId: string) => {
  return docQaApi.get<ApiResponse<LLMDocQARecordsVO[]>>('/history/docQaRecords', {
    params: {
      conversationId
    }
  }).then(response => response.data)
}

/**
 * 获取RAG模型列表
 * @returns Promise<ApiResponse<OllamaModelVO[]>>
 */
export const getRagModelList = () => {
  return docQaApi.get<ApiResponse<OllamaModelVO[]>>('/ollamaModel/ragModelList')
    .then(response => response.data)
}

/**
 * 删除文档问答会话
 * @param conversationId 会话ID
 * @returns Promise<ApiResponse<any>>
 */
export const deleteDocQaConversation = (conversationId: string) => {
  return docQaApi.delete<ApiResponse<any>>('/history/delete/docQa', {
    params: {
      conversationId
    }
  }).then(response => response.data)
}

/**
 * 获取多模态对话会话列表
 * @returns Promise<ApiResponse<LLMChatConversationsVO[]>>
 */
export const getChatConversations = () => {
  return docQaApi.get<ApiResponse<LLMChatConversationsVO[]>>('/history/chatConversations')
    .then(response => response.data)
}

/**
 * 获取多模态对话记录
 * @param conversationId 会话ID
 * @returns Promise<ApiResponse<LLMChatRecordsVO[]>>
 */
export const getChatRecords = (conversationId: string) => {
  return docQaApi.get<ApiResponse<LLMChatRecordsVO[]>>('/history/chatRecords', {
    params: {
      conversationId
    }
  }).then(response => response.data)
}

/**
 * 获取多模态模型列表
 * @returns Promise<ApiResponse<OllamaModelVO[]>>
 */
export const getMultiModelList = () => {
  return docQaApi.get<ApiResponse<OllamaModelVO[]>>('/ollamaModel/multiModelList')
    .then(response => response.data)
}

/**
 * 删除多模态对话会话
 * @param conversationId 会话ID
 * @returns Promise<ApiResponse<any>>
 */
export const deleteChatConversation = (conversationId: string) => {
  return docQaApi.delete<ApiResponse<any>>('/history/delete/chat', {
    params: {
      conversationId
    }
  }).then(response => response.data)
}

/**
 * 多模态对话SSE流式请求（支持文本和图片）
 * @param modelId 模型ID
 * @param conversationId 会话ID
 * @param userMessage 用户消息
 * @param image 图片文件（可选）
 * @param onMessage 消息回调函数
 * @param onError 错误回调函数
 * @param onComplete 完成回调函数
 * @returns AbortController
 */
export const multiChatStream = (
  modelId: number,
  conversationId: string,
  userMessage: string,
  image: File | null,
  onMessage: (data: string) => void,
  onError?: (error: any) => void,
  onComplete?: () => void
): AbortController => {
  const token = localStorage.getItem('token')
  
  // 构建URL参数
  const params = new URLSearchParams()
  params.append('userMessage', userMessage)
  
  // 如果有图片，使用FormData进行POST请求
  let body: FormData | null = null
  let headers: Record<string, string> = {
    'Accept': 'text/event-stream',
    'Cache-Control': 'no-cache'
  }
  
  if (image) {
    body = new FormData()
    body.append('userMessage', userMessage)
    body.append('image', image)
    // 不设置Content-Type，让浏览器自动设置multipart/form-data边界
  } else {
    headers['Content-Type'] = 'application/x-www-form-urlencoded'
  }
  
  if (token) {
    headers['token'] = token
  }
  
  const url = `${docQaApi.defaults.baseURL}/ai/chat/${modelId}/${conversationId}`
  
  // 创建AbortController用于取消请求
  const abortController = new AbortController()
  
  fetch(url, {
    method: 'POST',
    headers,
    body: image ? body : new URLSearchParams(params),
    signal: abortController.signal
  })
  .then(async (response) => {
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('userInfo')
        window.location.href = '/login'
        return
      }
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('无法读取响应流')
    }
    
    const decoder = new TextDecoder()
    let buffer = ''
    
    while (true) {
      const { done, value } = await reader.read()
      
      if (done) {
        onComplete && onComplete()
        break
      }
      
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''
      
      for (const line of lines) {
        if (line.startsWith('data:')) {
          const data = line.slice(5) // 去除 'data:' 前缀
          
          if (data === '[DONE]') {
            onComplete && onComplete()
            return
          }
          
          // 传递原始数据给回调函数
          onMessage(data)
        }
      }
    }
  })
  .catch((error) => {
    if (error.name === 'AbortError') {
      console.log('请求被取消')
      return
    }
    console.error('SSE请求错误:', error)
    onError && onError(error)
  })
  
  return abortController
}

/**
 * 根据对话类型获取开场白列表
 * @param conversationType 对话类型：chat(多模态对话)、rag(知识库问答)、tool(工具调用)
 * @returns Promise<ApiResponse<LlmOpeningGreetings[]>>
 */
export const getGreetingsByType = (conversationType: 'chat' | 'rag' | 'tool') => {
  return http.get<LlmOpeningGreetings[]>(`/ai/greetings/type/${conversationType}`)
}

/**
 * 知识库问答SSE流式请求（使用fetch API支持GET请求）
 * @param docId 文档ID
 * @param modelId 模型ID
 * @param conversationId 会话ID
 * @param userMessage 用户消息
 * @param onMessage 消息回调函数
 * @param onError 错误回调函数
 * @param onComplete 完成回调函数
 * @returns AbortController
 */
export const ragQAStream = (
  docId: number,
  modelId: number,
  conversationId: string,
  userMessage: string,
  onMessage: (data: string) => void,
  onError?: (error: any) => void,
  onComplete?: () => void
): AbortController => {
  const token = localStorage.getItem('token')
  
  // 构建URL参数
  const params = new URLSearchParams()
  params.append('userMessage', userMessage)
  const url = `${docQaApi.defaults.baseURL}/ai/rag/${docId}/${modelId}/${conversationId}?${params.toString()}`
  
  // 创建AbortController用于取消请求
  const abortController = new AbortController()
  
  const headers: Record<string, string> = {
    'Accept': 'text/event-stream',
    'Cache-Control': 'no-cache'
  }
  
  if (token) {
    headers['token'] = token
  }
  
  fetch(url, {
    method: 'GET',
    headers,
    signal: abortController.signal
  })
  .then(async (response) => {
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('userInfo')
        window.location.href = '/login'
        return
      }
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('无法读取响应流')
    }
    
    const decoder = new TextDecoder()
    let buffer = ''
    
    while (true) {
      const { done, value } = await reader.read()
      
      if (done) {
        onComplete && onComplete()
        break
      }
      
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''
      
      for (const line of lines) {
        if (line.startsWith('data:')) {
          const data = line.slice(5) // 去除 'data:' 前缀
          
          if (data === '[DONE]') {
            onComplete && onComplete()
            return
          }
          
          // 传递原始数据给回调函数，让Vue组件处理思考过程和回答内容的分离
          onMessage(data)
        }
      }
    }
  })
  .catch((error) => {
    if (error.name === 'AbortError') {
      console.log('请求被取消')
      return
    }
    console.error('SSE请求错误:', error)
    onError && onError(error)
  })
  
  return abortController
}