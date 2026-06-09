<template>
  <div class="multi-chat-container">
    <!-- 侧边栏会话管理 -->
    <div class="chat-sidebar" :class="{ 'collapsed': isSidebarCollapsed }">
      <div class="sidebar-header">
        <h3>对话列表</h3>
        <el-button
            type="text"
            size="small"
            @click="toggleSidebar"
            class="collapse-btn"
        >
          <el-icon>
            <Expand v-if="isSidebarCollapsed"/>
            <Fold v-else/>
          </el-icon>
        </el-button>
      </div>

      <div class="conversation-list">
        <div
            v-for="conversation in conversations"
            :key="conversation.id"
            :class="['conversation-item', { 'active': currentConversationId === conversation.id }]"
            @click="selectConversation(conversation.id)"
        >
          <div class="conversation-content">
            <div class="conversation-title">{{ conversation.title }}</div>
            <div class="conversation-meta">
              <span class="conversation-time">{{ conversation.createTime }}</span>
              <span class="remaining-count" :class="{ 'max-reached': conversation.isMaxConversation }">
                 对话剩余 {{ conversation.remainingCount }} 次
               </span>
            </div>
          </div>
          <el-button
              type="danger"
              size="small"
              text
              @click.stop="deleteConversation(conversation.id)"
              class="delete-btn"
          >
            <el-icon>
              <Delete/>
            </el-icon>
          </el-button>
        </div>
      </div>
      <div class="sidebar-footer" @click="createNewConversation">
        <el-icon>
          <Plus/>
        </el-icon>
        <span>新建对话</span>
      </div>
    </div>

    <!-- 右侧聊天区域 -->
    <div class="chat-main">
      <!-- 聊天记录展示区域 -->
      <div class="chat-messages" ref="messagesContainer">
        <div v-if="!currentConversationId || chatRecords.length === 0" class="empty-state">
          <div class="empty-icon">
            <img src="/src/assets/svg/chatbot.svg" alt="AI" class="ai-icon"/>
          </div>
          <!-- 显示开场白 -->
          <div v-if="greetings.length > 0">
            <div 
              v-for="greeting in greetings" 
              :key="greeting.id" 
              class="greeting-placeholder"
            >
              <h3>{{ greeting.greetingTitle }}</h3>
              <div class="greeting-content" v-html="formatMessage(greeting.greetingContent)"></div>
            </div>
          </div>
        </div>

        <div v-else>

          <div
              v-for="message in chatRecords"
              :key="message.id"
              :class="['message-item', message.messageType]"
          >
            <div class="message-avatar">
              <img
                  v-if="message.messageType === 'assistant'"
                  src="/src/assets/svg/chatbot.svg"
                  alt="AI"
                  class="ai-avatar"
              />
              <el-avatar
                  v-else
                  :size="32"
                  :src="userAvatar"
                  class="user-avatar"
              />
            </div>
            <div class="message-content">
              <div class="message-header">
                <template v-if="message.messageType === 'user'">
                  <span class="message-time">{{ message.formattedTime }}</span>
                  <span class="message-sender">{{ userName }}</span>
                </template>
                <template v-else>
                  <span class="message-sender">{{ getModelNameForMessage(message) }}</span>
                  <span class="message-time">{{ message.formattedTime }}</span>
                </template>
              </div>
              <div class="message-text" :class="{ 'has-copy-btn': message.messageType === 'assistant' && message.content && !isTyping }">
                <div v-if="message.imageUrl" class="message-image">
                  <img 
                    :src="message.imageUrl" 
                    alt="上传的图片"
                    @click="openImagePreview(message.imageUrl)"
                    class="clickable-image"
                  />
                </div>
                <div class="message-content-text" v-html="formatMessage(message.content)"></div>
                
                <!-- 复制按钮 - 移到消息内容右下角 -->
                <div v-if="message.messageType === 'assistant' && message.content && !isTyping" class="copy-button-container">
                  <el-button
                    type="text"
                    size="small"
                    class="copy-btn"
                    @click="copyAIResponse(message)"
                    :title="'复制回答内容'"
                  >
                    <el-icon size="14"><CopyDocument /></el-icon>
                  </el-button>
                </div>
              </div>
            </div>
          </div>

          <!-- 正在输入指示器 -->
          <div v-if="isTyping" class="message-item assistant typing">
            <div class="message-avatar">
              <img src="/src/assets/svg/chatbot.svg" alt="AI" class="ai-avatar"/>
            </div>
            <div class="message-content">
              <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部输入框区域 -->
      <div class="input-container">
        <div class="input-wrapper">
          <div class="input-with-send">
            <!-- 图片预览（在输入框内部顶部） -->
            <div v-if="selectedImage" class="image-preview-inside">
              <img :src="imagePreviewUrl" alt="预览"/>
              <el-button
                  type="danger"
                  size="small"
                  circle
                  @click="removeImage"
                  class="remove-image-btn"
              >
                <el-icon>
                  <Close/>
                </el-icon>
              </el-button>
            </div>
            
            <!-- 消息输入框 -->
            <el-input
                v-model="userMessage"
                type="textarea"
                :rows="2"
                :autosize="{ minRows: 2, maxRows: 4 }"
                placeholder="输入您的消息，按 Enter 发送，Shift+Enter 换行"
                @keydown.enter.exact.prevent="sendMessage"
                @keydown.enter.shift.exact="handleShiftEnter"
                class="message-input"
                :disabled="isSending"
            />
            
            <!-- 下部分：控制区域（模型选择、图片上传、发送按钮） -->
            <div class="control-area">
              <!-- 模型选择 -->
              <el-select
                  v-model="selectedModelId"
                  placeholder="选择模型"
                  class="model-select"
                  size="small"
              >
                <el-option
                    v-for="model in multiModels"
                    :key="model.id"
                    :label="model.modelName"
                    :value="model.id"
                >
                  <div class="model-option">
                    <span class="model-name">{{ model.modelName }}</span>
                  </div>
                </el-option>
              </el-select>
              
              <!-- 右侧按钮组 -->
              <div class="button-group">
                <!-- 图片上传 -->
                <el-upload
                    :show-file-list="false"
                    :before-upload="handleImageUpload"
                    accept="image/*"
                    class="image-upload"
                >
                  <el-button
                      type="text"
                      size="small"
                      class="upload-btn"
                      :disabled="isSending"
                  >
                    <img src="/src/assets/svg/upload.svg" alt="上传" class="action-icon"/>
                  </el-button>
                </el-upload>
                
                <!-- 发送按钮 -->
                <el-button
                    type="text"
                    @click="sendMessage"
                    class="send-btn"
                    :disabled="isSending"
                >
                  <img src="/src/assets/svg/发送.svg" alt="发送" class="action-icon"/>
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 图片预览组件 -->
    <ImagePreview
      :visible="showImagePreview"
      :imageSrc="previewImageUrl"
      imageAlt="预览图片"
      @close="closeImagePreview"
    />
  </div>
</template>

<script setup lang="ts">
import {ref, onMounted, nextTick, computed} from 'vue'
import {ElMessage, ElMessageBox} from 'element-plus'
import {Plus, Delete, Close, Fold, Expand, CopyDocument} from '@element-plus/icons-vue'
import {
  getChatConversations,
  getChatRecords,
  getMultiModelList,
  deleteChatConversation,
  multiChatStream,
  generateConversationId,
  getGreetingsByType,
  type LLMChatConversationsVO,
  type LLMChatRecordsVO,
  type OllamaModelVO,
  type LlmOpeningGreetings
} from '../../api/ai-chat'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.css'
import DOMPurify from 'dompurify'
import ImagePreview from '../../components/ImagePreview.vue'

// 响应式数据
const conversations = ref<LLMChatConversationsVO[]>([])
const chatRecords = ref<LLMChatRecordsVO[]>([])
const multiModels = ref<OllamaModelVO[]>([])
const currentConversationId = ref<string>('')
const selectedModelId = ref<number | undefined>(undefined)
const userMessage = ref('')
const selectedImage = ref<File | null>(null)
const imagePreviewUrl = ref('')
const isTyping = ref(false)
const isSending = ref(false)
const messagesContainer = ref<HTMLElement>()
const isSidebarCollapsed = ref(false)
const showImagePreview = ref(false)
const previewImageUrl = ref('')
const greetings = ref<LlmOpeningGreetings[]>([])
const isNewConversation = ref(false)

// 用户信息
const userInfo = JSON.parse(localStorage.getItem('user') || '{}')
const userAvatar = computed(() => userInfo.avatar || '/src/assets/png/default-avatar.png')
const userName = computed(() => userInfo.name || userInfo.username || '我')

// 初始化 Markdown 解析器
const md: MarkdownIt = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
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

// 计算属性
const canSend = computed(() => {
  return userMessage.value.trim() || selectedImage.value
})

// 生命周期
onMounted(async () => {
  await loadConversations()
  await loadMultiModels()
  await loadGreetings()
})

// 方法
const loadConversations = async () => {
  try {
    const response = await getChatConversations()
    if (response.success) {
      conversations.value = response.data
    } else {
      ElMessage.error(response.message || '加载对话列表失败')
    }
  } catch (error) {
    console.error('加载对话列表失败:', error)
    ElMessage.error('加载对话列表失败')
  }
}

const loadMultiModels = async () => {
  try {
    const response = await getMultiModelList()
    if (response.success) {
      multiModels.value = response.data
      if (multiModels.value.length > 0) {
        selectedModelId.value = multiModels.value[0].id
      }
    } else {
      ElMessage.error(response.message || '获取模型列表失败')
    }
  } catch (error) {
    console.error('加载模型列表失败:', error)
    ElMessage.error('加载模型列表失败')
  }
}

const loadGreetings = async () => {
  try {
    const response = await getGreetingsByType('chat')
    if (response.success) {
      greetings.value = response.data
    } else {
      console.error('获取开场白失败:', response.message)
    }
  } catch (error) {
    console.error('加载开场白失败:', error)
  }
}

const selectConversation = async (conversationId: string) => {
  currentConversationId.value = conversationId
  isNewConversation.value = false
  await loadChatRecords(conversationId)
}

const loadChatRecords = async (conversationId: string) => {
  try {
    const response = await getChatRecords(conversationId)
    if (response.success) {
      chatRecords.value = response.data
      await nextTick()
      scrollToBottom()
    } else {
      ElMessage.error(response.message || '加载聊天记录失败')
    }
  } catch (error) {
    console.error('加载聊天记录失败:', error)
    ElMessage.error('加载聊天记录失败')
  }
}

const createNewConversation = () => {
  const newConversationId = generateConversationId()
  currentConversationId.value = newConversationId
  chatRecords.value = []
  isNewConversation.value = true
}

const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
}

const deleteConversation = async (conversationId: string) => {
  try {
    await ElMessageBox.confirm('确定要删除这个对话吗？', '确认删除', {
      type: 'warning'
    })

    const response = await deleteChatConversation(conversationId)
    if (response.success) {
      ElMessage.success('删除成功')
      await loadConversations()
      if (currentConversationId.value === conversationId) {
        currentConversationId.value = ''
        chatRecords.value = []
      }
    } else {
      ElMessage.error(response.message || '删除对话失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除对话失败:', error)
      ElMessage.error('删除对话失败')
    }
  }
}

const handleImageUpload = (file: File) => {
  selectedImage.value = file
  imagePreviewUrl.value = URL.createObjectURL(file)
  return false // 阻止自动上传
}

const removeImage = () => {
  selectedImage.value = null
  imagePreviewUrl.value = ''
}

const sendMessage = async () => {
  if (!canSend.value || !selectedModelId.value) {
    ElMessage.warning('请输入消息内容并选择模型')
    return
  }

  if (!currentConversationId.value) {
    ElMessage.warning('请先创建或选择一个对话')
    return
  }

  // 发送消息时隐藏开场白
  isNewConversation.value = false

  const message = userMessage.value.trim()
  const image = selectedImage.value
  const modelId = selectedModelId.value // 确保类型安全

  // 清空输入
  userMessage.value = ''
  selectedImage.value = null
  imagePreviewUrl.value = ''
  isSending.value = true
  isTyping.value = true

  try {
    // 添加用户消息到聊天记录
    const userMessageRecord: LLMChatRecordsVO = {
      id: Date.now(),
      conversationId: currentConversationId.value,
      modelId: modelId,
      modelName: '',
      messageType: 'user',
      content: message,
      isMultimodal: image ? 1 : 0,
      imageUrl: image ? URL.createObjectURL(image) : null,
      createTime: new Date().toISOString(),
      formattedTime: '刚刚'
    }

    chatRecords.value.push(userMessageRecord)
    await nextTick()
    scrollToBottom()

    // 发送消息并处理流式响应
    let aiMessageCreated = false
    multiChatStream(
        modelId,
        currentConversationId.value,
        message,
        image,
        (data: string) => {
          // 第一次收到数据时创建AI消息容器
          if (!aiMessageCreated) {
            const aiMessageRecord: LLMChatRecordsVO = {
              id: Date.now() + 1,
              conversationId: currentConversationId.value,
              modelId: modelId,
              modelName: multiModels.value.find(m => m.id === modelId)?.modelName || '',
              messageType: 'assistant',
              content: data,
              isMultimodal: 0,
              imageUrl: null,
              createTime: new Date().toISOString(),
              formattedTime: '刚刚'
            }
            chatRecords.value.push(aiMessageRecord)
            aiMessageCreated = true
            isTyping.value = false // 关闭正在输入指示器
          } else {
            // 更新AI回复内容
            const lastMessage = chatRecords.value[chatRecords.value.length - 1]
            if (lastMessage.messageType === 'assistant') {
              lastMessage.content += data
            }
          }
          nextTick(() => scrollToBottom())
        },
        (error) => {
          console.error('发送消息失败:', error)
          ElMessage.error('发送消息失败')
          isTyping.value = false
          isSending.value = false
        },
        () => {
          isTyping.value = false
          isSending.value = false
          // 刷新对话列表
          loadConversations()
        }
    )

  } catch (error) {
    console.error('发送消息失败:', error)
    ElMessage.error('发送消息失败')
    isTyping.value = false
    isSending.value = false
  }
}

const handleShiftEnter = (event: KeyboardEvent) => {
  // Shift+Enter 换行，不发送消息
  event.preventDefault()
  const textarea = event.target as HTMLTextAreaElement
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  userMessage.value = userMessage.value.substring(0, start) + '\n' + userMessage.value.substring(end)
  nextTick(() => {
    textarea.selectionStart = textarea.selectionEnd = start + 1
  })
}

const getModelNameForMessage = (message: LLMChatRecordsVO) => {
  if (message.messageType === 'assistant') {
    // 查找当前AI消息之前最近的用户消息，获取其modelName
    const currentIndex = chatRecords.value.findIndex(record => record.id === message.id)
    for (let i = currentIndex - 1; i >= 0; i--) {
      const prevMessage = chatRecords.value[i]
      if (prevMessage.messageType === 'user' && prevMessage.modelName) {
        return prevMessage.modelName
      }
    }
    // 如果找不到，返回AI消息自己的modelName或默认值
    return message.modelName || '未知模型'
  }
  return message.modelName || '未知模型'
}

const formatMessage = (content: string) => {
  if (!content) return ''
  
  try {
    // 使用 markdown-it 渲染 markdown 内容
    const rendered = md.render(content)
    // 使用 DOMPurify 清理 HTML，防止 XSS 攻击
    return DOMPurify.sanitize(rendered, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 'del', 'code', 'pre', 
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'blockquote', 'a', 'img',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'span', 'div'
      ],
      ALLOWED_ATTR: [
        'href', 'target', 'rel', 'src', 'alt', 'title',
        'class', 'style', 'id'
      ],
      ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
    })
  } catch (error) {
    console.error('Markdown rendering error:', error)
    // 如果渲染失败，回退到简单的换行处理
    return content.replace(/\n/g, '<br>')
  }
}

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// 复制AI回答内容
const copyAIResponse = async (message: LLMChatRecordsVO) => {
  try {
    const textToCopy = message.content || ''
    if (!textToCopy.trim()) {
      ElMessage.warning('没有可复制的内容')
      return
    }
    
    // 优先使用现代 Clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(textToCopy)
        ElMessage.success('已复制到剪贴板')
        return
      } catch (err) {
        console.warn('Clipboard API 失败，尝试降级方案:', err)
      }
    }
    
    // 降级方案：使用传统的 execCommand 方法
    try {
      const textArea = document.createElement('textarea')
      textArea.value = textToCopy
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      textArea.style.opacity = '0'
      document.body.appendChild(textArea)
      
      textArea.focus()
      textArea.select()
      
      // 使用 execCommand 复制
      const success = document.execCommand('copy')
      if (success) {
        ElMessage.success('已复制到剪贴板')
      } else {
        throw new Error('execCommand 复制失败')
      }
      
      document.body.removeChild(textArea)
    } catch (fallbackErr) {
      console.error('所有复制方法都失败:', fallbackErr)
      // 最后的备用方案：显示文本内容供用户手动复制
      ElMessage.error(`复制失败，请手动复制以下内容：\n${textToCopy.substring(0, 100)}${textToCopy.length > 100 ? '...' : ''}`)
    }
  } catch (error) {
    console.error('复制失败:', error)
    ElMessage.error('复制失败，请手动复制')
  }
}

// 图片预览相关方法
const openImagePreview = (imageUrl: string) => {
  previewImageUrl.value = imageUrl
  showImagePreview.value = true
}

const closeImagePreview = () => {
  showImagePreview.value = false
  previewImageUrl.value = ''
}


</script>

<style scoped>
/* 主容器 */
.multi-chat-container {
  display: flex;
  height: 100%;
  background: transparent;
  border-radius: 16px;
  overflow: hidden;
  gap: 10px;
}

/* 侧边栏样式 */
.chat-sidebar {
  width: 300px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
}

.chat-sidebar.collapsed {
  width: 60px;
}

.chat-sidebar.collapsed .sidebar-header h3,
.chat-sidebar.collapsed .conversation-list {
  display: none;
}

.chat-sidebar.collapsed .sidebar-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
  margin-top: auto;
}

.chat-sidebar.collapsed .sidebar-footer span {
  display: none;
}

.chat-sidebar.collapsed .sidebar-header {
  justify-content: center;
}

.chat-sidebar.collapsed .collapse-btn {
  margin: 0;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid var(--dashboard-glass-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sidebar-header h3 {
  margin: 0;
  color: var(--dashboard-text-primary);
  font-size: 18px;
  font-weight: 600;
}

.conversation-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.conversation-item {
  display: flex;
  align-items: center;
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.conversation-item:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
}

.conversation-item.active {
  background: rgba(64, 158, 255, 0.2);
  border-color: rgba(64, 158, 255, 0.3);
}

.conversation-content {
  flex: 1;
  min-width: 0;
}

.conversation-title {
  color: var(--dashboard-text-primary);
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.conversation-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.conversation-time {
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
}

.remaining-count {
  color: rgba(103, 194, 58, 0.9);
  font-size: 11px;
  background: rgba(103, 194, 58, 0.1);
  padding: 2px 6px;
  border-radius: 10px;
  border: 1px solid rgba(103, 194, 58, 0.2);
  white-space: nowrap;
}

.remaining-count.max-reached {
  color: rgba(245, 108, 108, 0.8);
  background: rgba(245, 108, 108, 0.1);
  border-color: rgba(245, 108, 108, 0.2);
}

.delete-btn {
  opacity: 0;
  transition: opacity 0.3s ease;
  color: #f56c6c;
  padding: 4px;
  background: transparent !important;
  font-size: 18px !important;
}

.delete-btn:hover {
  background: transparent !important;
}

.conversation-item:hover .delete-btn {
  opacity: 1;
}

/* 侧边栏底部样式 */
.sidebar-footer {
  padding: 16px;
  border-top: 2px solid rgba(255, 255, 255, 0.2);
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  background: transparent !important;
  color: #409eff;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.3s ease;
  margin-top: auto;
}

.sidebar-footer:hover {
  background: rgba(64, 158, 255, 0.1) !important;
}

/* 展开/收缩按钮样式 */
.collapse-btn {
  background: transparent !important;
  border: none !important;
  color: rgba(255, 255, 255, 0.8) !important;
  border-radius: 6px !important;
  padding: 6px !important;
  min-height: 32px !important;
  font-size: 20px !important;
}

.collapse-btn:hover {
  background: rgba(255, 255, 255, 0.1) !important;
}

/* 右侧聊天区域 */
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  transition: margin-left 0.3s ease;
}

/* 聊天记录区域 */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  color: rgba(255, 255, 255, 0.6);
}

.empty-icon {
  margin-bottom: 20px;
}

.ai-icon {
  width: 64px;
  height: 64px;
  opacity: 0.6;
}

.empty-state h3 {
  margin: 0 0 10px 0;
  color: var(--dashboard-text-primary);
  font-size: 20px;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
}

.greeting-placeholder {
  margin-bottom: 20px;
}

.greeting-placeholder h3 {
  margin: 0 0 10px 0;
  color: var(--dashboard-text-primary);
  font-size: 20px;
}

.greeting-content {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  line-height: 1.6;
  max-width: 600px;
  margin: 0 auto;
}

/* 消息项样式 */
.message-item {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.message-item.user {
  flex-direction: row-reverse;
}

.message-avatar {
  flex-shrink: 0;
}

.ai-avatar, .user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
}

.message-content {
  width: fit-content;
  max-width: 50%;
  min-width: 100px;
}

.message-item.user .message-content {
  text-align: right;
  margin-left: auto;
}

.message-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.message-item.user .message-header {
  justify-content: flex-end;
}

.message-sender {
  font-size: 12px;
  font-weight: 500;
  color: var(--dashboard-text-primary);
}

.message-time {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
}

.message-text {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 12px;
  color: var(--dashboard-text-primary);
  line-height: 1.5;
  width: fit-content;
  display: inline-block;
}

.message-item.user .message-text {
  background: rgba(64, 158, 255, 0.2);
  border-color: rgba(64, 158, 255, 0.3);
}

.message-image {
  margin-bottom: 8px;
}

.message-image img {
  max-width: 200px;
  max-height: 200px;
  border-radius: 8px;
}

.clickable-image {
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.clickable-image:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  filter: brightness(1.1);
}

.clickable-image:hover::after {
  content: '🔍';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 8px;
  border-radius: 50%;
  font-size: 16px;
  opacity: 0.9;
  pointer-events: none;
}

/* 正在输入指示器 */
.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 12px;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.6);
  animation: typing 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(1) {
  animation-delay: -0.32s;
}

.typing-indicator span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes typing {
  0%, 80%, 100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

.input-container {
  display: flex;
  flex-direction: column;
  gap: 0px;
}



/* 控制区域 */
.control-area {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-top: 8px;
}

/* 按钮组 */
.button-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.model-select {
  width: 140px;
}

/* 自定义模型选择样式 */
.model-select :deep(.el-select__wrapper) {
  background: rgba(64, 158, 255, 0.1) !important;
  border: 1px solid rgba(64, 158, 255, 0.2) !important;
  box-shadow: none !important;
  height: 36px !important;
  position: relative !important;
}

.model-select :deep(.el-select__wrapper:hover) {
  border-color: rgba(64, 158, 255, 0.4) !important;
}

.model-select :deep(.el-select__wrapper.is-focused) {
  border-color: rgba(64, 158, 255, 0.6) !important;
}

.model-select :deep(.el-input__inner) {
  color: rgba(255, 255, 255, 0.9) !important;
  background: transparent !important;
  height: 36px !important;
  line-height: 36px !important;
}

.model-select :deep(.el-select__caret) {
  color: rgba(255, 255, 255, 0.6) !important;
  margin-top: 0 !important;
  transform: translateY(-50%) !important;
  top: 50% !important;
  position: absolute !important;
  right: 8px !important;
}

.model-select :deep(.el-select__placeholder) {
  color: rgba(255, 255, 255, 0.6) !important;
  line-height: 36px !important;
}

/* 控制下拉面板宽度 */
.model-select :deep(.el-select-dropdown) {
  min-width: 140px !important;
  width: 140px !important;
}

.model-select :deep(.el-select-dropdown__item) {
  padding: 8px 12px !important;
}

.model-option {
  display: flex;
  flex-direction: column;
}

.model-name {
  font-weight: 500;
}

.input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 输入框和发送按钮容器 */
.input-with-send {
  background: rgba(64, 158, 255, 0.1);
  border: 1px solid rgba(64, 158, 255, 0.2);
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 0px;
  transition: all 0.3s ease;
  min-height: 60px;
}

.input-with-send:hover {
  border-color: rgba(64, 158, 255, 0.4);
}

.input-with-send:focus-within {
  border-color: rgba(64, 158, 255, 0.6);
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

/* 图片预览在容器内部 */
 .image-preview-inside {
   position: relative;
   display: inline-flex;
   align-items: center;
   justify-content: flex-start;
   margin-bottom: 4px;
   width: fit-content;
 }

.image-preview-inside img {
  max-width: 120px;
  max-height: 120px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

/* 图片上传和发送按钮样式 */
.image-upload {
  flex-shrink: 0;
}

.upload-btn {
  background: rgba(64, 158, 255, 0.1) !important;
  border: 1px solid rgba(64, 158, 255, 0.2) !important;
  border-radius: 6px !important;
  padding: 6px !important;
  min-height: 32px !important;
  transition: all 0.3s ease !important;
}

.upload-btn:hover {
  background: rgba(64, 158, 255, 0.2) !important;
  border-color: rgba(64, 158, 255, 0.4) !important;
}

.send-btn {
  background: rgba(64, 158, 255, 0.1) !important;
  border: 1px solid rgba(64, 158, 255, 0.2) !important;
  border-radius: 6px !important;
  padding: 6px !important;
  min-height: 32px !important;
  transition: all 0.3s ease !important;
  color: rgba(64, 158, 255, 0.8) !important;
}

.send-btn:hover {
  background: rgba(64, 158, 255, 0.2) !important;
  border-color: rgba(64, 158, 255, 0.4) !important;
  color: rgba(64, 158, 255, 1) !important;
}

.send-btn:disabled {
  color: rgba(255, 255, 255, 0.3) !important;
  background: rgba(64, 158, 255, 0.05) !important;
  border-color: rgba(64, 158, 255, 0.1) !important;
}

/* 自定义输入框样式 */
.message-input {
  margin-bottom: 12px;
}

.message-input :deep(.el-textarea__inner) {
  background: transparent !important;
  border: none !important;
  color: rgba(255, 255, 255, 0.9) !important;
  border-radius: 0 !important;
  padding: 8px !important;
  box-shadow: none !important;
  resize: none !important;
}

.message-input :deep(.el-textarea__inner:hover) {
  border: none !important;
  box-shadow: none !important;
}

.message-input :deep(.el-textarea__inner:focus) {
  border: none !important;
  box-shadow: none !important;
  outline: none !important;
}

.message-input :deep(.el-textarea__inner::placeholder) {
  color: rgba(255, 255, 255, 0.6) !important;
}

.upload-btn {
  padding: 8px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(64, 158, 255, 0.1);
  border: 1px solid rgba(64, 158, 255, 0.2);
  color: rgba(255, 255, 255, 0.8);
}

.upload-btn:hover {
  background: rgba(64, 158, 255, 0.2);
  border-color: rgba(64, 158, 255, 0.3);
}



.action-icon {
  width: 22px;
  height: 22px;
}

.image-preview-inside .remove-image-btn {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 18px;
  height: 18px;
  min-height: 18px;
  padding: 0;
  font-size: 12px;
}

/* 滚动条样式 */
.chat-messages::-webkit-scrollbar,
.conversation-list::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-track,
.conversation-list::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb,
.conversation-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb:hover,
.conversation-list::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}



/* 消息内容样式 */
.message-content-text {
  color: var(--dashboard-text-primary);
  line-height: 1.5;
  word-wrap: break-word;
  white-space: normal;
  margin: 0;
  padding: 0;
}

/* Markdown 渲染样式 */
.message-content-text :deep(h1),
.message-content-text :deep(h2),
.message-content-text :deep(h3),
.message-content-text :deep(h4),
.message-content-text :deep(h5),
.message-content-text :deep(h6) {
  color: var(--dashboard-text-primary);
  margin: 12px 0 6px 0;
  font-weight: 600;
}

.message-content-text :deep(h1:first-child),
.message-content-text :deep(h2:first-child),
.message-content-text :deep(h3:first-child),
.message-content-text :deep(h4:first-child),
.message-content-text :deep(h5:first-child),
.message-content-text :deep(h6:first-child) {
  margin-top: 0;
}

.message-content-text :deep(h1:last-child),
.message-content-text :deep(h2:last-child),
.message-content-text :deep(h3:last-child),
.message-content-text :deep(h4:last-child),
.message-content-text :deep(h5:last-child),
.message-content-text :deep(h6:last-child) {
  margin-bottom: 0;
}

.message-content-text :deep(h1) { font-size: 1.5em; }
.message-content-text :deep(h2) { font-size: 1.3em; }
.message-content-text :deep(h3) { font-size: 1.2em; }
.message-content-text :deep(h4) { font-size: 1.1em; }
.message-content-text :deep(h5) { font-size: 1em; }
.message-content-text :deep(h6) { font-size: 0.9em; }

.message-content-text :deep(p) {
  margin: 6px 0;
  color: var(--dashboard-text-primary);
}

.message-content-text :deep(p:first-child) {
  margin-top: 0;
}

.message-content-text :deep(p:last-child) {
  margin-bottom: 0;
}

.message-content-text :deep(code) {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  padding: 2px 6px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 0.9em;
  color: #e6db74;
}

.message-content-text :deep(pre) {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 16px;
  margin: 10px 0;
  overflow-x: auto;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 0.9em;
}

.message-content-text :deep(pre:first-child) {
  margin-top: 0;
}

.message-content-text :deep(pre:last-child) {
  margin-bottom: 0;
}

.message-content-text :deep(pre code) {
  background: transparent;
  border: none;
  padding: 0;
  color: inherit;
}

.message-content-text :deep(blockquote) {
  border-left: 4px solid rgba(64, 158, 255, 0.6);
  margin: 10px 0;
  padding: 8px 16px;
  background: rgba(64, 158, 255, 0.1);
  border-radius: 0 8px 8px 0;
  color: var(--dashboard-text-primary);
}

.message-content-text :deep(blockquote:first-child) {
  margin-top: 0;
}

.message-content-text :deep(blockquote:last-child) {
  margin-bottom: 0;
}

.message-content-text :deep(ul),
.message-content-text :deep(ol) {
  margin: 6px 0;
  padding-left: 24px;
  color: var(--dashboard-text-primary);
}

.message-content-text :deep(ul:first-child),
.message-content-text :deep(ol:first-child) {
  margin-top: 0;
}

.message-content-text :deep(ul:last-child),
.message-content-text :deep(ol:last-child) {
  margin-bottom: 0;
}

.message-content-text :deep(li) {
  margin: 2px 0;
}

.message-content-text :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 10px 0;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  overflow: hidden;
}

.message-content-text :deep(table:first-child) {
  margin-top: 0;
}

.message-content-text :deep(table:last-child) {
  margin-bottom: 0;
}

.message-content-text :deep(th),
.message-content-text :deep(td) {
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 8px 12px;
  text-align: left;
  color: var(--dashboard-text-primary);
}

.message-content-text :deep(th) {
  background: rgba(64, 158, 255, 0.2);
  font-weight: 600;
}

.message-content-text :deep(a) {
  color: #409eff;
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: border-color 0.3s ease;
}

.message-content-text :deep(a:hover) {
  border-bottom-color: #409eff;
}

.message-content-text :deep(strong) {
  font-weight: 600;
  color: var(--dashboard-text-primary);
}

.message-content-text :deep(em) {
  font-style: italic;
  color: var(--dashboard-text-primary);
}

.message-content-text :deep(del) {
  text-decoration: line-through;
  opacity: 0.7;
}

/* 复制按钮样式 */
.copy-button-container {
  position: absolute;
  bottom: 8px; /* 保持在容器内部 */
  right: 8px;
  display: flex;
  justify-content: flex-end;
  align-items: flex-end;
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 5; /* 确保按钮在文本之上 */
}

/* 为包含复制按钮的消息文本容器添加相对定位，但不增加内边距 */
.message-text.has-copy-btn {
  position: relative;
  /* 移除 padding-bottom，让容器高度完全由文本内容决定 */
}

/* 鼠标悬停时显示复制按钮 */
.message-text.has-copy-btn:hover .copy-button-container {
  opacity: 1;
}

.copy-btn {
  background: rgba(248, 248, 248, 0.3) !important; /* 透明灰白色背景 */
  border: 1px solid rgba(220, 220, 220, 0.4) !important; /* 透明灰色边框 */
  border-radius: 6px !important;
  padding: 6px 8px !important;
  color: rgba(100, 100, 100, 0.8) !important; /* 灰色文字 */
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease !important;
  min-height: 28px !important;
  backdrop-filter: blur(4px);
}

.copy-btn:hover {
  background: rgba(173, 216, 230, 0.5) !important; /* 透明浅蓝色背景 */
  border-color: rgba(135, 206, 235, 0.6) !important; /* 透明天蓝色边框 */
  color: rgba(70, 130, 180, 0.9) !important; /* 蓝色文字 */
}

.copy-btn:active {
  background: rgba(135, 206, 235, 0.6) !important; /* 按下时透明天蓝色 */
  border-color: rgba(100, 149, 237, 0.7) !important; /* 按下时更深的蓝色边框 */
}

/* 响应式设计 */
@media (max-width: 768px) {
  .chat-sidebar {
    width: 250px;
  }

  .message-content {
    max-width: 85%;
  }


  
  .copy-btn {
    min-height: 24px !important;
    padding: 4px 6px !important;
  }
  
  /* 移动端保持按钮在容器内部 */
  .copy-button-container {
    bottom: 6px; /* 移动端保持在容器内部 */
  }
}
</style>