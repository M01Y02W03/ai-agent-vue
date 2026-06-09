<template>
  <div class="doc-qa-rag-container">
    <!-- 左侧会话列表 -->
    <div :class="['conversation-sidebar', { 'collapsed': sidebarCollapsed }]">
      <div class="sidebar-header">
        <h3 v-if="!sidebarCollapsed">知识库问答</h3>
        <el-button 
          type="text" 
          size="small" 
          @click="toggleSidebar" 
          class="collapse-btn"
          :title="sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'"
        >
          <el-icon><Fold v-if="!sidebarCollapsed" /><Expand v-else /></el-icon>
        </el-button>
      </div>
      
      <div v-if="!sidebarCollapsed" class="conversation-list" v-loading="conversationsLoading" element-loading-background="rgba(255, 255, 255, 0.1)" element-loading-text="加载对话列表中...">
        <div 
          v-for="conversation in conversations" 
          :key="conversation.id"
          :class="['conversation-item', { 'active': selectedConversationId === conversation.id }]"
          @click="selectConversation(conversation.id)"
        >
          <div class="conversation-header">
            <div class="conversation-title">{{ conversation.title }}</div>
            <div class="conversation-actions">
              <!-- 状态显示/删除图标切换 -->
              <div class="status-delete-container">
                <!-- 默认状态显示 -->
                <div class="conversation-status default-status">
                  <span 
                    :class="['status-text', { 'status-danger': conversation.isMaxConversation, 'status-success': !conversation.isMaxConversation }]"
                  >
                    {{ conversation.isMaxConversation ? '会话已达上限' : `剩余${conversation.remainingCount}次问答` }}
                  </span>
                </div>
                <!-- 悬停时的删除按钮 -->
                <div class="delete-button-container">
                  <el-button
                    type="text"
                    size="small"
                    class="hover-delete-btn"
                    @click="deleteConversation(conversation.id, $event)"
                    :title="'删除对话'"
                  >
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
              </div>
            </div>
          </div>
          <div class="conversation-meta">
            <span class="doc-name">文档ID: {{ conversation.docId }}</span>
            <span class="create-time">{{ formatTime(conversation.createTime) }}</span>
          </div>
        </div>
        
        <div v-if="conversations.length === 0" class="empty-state">
          <el-icon size="48" color="#909399"><ChatDotRound /></el-icon>
          <p>暂无对话记录</p>
        </div>
      </div>
      
      <!-- 底部新建对话按钮 -->
      <div class="sidebar-footer" @click="createNewConversation">
          <el-icon><Plus /></el-icon>
          <span v-if="!sidebarCollapsed">新建对话</span>
      </div>
    </div>

    <!-- 右侧对话区域 -->
    <div class="chat-area">
      <!-- 对话记录区域 -->
      <div class="messages-area">
        <div v-if="selectedConversationId" class="messages-container" ref="messagesContainer" v-loading="recordsLoading" element-loading-background="rgba(255, 255, 255, 0.1)" element-loading-text="加载会话记录中...">

          
          <div 
            v-for="record in chatRecords" 
            :key="record.id"
            :class="['message-item', record.messageType]"
          >
            <div class="message-avatar">
              <el-avatar 
                v-if="record.messageType === 'user'" 
                :size="40" 
                :src="userAvatar"
              />
              <el-avatar 
                v-else 
                :size="55" 
                style="background: transparent; border: none;"
              >
                <img src="/src/assets/svg/chatbot.svg" alt="AI" style="width: 42px; height: 35px;" />
              </el-avatar>
            </div>
            
            <div class="message-content">
              <div class="message-header">
                <span class="sender-name">
                  {{ getCorrectModelName(record, chatRecords) }}
                </span>
                <span class="message-time">{{ record.formattedTime }}</span>
              </div>
              
              <div class="message-body">
                <!-- 用户消息 -->
                <div v-if="record.messageType === 'user'" class="user-message">
                  <div v-html="renderMarkdown(record.content || '')" class="markdown-content" :key="record.id + '-user-' + (record.content || '').length + '-' + renderTrigger"></div>
                </div>
                
                <!-- AI回答 -->
                <div v-else class="assistant-message">
                  <!-- 思考过程切换按钮 -->
                  <div v-if="record.hasThinkingProcess" class="thinking-toggle">
                    <el-button 
                      type="text" 
                      size="small" 
                      @click="toggleThinking(record.id)"
                      class="thinking-btn"
                    >
                      {{ showThinking[record.id] ? '隐藏' : '显示' }}思考过程
                    </el-button>
                  </div>
                  
                  <!-- 思考过程内容 -->
                  <div 
                    v-if="record.hasThinkingProcess && showThinking[record.id]" 
                    class="thinking-content"
                    :key="`thinking-${record.id}-${record.thinkingContent || ''}-${renderTrigger}`"
                  >
                    <div class="thinking-text">{{ record.thinkingContent }}</div>
                  </div>
                  
                  <!-- 纯回答内容 -->
                  <div class="answer-content">
                    <!-- AI回答的加载状态 -->
                    <div v-if="shouldShowAILoading(record)" class="ai-loading">
                      <div class="typing-animation">
                        <span class="typing-dot"></span>
                        <span class="typing-dot"></span>
                        <span class="typing-dot"></span>
                      </div>
                      <span class="loading-text">思考中，请稍等...</span>
                    </div>
                    
                    <!-- 实际的回答内容 -->
                    <div v-else v-html="renderMarkdown(record.pureAnswer || '')" class="markdown-content" :key="record.id + '-' + (record.pureAnswer || '').length + '-' + renderTrigger"></div>
                  </div>
                  
                  <!-- 文档片段引用 -->
                  <div v-if="record.documentFragment" class="document-fragment">
                    <div class="fragment-header">
                      <el-icon><Document /></el-icon>
                      <span>引用文档</span>
                    </div>
                    <div class="fragment-content">{{ record.documentFragment }}</div>
                  </div>
                  
                  <!-- 复制按钮 - 显示在AI消息容器内部右下角 -->
                  <div v-if="!shouldShowAILoading(record) && (record.pureAnswer || record.content)" class="copy-button-container">
                    <el-button
                      type="text"
                      size="small"
                      class="copy-btn"
                      @click="copyAIResponse(record)"
                      :title="'复制回答内容'"
                    >
                      <el-icon size="14"><CopyDocument /></el-icon>
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 显示开场白当没有聊天记录时 -->
          <div v-if="chatRecords.length === 0 && !recordsLoading && greetings.length > 0" class="welcome-state">
            <el-icon size="48" color="#909399"><ChatLineRound /></el-icon>
            <h3>{{ greetings[0].greetingTitle }}</h3>
            <div class="greeting-content" v-html="greetings[0].greetingContent"></div>
          </div>
        </div>
        
        <!-- 未选择对话时显示开场白 -->
        <div v-else class="no-conversation-selected">
          <el-icon size="64" color="#C0C4CC"><ChatDotRound /></el-icon>
          <div v-if="greetings.length > 0" class="greeting-placeholder">
            <h3>{{ greetings[0].greetingTitle }}</h3>
            <div class="greeting-content" v-html="greetings[0].greetingContent"></div>
          </div>
        </div>
      </div>
      
      <!-- 输入容器 - 始终显示 -->
      <div class="input-container">
        <!-- 用户输入区域 -->
        <div class="input-header">
          <textarea
            ref="inputTextarea"
            v-model="inputMessage"
            placeholder="输入您的问题..."
            @keydown.ctrl.enter="sendMessage"
            @input="adjustTextareaHeight"
            class="input-textarea"
            rows="1"
          ></textarea>
        </div>
        
        <!-- 选择器和按钮区域 -->
        <div class="input-footer">
          <!-- 模型选择 -->
          <div class="model-selector">
            <el-select
              v-model="selectedModelId"
              placeholder="选择模型"
              class="model-select"
              size="small"
              :loading="modelsLoading"
              loading-text="加载中..."
              no-data-text="暂无模型"
            >
              <el-option
                v-for="model in ragModels"
                :key="model.id"
                :label="model.modelName"
                :value="model.id"
              >
                <div class="model-option">
                  <div class="model-name">{{ model.modelName }}</div>
                  <div class="model-info">{{ model.parameters }} | {{ model.size }}</div>
                </div>
              </el-option>
            </el-select>
          </div>
          
          <!-- 知识库文档选择 -->
          <div class="doc-selector">
            <el-select
              v-model="selectedDocId"
              placeholder="选择对话文档"
              class="doc-select"
              size="small"
              :loading="docsLoading"
              loading-text="加载中..."
              no-data-text="暂无文档"
            >
              <el-option
                v-for="doc in knowledgeDocs"
                :key="doc.id"
                :label="doc.docName"
                :value="doc.id"
              >
                <div class="doc-option">
                  <div class="doc-name">{{ doc.docName }}</div>
                  <div class="doc-info">{{ doc.type }} | {{ formatFileSize(doc.size) }} | {{ doc.docCount }}个片段</div>
                </div>
              </el-option>
            </el-select>
          </div>
          
          <!-- 发送按钮和提示 -->
          <div class="send-area">
            <button
               @click="sendMessage" 
               :disabled="!inputMessage.trim() || !selectedModelId || !selectedDocId || isStreaming"
               class="send-btn"
            >
              <img src="/src/assets/svg/发送.svg" alt="发送" class="send-icon" />
              <span class="tooltip">{{ isStreaming ? '发送中...' : 'Ctrl + Enter 发送' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, reactive, computed, onUnmounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '../../stores/auth'
import MarkdownIt from 'markdown-it'
import DOMPurify from 'dompurify'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.css'
import {
  Plus,
  ChatDotRound,
  ChatLineRound,
  Document,
  Fold,
  Expand,
  Delete,
  CopyDocument
} from '@element-plus/icons-vue'
import {
  getDocQaConversations,
  getDocQaRecords,
  getRagModelList,
  ragQAStream,
  generateConversationId,
  deleteDocQaConversation,
  getGreetingsByType,
  type LLMDocQAConversationsVO,
  type LLMDocQARecordsVO,
  type OllamaModelVO,
  type LlmOpeningGreetings
} from '../../api/ai-chat.ts'
import {
  getMyDocuments,
  type LLMDocManagementVO
} from '../../api/dashboard-sidebar'

// Props定义
interface Props {
  selectedKnowledgeBaseId?: number | null
}

const props = withDefaults(defineProps<Props>(), {
  selectedKnowledgeBaseId: null
})

// 响应式数据
const conversations = ref<LLMDocQAConversationsVO[]>([])
const chatRecords = ref<LLMDocQARecordsVO[]>([])
const ragModels = ref<OllamaModelVO[]>([])
const knowledgeDocs = ref<LLMDocManagementVO[]>([])
const selectedConversationId = ref<string>('')
const selectedModelId = ref<number>()
const selectedDocId = ref<number>()
const inputMessage = ref('')
const showThinking = reactive<Record<number, boolean>>({})



// 侧边栏展开收起状态
const sidebarCollapsed = ref(false)

// 流式响应状态
const isStreaming = ref(false)
const currentStreamingResponse = ref('')
const currentThinkingContent = ref('')

// 开场白相关
const greetings = ref<LlmOpeningGreetings[]>([])
const isNewConversation = ref(false)
const currentAbortController = ref<AbortController | null>(null)
const isInThinkingMode = ref(false)
const renderTrigger = ref(0) // 用于强制重新渲染

// 流式响应会话关联状态
const streamingConversationId = ref<string>('') // 当前正在流式响应的会话ID
const streamingRecordId = ref<number>(0) // 当前正在流式响应的记录ID



// 加载状态
const conversationsLoading = ref(false)
const recordsLoading = ref(false)
const modelsLoading = ref(false)
const docsLoading = ref(false)

// 引用
const messagesContainer = ref<HTMLElement>()
const inputTextarea = ref<HTMLTextAreaElement>()

// 获取认证状态和用户信息
const authStore = useAuthStore()

// 用户头像（从认证store获取）
const userAvatar = computed(() => {
  return authStore.userProfile?.avatar || '/default-avatar.png'
})

// 判断是否应该显示AI加载动画
const shouldShowAILoading = (record: LLMDocQARecordsVO) => {
  return (
    record.messageType === 'assistant' &&
    record.content === '' &&
    isStreaming.value &&
    (
      // 当前记录就是正在流式响应的记录
      record.id === streamingRecordId.value ||
      // 或者当前会话是正在流式响应的会话且这是最后一条AI消息
      (selectedConversationId.value === streamingConversationId.value &&
       record.conversationId === streamingConversationId.value)
    )
  )
}

// 获取正确的模型名称
const getCorrectModelName = (record: LLMDocQARecordsVO, records: LLMDocQARecordsVO[]) => {
  if (record.messageType === 'user') {
    // 返回当前登录用户的用户名
    return authStore.userProfile?.username || '我'
  }
  
  // 如果AI消息有有效的模型名称，直接使用
  if (record.modelName && record.modelName !== '未知模型') {
    return record.modelName
  }
  
  // 否则查找同一会话中最近的用户消息的模型名称
  const userMessages = records.filter(r => 
    r.conversationId === record.conversationId && 
    r.messageType === 'user' && 
    r.modelName && 
    r.modelName !== '未知模型'
  )
  
  if (userMessages.length > 0) {
    // 获取最近的用户消息的模型名称
    const latestUserMessage = userMessages[userMessages.length - 1]
    return latestUserMessage.modelName
  }
  
  return '未知模型'
}

// 复制AI回答内容
const copyAIResponse = async (record: LLMDocQARecordsVO) => {
  try {
    const textToCopy = record.pureAnswer || record.content || ''
    if (!textToCopy.trim()) {
      ElMessage.warning('没有可复制的内容')
      return
    }
    
    // 优先使用现代的 Clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(textToCopy)
      ElMessage.success('已复制到剪贴板')
    } else {
      // 备用方法：使用传统的 document.execCommand
      const textArea = document.createElement('textarea')
      textArea.value = textToCopy
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      
      try {
        const successful = document.execCommand('copy')
        if (successful) {
          ElMessage.success('已复制到剪贴板')
        } else {
          throw new Error('execCommand copy failed')
        }
      } catch (execError) {
        console.error('execCommand复制失败:', execError)
        // 最后的备用方案：提示用户手动复制
        ElMessage.error('自动复制失败，请手动选择文本复制')
      } finally {
        document.body.removeChild(textArea)
      }
    }
  } catch (error) {
    console.error('复制失败:', error)
    ElMessage.error('复制失败，请手动复制')
  }
}

// 初始化markdown-it实例
const md: MarkdownIt = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true,
  highlight: function (str: string, lang: string): string {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return '<pre class="hljs"><code>' +
               hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
               '</code></pre>'
      } catch (__) {}
    }
    return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>'
  }
})

// markdown渲染函数
const renderMarkdown = (text: string): string => {
  if (!text) return ''
  
  try {
    // 渲染markdown并清理HTML
    const html = md.render(text)
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'code', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'a', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr', 'span', 'div'],
      ALLOWED_ATTR: ['href', 'class', 'target', 'rel']
    })
  } catch (error) {
    console.error('Markdown渲染错误:', error)
    return DOMPurify.sanitize(text)
  }
}

/**
 * 处理SSE流式数据，分离思考过程和回答内容
 */
const processStreamData = (data: string, aiRecordId: number, conversationId: string) => {
  // 检查当前是否还在同一个会话中，如果不是则停止更新
  if (selectedConversationId.value !== conversationId) {
    return
  }
  // 跳过空数据
  if (!data || data.trim() === '') {
    return
  }
  
  // 检测是否进入思考模式
  if (data.includes('<think>')) {
    isInThinkingMode.value = true
    // 处理可能在同一数据块中包含<think>标签的情况
    const thinkIndex = data.indexOf('<think>')
    const beforeThink = data.substring(0, thinkIndex)
    const afterThink = data.substring(thinkIndex + 7) // 7是'<think>'的长度
    
    // 如果<think>前面有内容，先处理为正常回答
    if (beforeThink) {
      currentStreamingResponse.value += beforeThink
      
      // 实时更新AI记录的回答内容
      const aiRecordIndex = chatRecords.value.findIndex(r => r.id === aiRecordId)
      if (aiRecordIndex !== -1) {
        Object.assign(chatRecords.value[aiRecordIndex], {
          content: currentStreamingResponse.value,
          pureAnswer: currentStreamingResponse.value
        })
        renderTrigger.value++ // 强制重新渲染
      }
    }
    
    // 重置思考内容并开始累积
    currentThinkingContent.value = afterThink
    return
  }
  
  // 检测是否结束思考模式
  if (data.includes('</think>')) {
    isInThinkingMode.value = false
    // 处理可能在同一数据块中包含</think>标签的情况
    const thinkEndIndex = data.indexOf('</think>')
    const beforeThinkEnd = data.substring(0, thinkEndIndex)
    const afterThinkEnd = data.substring(thinkEndIndex + 8) // 8是'</think>'的长度
    
    // 完成思考内容的累积
    currentThinkingContent.value += beforeThinkEnd
    
    // 更新AI记录的思考过程
    const aiRecordIndex = chatRecords.value.findIndex(r => r.id === aiRecordId)
    if (aiRecordIndex !== -1) {
      Object.assign(chatRecords.value[aiRecordIndex], {
         hasThinkingProcess: true,
         thinkingContent: currentThinkingContent.value
       })
       renderTrigger.value++ // 强制重新渲染
    }
    
    // 重置流式响应内容，开始处理正常回答
    currentStreamingResponse.value = ''
    
    // 如果</think>后面还有内容，作为正常回答处理
    if (afterThinkEnd) {
      currentStreamingResponse.value += afterThinkEnd
    }
    
    // 更新AI记录的回答内容
     if (aiRecordIndex !== -1) {
       Object.assign(chatRecords.value[aiRecordIndex], {
         content: currentStreamingResponse.value,
         pureAnswer: currentStreamingResponse.value
       })
       renderTrigger.value++ // 强制重新渲染
     }
    return
  }
  
  // 正常数据处理
  if (isInThinkingMode.value) {
    // 如果在思考模式中，累积到思考内容
    currentThinkingContent.value += data
    
    // 实时更新AI记录的思考内容
    const aiRecordIndex = chatRecords.value.findIndex(r => r.id === aiRecordId)
    if (aiRecordIndex !== -1) {
      Object.assign(chatRecords.value[aiRecordIndex], {
        hasThinkingProcess: true,
        thinkingContent: currentThinkingContent.value
      })
      renderTrigger.value++ // 强制重新渲染
    }
  } else {
    // 如果不在思考模式，累积到主回答内容
    currentStreamingResponse.value += data
    
    // 实时更新AI记录的回答内容
    const aiRecordIndex = chatRecords.value.findIndex(r => r.id === aiRecordId)
    if (aiRecordIndex !== -1) {
      // 使用Object.assign确保Vue能检测到对象属性的变化
      Object.assign(chatRecords.value[aiRecordIndex], {
        content: currentStreamingResponse.value,
        pureAnswer: currentStreamingResponse.value
      })
      renderTrigger.value++ // 强制重新渲染
    }
  }
}
const loadConversations = async () => {
  conversationsLoading.value = true
  try {
    const result = await getDocQaConversations()
    if (result.success) {
      conversations.value = result.data
    } else {
      ElMessage.error(result.message || '获取对话列表失败')
    }
  } catch (error) {
    console.error('获取对话列表失败:', error)
    ElMessage.error('获取对话列表失败')
  } finally {
    conversationsLoading.value = false
  }
}

const loadChatRecords = async (conversationId: string) => {
  recordsLoading.value = true
  try {
    const result = await getDocQaRecords(conversationId)
    if (result.success) {
      chatRecords.value = result.data
      // 滚动到底部
      await nextTick()
      scrollToBottom()
    } else {
      ElMessage.error(result.message || '获取对话记录失败')
    }
  } catch (error) {
    console.error('获取对话记录失败:', error)
    ElMessage.error('获取对话记录失败')
  } finally {
    recordsLoading.value = false
  }
}

const loadRagModels = async () => {
  modelsLoading.value = true
  try {
    const result = await getRagModelList()
    if (result.success) {
      ragModels.value = result.data
      // 默认选择第一个模型
      if (result.data.length > 0) {
        selectedModelId.value = result.data[0].id
      }
    } else {
      ElMessage.error(result.message || '获取模型列表失败')
    }
  } catch (error) {
    console.error('获取模型列表失败:', error)
    ElMessage.error('获取模型列表失败')
  } finally {
    modelsLoading.value = false
  }
}

const loadKnowledgeDocs = async () => {
  docsLoading.value = true
  try {
    const result = await getMyDocuments()
    if (result.success) {
      knowledgeDocs.value = result.data
      
      // 如果有传入的知识库ID，优先选择该知识库
      if (props.selectedKnowledgeBaseId) {
        const targetDoc = result.data.find(doc => doc.id === props.selectedKnowledgeBaseId)
        if (targetDoc) {
          selectedDocId.value = targetDoc.id
          // 如果传入了特定知识库ID，只显示该知识库
          knowledgeDocs.value = [targetDoc]
        } else {
          // 如果找不到指定的知识库，显示所有知识库并选择第一个
          if (result.data.length > 0) {
            selectedDocId.value = result.data[0].id
          }
        }
      } else {
        // 没有传入知识库ID时，默认选择第一个文档
        if (result.data.length > 0) {
          selectedDocId.value = result.data[0].id
        }
      }
    } else {
      ElMessage.error(result.message || '获取知识库文档失败')
    }
  } catch (error) {
    console.error('获取知识库文档失败:', error)
    ElMessage.error('获取知识库文档失败')
  } finally {
    docsLoading.value = false
  }
}

const loadGreetings = async () => {
  try {
    const response = await getGreetingsByType('rag')
    if (response.success) {
      greetings.value = response.data
    } else {
      console.error('获取开场白失败:', response.message)
    }
  } catch (error) {
    console.error('加载开场白失败:', error)
  }
}

// 加载所有知识库文档（不受selectedKnowledgeBaseId限制）
const loadAllKnowledgeDocs = async () => {
  docsLoading.value = true
  try {
    const result = await getMyDocuments()
    if (result.success) {
      knowledgeDocs.value = result.data
      // 不改变当前选中的文档ID，保持用户的选择
    } else {
      ElMessage.error(result.message || '获取知识库文档失败')
    }
  } catch (error) {
    console.error('获取知识库文档失败:', error)
    ElMessage.error('获取知识库文档失败')
  } finally {
    docsLoading.value = false
  }
}

const selectConversation = (conversationId: string) => {
  selectedConversationId.value = conversationId
  
  // 设置为非新对话状态
  isNewConversation.value = false
  
  // 根据选择的会话同步更新文档ID
  const selectedConversation = conversations.value.find(c => c.id === conversationId)
  if (selectedConversation && selectedConversation.docId) {
    selectedDocId.value = selectedConversation.docId
    
    // 确保选中的文档在下拉列表中可见
    const matchedDoc = knowledgeDocs.value.find(doc => doc.id === selectedConversation.docId)
    if (!matchedDoc) {
      // 如果当前文档列表中没有该文档，重新加载完整的文档列表
      loadAllKnowledgeDocs()
    }
  }
  
  loadChatRecords(conversationId)
  
  // 如果切换到正在流式响应的会话，恢复流式状态显示
  if (streamingConversationId.value === conversationId && isStreaming.value) {
    // 确保AI消息显示等待效果
    nextTick(() => {
      renderTrigger.value++
      scrollToBottom()
    })
  }
}

const createNewConversation = () => {
  // 生成临时对话ID
  const tempId = 'temp_' + Date.now()
  selectedConversationId.value = tempId
  
  // 创建临时对话记录
  const tempConversation: LLMDocQAConversationsVO = {
    id: tempId,
    title: '新对话',
    docId: selectedDocId.value || 0,
    createTime: new Date().toISOString(),
    isMaxConversation: false,
    remainingCount: 15
  }
  
  // 添加到对话列表顶部
  conversations.value.unshift(tempConversation)
  
  // 清空聊天记录
  chatRecords.value = []
  
  // 设置为新对话状态
  isNewConversation.value = true
  
  ElMessage.success('已创建新对话')
}

const sendMessage = async () => {
  // 隐藏开场白
  isNewConversation.value = false
  
  if (!inputMessage.value.trim()) {
    ElMessage.warning('请输入消息内容')
    return
  }
  if (!selectedModelId.value) {
    ElMessage.warning('请选择模型')
    return
  }
  if (!selectedDocId.value) {
    ElMessage.warning('请选择知识库文档')
    return
  }
  
  // 如果正在流式响应中，阻止新的请求
  if (isStreaming.value) {
    ElMessage.warning('请等待当前消息响应完成')
    return
  }
  
  let conversationId = selectedConversationId.value
  
  // 如果是临时对话或没有选择对话，生成36位对话ID
  if (!conversationId || conversationId.startsWith('temp_')) {
    conversationId = generateConversationId()
    selectedConversationId.value = conversationId
    
    // 更新临时对话的ID
    const tempIndex = conversations.value.findIndex(c => c.id.startsWith('temp_'))
    if (tempIndex !== -1) {
      conversations.value[tempIndex].id = conversationId
    }
  }
  
  const userMessage = inputMessage.value.trim()
  const selectedModelInfo = ragModels.value.find(model => model.id === selectedModelId.value)
  
  // 清空输入框
  inputMessage.value = ''
  adjustTextareaHeight()
  
  // 添加用户消息到聊天记录
  const userRecord: LLMDocQARecordsVO = {
    id: Date.now(),
    conversationId,
    modelId: selectedModelId.value!,
    modelName: selectedModelInfo?.modelName || '未知模型',
    documentFragment: null,
    messageType: 'user',
    content: userMessage,
    hasThinkingProcess: false,
    thinkingContent: null,
    pureAnswer: userMessage,
    createTime: new Date().toISOString(),
    formattedTime: new Date().toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  chatRecords.value.push(userRecord)
  
  // 添加AI响应占位符
  const aiRecordId = Date.now() + 1
  const aiRecord: LLMDocQARecordsVO = {
    id: aiRecordId,
    conversationId,
    modelId: selectedModelId.value!,
    modelName: selectedModelInfo?.modelName || '未知模型',
    documentFragment: null,
    messageType: 'assistant',
    content: '',
    hasThinkingProcess: false,
    thinkingContent: null,
    pureAnswer: '',
    createTime: new Date().toISOString(),
    formattedTime: new Date().toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  chatRecords.value.push(aiRecord)
  
  // 滚动到底部
  await nextTick()
  scrollToBottom()
  
  // 开始流式请求
  isStreaming.value = true
  currentStreamingResponse.value = ''
  currentThinkingContent.value = ''
  isInThinkingMode.value = false
  
  // 记录当前流式响应的会话和记录ID
  streamingConversationId.value = conversationId
  streamingRecordId.value = aiRecordId
  
  // 确定要使用的文档ID
  let docIdToUse = selectedDocId.value
  
  // 如果当前会话已存在且有关联的文档ID，优先使用会话的文档ID
  const currentConversation = conversations.value.find(c => c.id === conversationId)
  if (currentConversation && currentConversation.docId) {
    docIdToUse = currentConversation.docId
  }
  
  if (!docIdToUse) {
    ElMessage.warning('请选择知识库文档')
    isStreaming.value = false
    currentStreamingResponse.value = ''
    currentThinkingContent.value = ''
    isInThinkingMode.value = false
    streamingConversationId.value = ''
    streamingRecordId.value = 0
    
    // 移除添加的AI回答占位符
    const aiRecordIndex = chatRecords.value.findIndex(r => r.id === aiRecordId)
    if (aiRecordIndex !== -1) {
      chatRecords.value.splice(aiRecordIndex, 1)
    }
    return
  }
  
  try {
    currentAbortController.value = ragQAStream(
      docIdToUse,
      selectedModelId.value!,
      conversationId,
      userMessage,
      // 消息回调
      (data: string) => {
        // 使用新的数据处理函数
        processStreamData(data, aiRecordId, conversationId)
        
        // 滚动到底部
        nextTick(() => {
          // 只有在当前会话匹配时才滚动
          if (selectedConversationId.value === conversationId) {
            scrollToBottom()
          }
        })
      },
      // 错误回调
      (error: any) => {
        console.error('流式请求错误:', error)
        ElMessage.error('消息发送失败，请重试')
        
        // 移除失败的AI回答
        const aiRecordIndex = chatRecords.value.findIndex(r => r.id === aiRecordId)
        if (aiRecordIndex !== -1) {
          chatRecords.value.splice(aiRecordIndex, 1)
        }
        
        isStreaming.value = false
        currentStreamingResponse.value = ''
        currentThinkingContent.value = ''
        isInThinkingMode.value = false
        currentAbortController.value = null
        
        // 清理流式响应状态
        streamingConversationId.value = ''
        streamingRecordId.value = 0
      },
      // 完成回调
      () => {
        isStreaming.value = false
        currentStreamingResponse.value = ''
        currentThinkingContent.value = ''
        isInThinkingMode.value = false
        currentAbortController.value = null
        
        // 清理流式响应状态
        streamingConversationId.value = ''
        streamingRecordId.value = 0
        
        // 重新加载对话列表和记录（更新服务器数据）
        loadConversations()
      }
    )
  } catch (error) {
    console.error('发送消息失败:', error)
    ElMessage.error('消息发送失败，请重试')
    
    // 移除失败的消息
    const userRecordIndex = chatRecords.value.findIndex(r => r.id === userRecord.id)
    const aiRecordIndex = chatRecords.value.findIndex(r => r.id === aiRecordId)
    if (userRecordIndex !== -1) {
      chatRecords.value.splice(userRecordIndex, 1)
    }
    if (aiRecordIndex !== -1) {
      chatRecords.value.splice(aiRecordIndex, 1)
    }
    
    isStreaming.value = false
    currentStreamingResponse.value = ''
    currentThinkingContent.value = ''
    isInThinkingMode.value = false
    currentAbortController.value = null
    
    // 清理流式响应状态
    streamingConversationId.value = ''
    streamingRecordId.value = 0
  }
}

const toggleThinking = (recordId: number) => {
  showThinking[recordId] = !showThinking[recordId]
}

// 切换侧边栏展开收起
const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

// 删除对话
const deleteConversation = async (conversationId: string, event?: Event) => {
  if (event) {
    event.stopPropagation() // 阻止事件冒泡，避免选中对话
  }
  
  try {
    await ElMessageBox.confirm(
      '确定要删除这个对话吗？删除后无法恢复。',
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    const result = await deleteDocQaConversation(conversationId)
    
    if (result.success) {
      ElMessage.success('对话删除成功')
      
      // 如果删除的是当前选中的对话，清空选中状态和聊天记录
      if (selectedConversationId.value === conversationId) {
        selectedConversationId.value = ''
        chatRecords.value = []
      }
      
      // 重新加载对话列表
      await loadConversations()
    } else {
      ElMessage.error(result.message || '删除对话失败')
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('删除对话失败:', error)
      ElMessage.error('删除对话失败')
    }
  }
}

const formatTime = (timeStr: string) => {
  const date = new Date(timeStr)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const adjustTextareaHeight = () => {
  if (inputTextarea.value) {
    // 重置高度为 auto 以获取真实的 scrollHeight
    inputTextarea.value.style.height = 'auto'
    // 设置最小高度为一行，最大高度为 6 行
    const minHeight = 36 // 一行的高度
    const maxHeight = 144 // 6行的高度
    const scrollHeight = inputTextarea.value.scrollHeight
    
    if (scrollHeight <= minHeight) {
      inputTextarea.value.style.height = minHeight + 'px'
    } else if (scrollHeight >= maxHeight) {
      inputTextarea.value.style.height = maxHeight + 'px'
    } else {
      inputTextarea.value.style.height = scrollHeight + 'px'
    }
  }
}

// 监听props变化
watch(
  () => props.selectedKnowledgeBaseId,
  (newId) => {
    if (newId) {
      // 当传入新的知识库ID时，重新加载知识库文档
      loadKnowledgeDocs()
    }
  },
  { immediate: false }
)

// 生命周期
onMounted(() => {
  loadConversations()
  loadRagModels()
  loadKnowledgeDocs()
  loadGreetings()
  // 初始化输入框高度
  nextTick(() => {
    adjustTextareaHeight()
  })
  

})

// 组件卸载时清理事件监听
onUnmounted(() => {
  
  // 清理流式请求
  if (currentAbortController.value) {
    currentAbortController.value.abort()
    currentAbortController.value = null
  }
  
  // 清理流式响应状态
  streamingConversationId.value = ''
  streamingRecordId.value = 0
})
</script>

<style scoped>
.doc-qa-rag-container {
  display: flex;
  height: 100%;
  background: transparent;
  gap: 10px;
}

/* 左侧会话列表 */
.conversation-sidebar {
  width: 300px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: all 0.3s ease;
}

.conversation-sidebar.collapsed {
  width: 60px;
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 48px;
}

.conversation-sidebar.collapsed .sidebar-header {
  justify-content: center;
  padding: 16px 8px;
}

.sidebar-header h3 {
  margin: 0;
  color: white;
  font-size: 16px;
  font-weight: bold;
}

.collapse-btn {
  color: rgba(255, 255, 255, 0.7);
  padding: 8px;
  min-width: auto;
  height: auto;
  font-size: 20px;
}

.collapse-btn:hover {
  color: rgba(255, 255, 255, 0.9);
  background: rgba(255, 255, 255, 0.1);
}

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  margin-top: auto;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #409EFF;
  transition: background-color 0.3s ease;
}

.sidebar-footer:hover {
  background-color: rgba(64, 158, 255, 0.1);
}

.conversation-sidebar.collapsed .sidebar-footer {
  padding: 16px 8px;
  display: flex;
  justify-content: center;
}

.conversation-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.conversation-item {
  padding: 10px 12px;
  margin-bottom: 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.conversation-item:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(64, 158, 255, 0.3);
}

.conversation-item.active {
  background: rgba(64, 158, 255, 0.2);
  border-color: #409EFF;
}

.conversation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.conversation-title {
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  margin-right: 8px;
}

.conversation-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

/* 状态和删除按钮切换容器 */
.status-delete-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  min-width: 80px;
  height: 24px;
}

/* 默认状态显示 */
.default-status {
  position: absolute;
  top: 0;
  right: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  opacity: 1;
  transition: opacity 0.3s ease;
}

/* 删除按钮容器 */
.delete-button-container {
  position: absolute;
  top: 0;
  right: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  opacity: 0;
  transition: opacity 0.3s ease;
}

/* 悬停时的切换效果 */
.conversation-item:hover .default-status {
  opacity: 0;
}

.conversation-item:hover .delete-button-container {
  opacity: 1;
}

/* 悬停时的删除按钮样式 */
.hover-delete-btn {
  color: #409EFF;
  padding: 4px 8px;
  min-width: auto;
  height: auto;
  border-radius: 4px;
  transition: color 0.3s ease, background 0.3s ease;
  font-size: 16px;
}

.hover-delete-btn:hover {
  color: #66B3FF;
  background: rgba(64, 158, 255, 0.1);
}


.conversation-item:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  color: #F56C6C;
  background: rgba(245, 108, 108, 0.1);
  border-radius: 4px;
}

.conversation-status {
  flex-shrink: 0;
}

.status-text {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 500;
  white-space: nowrap;
}

.status-danger {
  color: #F56C6C;
  background: rgba(245, 108, 108, 0.15);
  border: 1px solid rgba(245, 108, 108, 0.3);
}

.status-success {
  color: #67C23A;
  background: rgba(103, 194, 58, 0.15);
  border: 1px solid rgba(103, 194, 58, 0.3);
}

.conversation-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.doc-name {
  font-size: 12px;
  color: #87CEEB; /* 淡蓝色 */
}

.create-time {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  white-space: nowrap; /* 不换行显示 */
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: rgba(255, 255, 255, 0.6);
}

/* 右侧对话区域 */
.chat-area {
  flex: 1;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.messages-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.message-item {
  display: flex;
  margin-bottom: 16px;
  align-items: flex-start;
  gap: 12px;
  width: 100%;
}

.message-item.user {
  flex-direction: row-reverse;
  justify-content: flex-end;
}

.message-item.assistant {
  justify-content: flex-start;
}

.message-content {
  flex: 1;
  max-width: calc(100% - 60px);
  min-width: 120px;
  overflow: visible;
  display: flex;
  flex-direction: column;
}

.message-item.user .message-content {
  text-align: right;
  margin-left: auto;
}

.message-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.message-item.user .message-header {
  flex-direction: row-reverse;
  gap: 8px;
}

.sender-name {
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
}

.message-time {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.user-message {
  background: rgba(64, 158, 255, 0.2);
  border: 1px solid rgba(64, 158, 255, 0.3);
  padding: 12px 16px;
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.9);
  word-wrap: break-word;
  display: inline-block;
  max-width: 60%;
  width: auto;
  box-sizing: border-box;
  overflow-wrap: break-word;
  word-break: break-word;
}

.assistant-message {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 12px 16px;
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.9);
  display: inline-block;
  max-width: 60%;
  width: auto;
  min-width: 200px;
  box-sizing: border-box;
  overflow-wrap: break-word;
  word-wrap: break-word;
  word-break: break-word;
  position: relative; /* 为绝对定位的复制按钮提供定位上下文 */
}

.thinking-toggle {
  margin-bottom: 12px;
}

.thinking-btn {
  color: #409EFF;
  padding: 0;
}

.thinking-content {
  border-left: 4px solid rgba(73, 66, 66, 0.6);
  padding-left: 16px;
  margin: 12px 0;
  background: transparent;
}



.thinking-text {
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  font-style: italic;
  word-wrap: break-word;
  overflow-wrap: break-word;
  word-break: break-word;
  max-width: 100%;
}

.answer-content {
  line-height: 1.6;
  word-wrap: break-word;
  overflow-wrap: break-word;
  word-break: break-word;
  max-width: 100%;
  overflow-x: auto;
}

.document-fragment {
  margin-top: 12px;
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.2);
  border-radius: 8px;
  padding: 12px;
}

.fragment-header {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #22C55E;
  font-weight: 500;
  margin-bottom: 8px;
}

.fragment-content {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  line-height: 1.5;
}

.empty-messages {
  text-align: center;
  padding: 60px 20px;
  color: rgba(255, 255, 255, 0.6);
}

/* 自定义下拉列表样式 - 优化版本 */
.model-selector,
.doc-selector {
  position: relative;
  width: 160px;
}

.doc-selector {
  width: 180px;
}

/* Element Plus 下拉列表样式 */
.model-select,
.doc-select {
  width: 100%;
}

/* 自定义模型选择样式 */
.model-select :deep(.el-select__wrapper),
.doc-select :deep(.el-select__wrapper) {
  background: rgba(64, 158, 255, 0.1) !important;
  border: 1px solid rgba(64, 158, 255, 0.2) !important;
  box-shadow: none !important;
  height: 36px !important;
  position: relative !important;
}

.model-select :deep(.el-select__wrapper:hover),
.doc-select :deep(.el-select__wrapper:hover) {
  border-color: rgba(64, 158, 255, 0.4) !important;
}

.model-select :deep(.el-select__wrapper.is-focused),
.doc-select :deep(.el-select__wrapper.is-focused) {
  border-color: rgba(64, 158, 255, 0.6) !important;
}

.model-select :deep(.el-input__inner),
.doc-select :deep(.el-input__inner) {
  color: rgba(255, 255, 255, 0.9) !important;
  background: transparent !important;
  height: 36px !important;
  line-height: 36px !important;
}

.model-select :deep(.el-select__caret),
.doc-select :deep(.el-select__caret) {
  color: rgba(255, 255, 255, 0.6) !important;
  margin-top: 0 !important;
  transform: translateY(-50%) !important;
  top: 50% !important;
  position: absolute !important;
  right: 8px !important;
}

.model-select :deep(.el-select__placeholder),
.doc-select :deep(.el-select__placeholder) {
  color: rgba(255, 255, 255, 0.6) !important;
  line-height: 36px !important;
}

/* 控制下拉面板宽度 */
.model-select :deep(.el-select-dropdown),
.doc-select :deep(.el-select-dropdown) {
  min-width: 140px !important;
}

.model-select :deep(.el-select-dropdown__item),
.doc-select :deep(.el-select-dropdown__item) {
  padding: 8px 12px !important;
}

.model-option,
.doc-option {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.model-name,
.doc-name {
  color: #4b3e3e;
  font-weight: 500;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
}

.model-info,
.doc-info {
  color: #666666;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-top: 2px;
  width: 100%;
}



/* Markdown内容样式 */
.markdown-content {
  line-height: 1.6;
  color: inherit;
  max-width: 100%;
  overflow-wrap: break-word;
  word-wrap: break-word;
  word-break: break-word;
}

.markdown-content h1,
.markdown-content h2,
.markdown-content h3,
.markdown-content h4,
.markdown-content h5,
.markdown-content h6 {
  color: rgba(255, 255, 255, 0.95);
  margin: 16px 0 8px 0;
  font-weight: 600;
}

.markdown-content h1 { font-size: 1.5em; }
.markdown-content h2 { font-size: 1.3em; }
.markdown-content h3 { font-size: 1.1em; }
.markdown-content h4,
.markdown-content h5,
.markdown-content h6 { font-size: 1em; }

.markdown-content p {
  margin: 8px 0;
  line-height: 1.6;
}

.markdown-content ul,
.markdown-content ol {
  margin: 8px 0;
  padding-left: 20px;
}

.markdown-content li {
  margin: 4px 0;
  line-height: 1.5;
}

.markdown-content blockquote {
  border-left: 4px solid rgba(64, 158, 255, 0.6);
  padding-left: 16px;
  margin: 12px 0;
  color: rgba(255, 255, 255, 0.8);
  font-style: italic;
  background: rgba(255, 255, 255, 0.02);
}

.markdown-content code {
  background: rgba(0, 0, 0, 0.3);
  color: #ff6b6b;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 0.9em;
}

.markdown-content pre {
  background: rgba(0, 0, 0, 0.4);
  padding: 12px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 12px 0;
  border: 1px solid rgba(255, 255, 255, 0.1);
  max-width: 100%;
  box-sizing: border-box;
}

.markdown-content pre code {
  background: transparent;
  color: rgba(255, 255, 255, 0.9);
  padding: 0;
  border-radius: 0;
  white-space: pre;
  word-wrap: normal;
  overflow-wrap: normal;
}

/* highlight.js 代码高亮样式优化 */
.markdown-content .hljs {
  background: rgba(0, 0, 0, 0.4) !important;
  color: rgba(255, 255, 255, 0.9) !important;
  padding: 12px;
  border-radius: 8px;
  overflow-x: auto;
  max-width: 100%;
  box-sizing: border-box;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 0.9em;
  line-height: 1.4;
}

.markdown-content .hljs code {
  background: transparent !important;
  padding: 0 !important;
  border-radius: 0 !important;
  color: inherit !important;
}

.markdown-content table {
  border-collapse: collapse;
  width: 100%;
  margin: 12px 0;
  max-width: 100%;
  overflow-x: auto;
  display: block;
  white-space: nowrap;
}

.markdown-content table tbody,
.markdown-content table thead {
  display: table;
  width: 100%;
}

.markdown-content th,
.markdown-content td {
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 8px 12px;
  text-align: left;
}

.markdown-content th {
  background: rgba(64, 158, 255, 0.2);
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
}

.markdown-content tr:nth-child(even) {
  background: rgba(255, 255, 255, 0.02);
}

.markdown-content a {
  color: #409EFF;
  text-decoration: none;
  transition: color 0.3s ease;
}

.markdown-content a:hover {
  color: #66B3FF;
  text-decoration: underline;
}

.markdown-content strong {
  color: rgba(255, 255, 255, 0.95);
  font-weight: 600;
}

.markdown-content em {
  color: rgba(255, 255, 255, 0.8);
  font-style: italic;
}

.markdown-content hr {
  border: none;
  height: 1px;
  background: rgba(255, 255, 255, 0.2);
  margin: 20px 0;
}

.input-container {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 12px;
  margin: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.input-header {
  width: 100%;
}

.input-textarea {
  width: 100%;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.9);
  resize: none;
  font-size: 14px;
  line-height: 1.5;
  outline: none;
  font-family: inherit;
  min-height: 36px;
  max-height: 144px;
  overflow-y: auto;
  transition: height 0.2s ease;
}

.input-textarea::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.input-footer {
  display: flex;
  align-items: flex-end;
  gap: 16px;
  flex-wrap: wrap;
}

.send-area {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-left: auto;
}

.send-btn {
  background: transparent;
  border: none;
  border-radius: 6px;
  padding: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 48px;
  height: 48px;
  position: relative;
}

.send-btn:hover:not(:disabled) {
  background: rgba(64, 158, 255, 0.1);
  transform: scale(1.05);
}

.send-btn:disabled {
  cursor: not-allowed;
  opacity: 0.3;
}

.send-icon {
  width: 32px;
  height: 32px;
  transition: transform 0.3s ease;
}

.send-btn:hover:not(:disabled) .send-icon {
  transform: scale(1.1);
}

/* Tooltip 样式 */
.tooltip {
  position: absolute;
  top: -35px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
  z-index: 1000;
}

.tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 4px solid transparent;
  border-top-color: rgba(0, 0, 0, 0.8);
}

.send-btn:hover .tooltip {
  opacity: 1;
}

/* 未选择对话时的占位内容 */
.no-conversation-selected {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  text-align: center;
  color: rgba(255, 255, 255, 0.6);
}

.no-conversation-selected h3 {
  margin: 16px 0 8px 0;
  color: rgba(255, 255, 255, 0.8);
}

.no-conversation-selected p {
  margin: 0;
  font-size: 14px;
}

.greeting-placeholder {
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
}

.greeting-placeholder h3 {
  margin: 16px 0 8px 0;
  color: rgba(255, 255, 255, 0.9);
  font-size: 18px;
}

.greeting-content {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.7);
}

/* 欢迎状态样式 - 当有对话但没有聊天记录时 */
.welcome-state {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  text-align: center;
  color: rgba(255, 255, 255, 0.6);
}

.welcome-state h3 {
  margin: 16px 0 8px 0;
  color: rgba(255, 255, 255, 0.9);
  font-size: 18px;
}

.welcome-state .greeting-content {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.7);
}

/* 滚动条样式 */
.conversation-list::-webkit-scrollbar,
.messages-container::-webkit-scrollbar,
.markdown-content pre::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.conversation-list::-webkit-scrollbar-track,
.messages-container::-webkit-scrollbar-track,
.markdown-content pre::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.conversation-list::-webkit-scrollbar-thumb,
.messages-container::-webkit-scrollbar-thumb,
.markdown-content pre::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.conversation-list::-webkit-scrollbar-thumb:hover,
.messages-container::-webkit-scrollbar-thumb:hover,
.markdown-content pre::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

/* 优化长文本渲染性能 */
.markdown-content {
  contain: layout style;
  will-change: auto;
}

/* AI加载等待效果 */
.ai-loading {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 0;
  color: rgba(255, 255, 255, 0.7);
}

.typing-animation {
  display: flex;
  gap: 4px;
  align-items: center;
}

.typing-dot {
  width: 8px;
  height: 8px;
  background: rgba(64, 158, 255, 0.8);
  border-radius: 50%;
  animation: typing 1.4s infinite;
  box-shadow: 0 0 6px rgba(64, 158, 255, 0.3);
}

.typing-dot:nth-child(1) {
  animation-delay: 0s;
}

.typing-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.7;
  }
  30% {
    transform: translateY(-10px);
    opacity: 1;
    box-shadow: 0 0 12px rgba(64, 158, 255, 0.6);
  }
}

.ai-loading .loading-text {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  font-style: italic;
  animation: fadeInOut 2s infinite;
}

@keyframes fadeInOut {
  0%, 100% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
}

/* 复制按钮样式 */
.copy-button-container {
  position: absolute;
  bottom: 8px;
  right: 8px;
  display: flex;
  justify-content: flex-end;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.assistant-message:hover .copy-button-container {
  opacity: 1;
}

.copy-btn {
  background: rgba(255, 255, 255, 0.1) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  border-radius: 6px !important;
  padding: 4px 8px !important;
  color: rgba(255, 255, 255, 0.7) !important;
  transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease !important;
  min-height: 28px !important;
}

.copy-btn:hover {
  background: rgba(64, 158, 255, 0.2) !important;
  border-color: rgba(64, 158, 255, 0.4) !important;
  color: rgba(255, 255, 255, 0.9) !important;
}

.copy-btn:active {
  background: rgba(64, 158, 255, 0.3) !important;
}

/* 响应式设计优化 */
@media (max-width: 768px) {
  .message-content {
    max-width: calc(100% - 50px);
  }
  
  .markdown-content table {
    font-size: 12px;
  }
  
  .markdown-content pre,
  .markdown-content .hljs {
    font-size: 12px;
    padding: 8px;
  }
  
  .ai-loading {
    padding: 12px 0;
  }
  
  .ai-loading .loading-text {
    font-size: 12px;
  }
  
  .copy-btn {
    min-height: 24px !important;
    padding: 2px 6px !important;
  }
}

/* 自定义 loading 组件样式 */
:deep(.el-loading-mask) {
  background-color: rgba(255, 255, 255, 0.1) !important;
  backdrop-filter: blur(8px);
}

:deep(.el-loading-spinner) {
  color: rgba(255, 255, 255, 0.8) !important;
}

:deep(.el-loading-text) {
  color: rgba(255, 255, 255, 0.8) !important;
  font-size: 14px;
}
</style>