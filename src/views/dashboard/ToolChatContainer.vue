<template>
  <div class="chat-container">
    <!-- 消息显示区域 -->
    <div class="messages-area" ref="messagesArea">
      <!-- 统一的开场白显示 -->
      <div v-if="shouldShowGreeting" class="welcome-state">
        <div class="welcome-content">
          <img src="/src/assets/svg/人工智能.svg" class="welcome-icon" alt="人工智能"/>
          <div v-if="greetings.length > 0" class="greeting-placeholder">
            <h2>{{ greetings[0].greetingTitle }}</h2>
            <div class="greeting-content" v-html="greetings[0].greetingContent"></div>
            <!-- 工具名称卡片展示 -->
            <div v-if="getToolNames(greetings[0]).length > 0" class="tool-names-list">
              <div 
                v-for="toolName in getToolNames(greetings[0])" 
                :key="toolName"
                class="tool-name-tag"
              >
                {{ toolName }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="conversationId" class="messages-list">
        <!-- 加载状态 -->
        <div v-if="messagesLoading" class="loading-container">
          <el-icon class="is-loading" size="32" color="#FF6F61">
            <Loading />
          </el-icon>
          <p>加载消息中...</p>
        </div>
        
        <!-- 消息列表 -->
        <div v-else>
          <div
              v-for="message in messages"
              :key="message.id"
              :class="['message-item', `message-${message.messageType}`]"
          >
          <div class="message-avatar">
            <el-avatar
                v-if="message.messageType === 'user'"
                :size="32"
                :src="userAvatar"
            />
            <div v-else class="ai-avatar">
              <img src="/src/assets/svg/人工智能.svg" alt="AI"/>
            </div>
          </div>

          <div class="message-content">
            <div class="message-body">
              <div
                  v-if="message.messageType === 'user'"
                  class="user-message"
              >
                {{ message.content }}
              </div>

              <div v-else class="ai-message">
                <!-- AI消息内容 -->
                <StreamingTextRenderer
                    :content="message.content"
                    :is-streaming="false"
                    :enable-markdown="true"
                    :enable-syntax-highlight="true"
                    @content-updated="handleContentUpdated"
                />

                <!-- 工具调用信息 -->
                <div v-if="message.hasToolCalls" class="tool-calls-info">
                  <div class="tool-calls-tag">
                    <img src="/src/assets/svg/工具调用.svg" class="tool-call-icon" alt="工具调用"/>
                    调用了 {{ message.toolCallCount }} 个工具
                  </div>
                  <el-tooltip
                      :content="message.toolCallSummary"
                      placement="top"
                  >
                    <el-button type="text" size="small" class="tool-detail-btn">
                      查看详情
                    </el-button>
                  </el-tooltip>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>

        <!-- 流式响应中的临时消息 -->
        <div v-if="isStreaming" class="message-item message-assistant streaming">
          <div class="message-avatar">
            <div class="ai-avatar">
              <img src="/src/assets/svg/人工智能.svg" alt="AI"/>
            </div>
          </div>

          <div class="message-content">
            <div class="message-body">
              <div class="ai-message">
                <!-- 处理中状态 -->
                <div v-if="streamingPhase === 'processing'" class="processing-indicator">
                  <div class="processing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <span class="processing-text">AI正在处理您的请求...</span>
                </div>
                
                <!-- 流式输出状态 -->
                <div v-else-if="streamingPhase === 'streaming'" class="streaming-content">
                  <StreamingTextRenderer
                      :content="streamingMessage"
                      :is-streaming="true"
                      :enable-markdown="true"
                      :enable-syntax-highlight="true"
                      :typewriter-speed="20"
                      @content-updated="handleStreamingContentUpdated"
                      @streaming-complete="handleStreamingComplete"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 用户输入区域 -->
    <div class="input-container">
      <div class="input-wrapper">
        <el-input
            v-model="userInput"
            type="textarea"
            :autosize="{ minRows: 1, maxRows: 6 }"
            placeholder="输入您的问题，AI将为您调用合适的工具..."
            :disabled="isStreaming"
            @keydown.ctrl.enter="sendMessage"
            class="message-input"
        />

        <el-button
            type="primary"
            :loading="isStreaming"
            :disabled="!userInput || isStreaming"
            @click="sendMessage"
            class="send-btn"
        >
          <el-icon v-if="!isStreaming">
            <Promotion/>
          </el-icon>
          {{ isStreaming ? '发送中...' : '发送' }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, computed, watch, nextTick} from 'vue'
import {ElMessage} from 'element-plus'
import {Loading} from '@element-plus/icons-vue'
import {useAuthStore} from '../../stores/auth'
import {getToolRecords, callAITool, getGreetingsByType, generateConversationId} from '../../api/tool'
import type {ToolRecord, LlmOpeningGreetings} from '../../api/tool'
import StreamingTextRenderer from '../../components/StreamingTextRenderer.vue'

// Props
interface Props {
  conversationId: string
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'message-sent': []
  'conversation-updated': []
  'conversation-created': [conversationId: string]
}>()

// Store
const authStore = useAuthStore()

// 响应式数据
const messagesArea = ref<HTMLElement>()
const messages = ref<ToolRecord[]>([])
const messagesLoading = ref(false)
const userInput = ref('')
const isStreaming = ref(false)
const streamingMessage = ref('')
const streamingPhase = ref<'processing' | 'streaming' | 'completed'>('processing')
const greetings = ref<LlmOpeningGreetings[]>([])
const isNewConversation = ref(false)
const currentStreamingMessageId = ref<number | null>(null)

// 计算属性
const userAvatar = computed(() => authStore.userProfile?.avatar || '/default-avatar.png')

// 统一控制开场白显示的逻辑
const shouldShowGreeting = computed(() => {
  // 情况1：没有选择对话时显示开场白作为占位符
  if (!props.conversationId) {
    return true
  }
  // 情况2：新建对话时显示开场白（有对话ID但没有消息且不在加载中）
  if (props.conversationId && messages.value.length === 0 && !messagesLoading.value && greetings.value.length > 0) {
    return true
  }
  return false
})



// 方法
const loadGreetings = async () => {
  try {
    const response = await getGreetingsByType('tool')
    if (response.success) {
      greetings.value = response.data
    } else {
      console.error('获取开场白失败:', response.message)
    }
  } catch (error) {
    console.error('加载开场白失败:', error)
  }
}

const loadMessages = async () => {
  if (!props.conversationId) return

  messagesLoading.value = true
  try {
    const result = await getToolRecords(props.conversationId)
    if (result.success) {
      messages.value = result.data || []
      // 判断是否为新对话（没有消息记录）
      isNewConversation.value = messages.value.length === 0
      await nextTick()
      scrollToBottom()
    } else {
      ElMessage.error(result.message || '加载消息失败')
    }
  } catch (error) {
    console.error('加载消息失败:', error)
    ElMessage.error('加载消息失败')
  } finally {
    messagesLoading.value = false
  }
}

// 自动获取并更新工具调用信息
const updateToolCallInfo = async (messageId: number) => {
  try {
    // 重新获取消息记录以获取最新的工具调用信息
    const result = await getToolRecords(props.conversationId)
    if (result.success && result.data) {
      const updatedMessages = result.data
      const targetMessage = updatedMessages.find(msg => msg.id === messageId)
      
      if (targetMessage && targetMessage.hasToolCalls) {
        // 找到本地消息并更新工具调用信息
        const localMessageIndex = messages.value.findIndex(msg => msg.id === messageId)
        if (localMessageIndex !== -1) {
          // 使用Vue的响应式更新，确保界面能够检测到变化
          messages.value[localMessageIndex] = {
            ...messages.value[localMessageIndex],
            hasToolCalls: targetMessage.hasToolCalls,
            toolCallCount: targetMessage.toolCallCount,
            toolsCalledList: targetMessage.toolsCalledList,
            toolCallSummary: targetMessage.toolCallSummary
          }
          
          // 触发工具调用列表更新
          emit('conversation-updated')
          
          await nextTick()
          scrollToBottom()
        }
      }
    }
  } catch (error) {
    console.error('更新工具调用信息失败:', error)
  }
}

const sendMessage = async () => {
  if (!userInput.value.trim() || isStreaming.value) return

  // 如果没有conversationId，生成一个新的对话ID并通知父组件
  let currentConversationId = props.conversationId
  if (!currentConversationId) {
    currentConversationId = generateConversationId()
    // 通知父组件创建新对话
    emit('conversation-created', currentConversationId)
  }

  // 隐藏开场白
  isNewConversation.value = false

  const message = userInput.value.trim()
  userInput.value = ''
  
  // 立即进入流式状态，显示处理中
  isStreaming.value = true
  streamingPhase.value = 'processing'
  streamingMessage.value = ''
  currentStreamingMessageId.value = null

  try {
    // 添加用户消息到本地显示
    const userMessage: ToolRecord = {
      id: Date.now(),
      conversationId: currentConversationId,
      messageType: 'user',
      content: message,
      hasToolCalls: false,
      toolCallCount: 0,
      toolsCalledList: [],
      toolCallSummary: '无工具调用',
      createTime: new Date().toISOString(),
      formattedTime: '刚刚'
    }
    messages.value.push(userMessage)
    await nextTick()
    scrollToBottom()

    // 发送请求到后端
    const response = await callAITool(currentConversationId, message)

    if (!response.ok) {
      throw new Error('请求失败')
    }

    // 创建AI消息ID用于后续更新
    const aiMessageId = Date.now() + 1
    currentStreamingMessageId.value = aiMessageId

    // 处理流式响应
    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    if (reader) {
      try {
        while (true) {
          const {done, value} = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, {stream: true})
          buffer += chunk

          // 处理可能的多行数据
          const lines = buffer.split('\n')
          buffer = lines.pop() || '' // 保留最后一个不完整的行

          for (const line of lines) {
            if (line.trim()) {
              streamingMessage.value += line + '\n'
            }
          }

          await nextTick()
          scrollToBottom()
        }

        // 处理剩余的buffer内容
        if (buffer.trim()) {
          streamingMessage.value += buffer
          await nextTick()
          scrollToBottom()
        }

        // 流式响应结束，添加最终消息到消息列表
        const finalAiMessage: ToolRecord = {
          id: aiMessageId,
          conversationId: currentConversationId,
          messageType: 'assistant',
          content: streamingMessage.value,
          hasToolCalls: false, // 初始状态，稍后会更新
          toolCallCount: 0,
          toolsCalledList: [],
          toolCallSummary: '',
          createTime: new Date().toISOString(),
          formattedTime: '刚刚'
        }
        
        messages.value.push(finalAiMessage)
        
        // 延迟一小段时间后自动获取工具调用信息
        setTimeout(async () => {
          await updateToolCallInfo(aiMessageId)
        }, 500)

      } catch (error) {
        console.error('流式响应读取错误:', error)
        ElMessage.error('响应读取失败')
      }
    }

    // 触发事件通知父组件
    emit('message-sent')

  } catch (error) {
    console.error('发送消息失败:', error)
    ElMessage.error('发送消息失败，请重试')
  } finally {
    // 重置流式状态
    isStreaming.value = false
    streamingPhase.value = 'processing'
    streamingMessage.value = ''
    currentStreamingMessageId.value = null
  }
}

const scrollToBottom = () => {
  if (messagesArea.value) {
    messagesArea.value.scrollTop = messagesArea.value.scrollHeight
  }
}

const handleContentUpdated = (_content: string) => {
  // 处理内容更新，可以在这里添加额外的逻辑
  scrollToBottom()
}

const handleStreamingContentUpdated = (_content: string) => {
  // 处理流式内容更新
  scrollToBottom()
}

const handleStreamingComplete = () => {
  // 流式响应完成，重新加载消息列表获取完整记录
  setTimeout(() => {
    loadMessages()
    emit('conversation-updated')
  }, 500)
}

// 解析工具名称JSON数据
const getToolNames = (greeting: LlmOpeningGreetings): string[] => {
  if (!greeting.toolNames) return []
  
  try {
    // 解析JSON字符串
    const toolNames = JSON.parse(greeting.toolNames)
    return Array.isArray(toolNames) ? toolNames : []
  } catch (error) {
    console.error('解析toolNames失败:', error)
    return []
  }
}

// 监听对话ID变化
watch(() => props.conversationId, (newId) => {
  if (newId) {
    loadMessages()
  } else {
    messages.value = []
    isNewConversation.value = false
  }
}, {immediate: true})

// 组件初始化时加载开场白
loadGreetings()

// 暴露方法给父组件
defineExpose({
  loadMessages
})
</script>

<style scoped>
.chat-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: rgba(0, 0, 0, 0.15);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  overflow: hidden;
}

.messages-area {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px;
  min-height: 0;
  scroll-behavior: smooth;
}

.loading-container,
.welcome-state {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-container {
  flex-direction: column;
  color: rgba(255, 255, 255, 0.6);
}

.loading-container p {
  margin-top: 16px;
  font-size: 16px;
}

.welcome-content {
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
}

.welcome-icon {
  width: 64px;
  height: 64px;
  margin-bottom: 16px;
}

.welcome-content h2 {
  margin: 0 0 8px 0;
  color: #fff;
  font-size: 24px;
  font-weight: 600;
}

.welcome-content p {
  margin: 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
}

.greeting-placeholder {
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
}

.greeting-placeholder h2 {
  margin: 0 0 8px 0;
  color: #fff;
  font-size: 24px;
  font-weight: 600;
}

.greeting-content {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.6);
}

/* 工具名称卡片样式 - 信用卡风格 */
.tool-names-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: center;
  margin-top: 24px;
}

.tool-name-tag {
  display: inline-block;
  padding: 12px 20px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(8px);
  transition: all 0.2s ease;
  cursor: pointer;
  min-width: 120px;
  text-align: center;
}

/* 不同颜色的淡色透明样式 */
.tool-name-tag:nth-child(1) {
  background: rgba(102, 126, 234, 0.15);
  border-color: rgba(102, 126, 234, 0.25);
}

.tool-name-tag:nth-child(2) {
  background: rgba(240, 147, 251, 0.15);
  border-color: rgba(240, 147, 251, 0.25);
}

.tool-name-tag:nth-child(3) {
  background: rgba(79, 172, 254, 0.15);
  border-color: rgba(79, 172, 254, 0.25);
}

.tool-name-tag:nth-child(4) {
  background: rgba(67, 233, 123, 0.15);
  border-color: rgba(67, 233, 123, 0.25);
}

.tool-name-tag:nth-child(5) {
  background: rgba(250, 112, 154, 0.15);
  border-color: rgba(250, 112, 154, 0.25);
}

.tool-name-tag:nth-child(6) {
  background: rgba(168, 237, 234, 0.15);
  border-color: rgba(168, 237, 234, 0.25);
}

.tool-name-tag:nth-child(7) {
  background: rgba(255, 236, 210, 0.15);
  border-color: rgba(255, 236, 210, 0.25);
}

.tool-name-tag:nth-child(8) {
  background: rgba(255, 138, 128, 0.15);
  border-color: rgba(255, 138, 128, 0.25);
}

/* 循环使用颜色 */
.tool-name-tag:nth-child(9) {
  background: rgba(102, 126, 234, 0.15);
  border-color: rgba(102, 126, 234, 0.25);
}

.tool-name-tag:nth-child(10) {
  background: rgba(240, 147, 251, 0.15);
  border-color: rgba(240, 147, 251, 0.25);
}

.tool-name-tag:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.25);
  color: rgba(255, 255, 255, 1);
}

.messages-list {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.message-item {
  display: flex;
  margin-bottom: 24px;
}

.message-user {
  flex-direction: row-reverse;
}

.message-user .message-content {
  margin-left: auto;
}

.message-avatar {
  margin: 0 12px;
}

.ai-avatar {
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ai-avatar img {
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.message-content {
  width: fit-content;
  max-width: 50%;
  overflow-wrap: break-word;
  word-break: break-word;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.message-user .message-header {
  justify-content: flex-end;
}

.message-sender {
  font-weight: 600;
  color: #fff;
  font-size: 14px;
}

.message-time {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.message-body {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  padding: 12px 16px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(8px);
  position: relative;
  overflow: hidden;
}

.message-user .message-body {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.user-message,
.ai-content {
  color: #fff;
  line-height: 1.6;
  word-wrap: break-word;
  overflow-wrap: break-word;
  word-break: break-word;
  white-space: pre-wrap;
  max-width: 100%;
  text-align: left;
}

.tool-calls-info {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  gap: 8px;
  animation: tool-info-fade-in 0.5s ease-in-out;
}

.tool-calls-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 12px;
  color: rgba(255, 255, 255, 0.95);
  transition: all 0.3s ease;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(5px);
}

.tool-calls-tag:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.15);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
}

.tool-call-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.streaming .message-body {
  position: relative;
}

.streaming-content {
  margin-bottom: 8px;
}

.streaming .message-header {
  animation: header-glow 2s ease-in-out infinite;
}

/* 处理中状态样式 */
.processing-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 0;
  opacity: 0.9;
}

.processing-dots {
  display: flex;
  gap: 4px;
  align-items: center;
}

.processing-dots span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: linear-gradient(45deg, #409EFF, #66B2FF);
  animation: processing-bounce 1.4s infinite ease-in-out;
}

.processing-dots span:nth-child(1) {
  animation-delay: 0s;
}

.processing-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.processing-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

.processing-text {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  font-style: italic;
}

.streaming-content {
  animation: content-fade-in 0.3s ease-in-out;
}

.empty-messages {
  text-align: center;
  color: rgba(255, 255, 255, 0.6);
  padding: 40px 0;
}

.input-container {
  padding: 16px;
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.input-wrapper {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  width: 100%;
  position: relative;
  box-sizing: border-box;
}

.message-input {
  flex: 1;
  border: none;
  background: transparent;
  min-width: 0;
  box-sizing: border-box;
}

.message-input :deep(.el-textarea__inner) {
  background: transparent;
  border: none;
  color: #fff;
  resize: none;
  padding: 12px 16px;
  font-size: 14px;
  line-height: 1.5;
  border-radius: 8px;
  border: 1px solid transparent;
  min-height: 40px;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.message-input :deep(.el-textarea__inner):focus {
  box-shadow: 0 0 0 1px rgba(64, 158, 255, 0.3), 0 0 8px rgba(64, 158, 255, 0.2);
  border-color: rgba(64, 158, 255, 0.5);
  outline: none;
}

.message-input :deep(.el-textarea__inner)::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.send-btn {
  height: 40px;
  min-width: 80px;
  max-width: 120px;
  background: #409EFF;
  border: 1px solid #409EFF;
  border-radius: 8px;
  color: white;
  font-weight: 500;
  flex-shrink: 0;
  position: relative;
  box-sizing: border-box;
}

.send-btn:hover:not(:disabled) {
  background: #66B2FF;
  border-color: #66B2FF;
}

.send-btn:disabled {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.3);
}

/* 动画 */
@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-10px);
    opacity: 1;
  }
}

@keyframes status-pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
    box-shadow: 0 0 10px rgba(64, 158, 255, 0.6);
  }
  50% {
    transform: scale(1.3);
    opacity: 0.7;
    box-shadow: 0 0 20px rgba(64, 158, 255, 0.8);
  }
}

@keyframes header-glow {
  0%, 100% {
    text-shadow: 0 0 5px rgba(64, 158, 255, 0.4);
  }
  50% {
    text-shadow: 0 0 15px rgba(64, 158, 255, 0.7);
  }
}

@keyframes processing-bounce {
  0%, 80%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1.2);
    opacity: 1;
  }
}

@keyframes tool-info-fade-in {
  0% {
    opacity: 0;
    transform: translateY(10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes content-fade-in {
  0% {
    opacity: 0;
    transform: translateY(5px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 开场白样式 */
.greetings-container {
  margin-bottom: 16px;
}

.greeting-title {
  font-size: 16px;
  font-weight: 600;
  color: #409EFF;
  margin-bottom: 8px;
  padding-bottom: 4px;
  border-bottom: 1px solid rgba(64, 158, 255, 0.2);
}

.tool-names-display {
  margin-top: 12px;
  padding: 12px;
  background: rgba(64, 158, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(64, 158, 255, 0.1);
}

.tool-names-display .tool-name {
  display: inline-block;
  margin: 4px 8px 4px 0;
  padding: 4px 8px;
  background: rgba(64, 158, 255, 0.1);
  border-radius: 4px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .message-content {
    max-width: 85%;
  }
  
  .tool-names-list {
    gap: 8px;
  }
  
  .tool-name-tag {
    min-width: 100px;
    padding: 10px 16px;
    font-size: 13px;
  }
  
  .processing-indicator {
    padding: 12px 0;
  }
  
  .processing-text {
    font-size: 13px;
  }
}

/* 深色主题适配 */
@media (prefers-color-scheme: dark) {
  .processing-dots span {
    background: linear-gradient(45deg, #409EFF, #66B2FF);
  }
  
  .tool-calls-info {
    border-top-color: rgba(255, 255, 255, 0.08);
  }
}
</style>