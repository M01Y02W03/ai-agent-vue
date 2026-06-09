<template>
  <div class="conversation-list" :class="{ 'collapsed': isCollapsed }">
    <div class="list-header">
      <h3 class="header-title">
        历史会话
      </h3>
      <el-button 
        type="text" 
        @click="toggleCollapse"
        class="collapse-btn"
      >
        <el-icon>
          <Expand v-if="isCollapsed"/>
          <Fold v-else/>
        </el-icon>
      </el-button>
    </div>

    <div class="conversation-items" :class="{ 'collapsed': isCollapsed }">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <el-icon class="is-loading" size="32" color="#FF6F61">
          <Loading />
        </el-icon>
        <p>加载中...</p>
      </div>

      <!-- 对话列表内容 -->
      <div v-else class="conversation-list-wrapper">
        <div 
          v-for="conversation in conversations" 
          :key="conversation.id"
          :class="['conversation-item', { 'active': selectedConversationId === conversation.id }]"
          @click="selectConversation(conversation.id)"
          v-show="!isCollapsed"
        >
          <div class="conversation-content">
            <div class="conversation-title">{{ conversation.title }}</div>
            <div class="conversation-meta">
              <span class="create-time">{{ conversation.createTime }}</span>
              <span class="remaining-count">剩余: {{ conversation.remainingCount }}</span>
            </div>
            <div class="conversation-status" v-if="conversation.isMaxConversation">
              <el-tag type="warning" size="small">已达上限</el-tag>
            </div>
          </div>
          <div class="conversation-actions">
            <el-button 
              type="text" 
              size="small" 
              @click.stop="deleteConversation(conversation.id)"
              class="delete-btn"
            >
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="conversations.length === 0 && !isCollapsed && isInitialized" class="empty-state">
          <el-empty description="暂无对话记录" />
        </div>
      </div>

      <!-- 新建对话按钮 -->
      <el-button 
        type="text" 
        size="small" 
        @click="createNewConversation"
        class="new-chat-btn"
        :class="{ 'collapsed': isCollapsed }"
      >
        <el-icon><Plus /></el-icon>
        <span v-show="!isCollapsed">新建对话</span>
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete, Expand, Fold, Loading } from '@element-plus/icons-vue'
import { getToolConversations, generateConversationId } from '../../api/tool'
import type { ToolConversation } from '../../api/tool'

// Props
interface Props {
  selectedConversationId?: string
}

const props = withDefaults(defineProps<Props>(), {
  selectedConversationId: ''
})

// Emits
const emit = defineEmits<{
  'conversation-selected': [conversationId: string]
  'conversation-created': [conversationId: string]
  'panel-collapsed': [isCollapsed: boolean]
}>()

// 响应式数据
const loading = ref(true) // 初始状态设为true，避免空状态闪烁
const conversations = ref<ToolConversation[]>([])
const isCollapsed = ref(false)
const isInitialized = ref(false) // 添加初始化标志

// 方法
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
  emit('panel-collapsed', isCollapsed.value)
}

const loadConversations = async () => {
  loading.value = true
  try {
    const result = await getToolConversations()
    if (result.success) {
      conversations.value = result.data || []
    } else {
      ElMessage.error(result.message || '加载对话列表失败')
    }
  } catch (error) {
    console.error('加载对话列表失败:', error)
    ElMessage.error('加载对话列表失败')
  } finally {
    loading.value = false
    isInitialized.value = true // 标记为已初始化
  }
}

const selectConversation = (conversationId: string) => {
  emit('conversation-selected', conversationId)
}

const createNewConversation = () => {
  const newConversationId = generateConversationId()
  emit('conversation-created', newConversationId)
}

const deleteConversation = async (conversationId: string) => {
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
    
    // 这里应该调用删除API，但接口文档中没有提供删除接口
    // 暂时只从本地列表中移除
    conversations.value = conversations.value.filter(conv => conv.id !== conversationId)
    ElMessage.success('对话已删除')
    
    // 如果删除的是当前选中的对话，则清空选择
    if (props.selectedConversationId === conversationId) {
      emit('conversation-selected', '')
    }
  } catch {
    // 用户取消删除
  }
}

// 监听选中的对话ID变化
watch(() => props.selectedConversationId, (_newId) => {
  // 可以在这里添加一些逻辑，比如滚动到选中项
})

// 生命周期
onMounted(() => {
  loadConversations()
})

// 重置组件状态的方法
const resetState = () => {
  isCollapsed.value = false
  isInitialized.value = false
  loading.value = true
  emit('panel-collapsed', false)
  // 重置状态后重新加载数据
  loadConversations()
}

// 暴露方法给父组件
defineExpose({
  loadConversations,
  resetState
})
</script>

<style scoped>
.conversation-list {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.6s ease;
}

.list-header {
  padding: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  z-index: 1000;
}

.header-title {
  margin: 0;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.collapse-btn {
  color: rgba(255, 255, 255, 0.7) !important;
  padding: 4px;
  background: transparent;
  border: none;
  transition: all 0.3s ease;
  min-width: auto;
  min-height: auto;
  outline: none !important;
  box-shadow: none !important;
}

.collapse-btn:focus {
  outline: none !important;
  box-shadow: none !important;
  background: transparent !important;
  border: none !important;
}

.collapse-btn:active {
  outline: none !important;
  box-shadow: none !important;
  background: transparent !important;
}

.collapse-btn .el-icon {
  color: inherit;
  font-size: 16px;
}

.new-chat-btn {
  width: calc(100% - 16px);
  margin: 8px 8px 16px 8px;
  margin-top: auto;
  color: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 14px;
  min-height: 44px;
  transition: all 0.3s ease;
  outline: none !important;
  box-shadow: none !important;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.new-chat-btn:hover {
  color: rgba(255, 255, 255, 0.8);
  border-color: rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.05);
}

.new-chat-btn:focus {
  outline: none !important;
  box-shadow: none !important;
  border-color: rgba(255, 255, 255, 0.3);
}

.new-chat-btn:active {
  outline: none !important;
  box-shadow: none !important;
}

.conversation-items {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.conversation-list-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 6px 6px 0 6px;
  min-height: 0;
}

.conversation-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px;
  margin-bottom: 6px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid transparent;
}


.conversation-content {
  flex: 1;
  min-width: 0;
}

.conversation-title {
  color: #fff;
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
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 4px;
}

.conversation-status {
  margin-top: 4px;
}

.conversation-actions {
  opacity: 0;
  transition: opacity 0.3s ease;
}

.conversation-item:hover .conversation-actions {
  opacity: 1;
}

.delete-btn {
  color: rgba(255, 255, 255, 0.6);
  padding: 4px;
}

.loading-container,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: rgba(255, 255, 255, 0.6);
}

.loading-container p {
  margin-top: 16px;
  font-size: 16px;
}

.conversation-list-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  min-height: 0;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

.conversation-list-wrapper::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}



/* 收缩状态下的样式 */
.conversation-items.collapsed {
  padding: 0;
  overflow: hidden;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.conversation-items.collapsed .conversation-list-wrapper {
  display: none;
}

/* 收缩状态下的头部样式 */
.conversation-list.collapsed {
  width: 64px;
  min-width: 64px;
  max-width: 64px;
  overflow: hidden;
}

.conversation-list.collapsed .list-header {
  padding: 12px 8px;
  justify-content: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
  min-height: 56px;
  max-height: 56px;
}

.conversation-list.collapsed .list-header .header-title {
  display: none;
}

.conversation-list.collapsed .list-header .collapse-btn {
  width: auto;
  height: auto;
  justify-content: center;
  margin: 0;
  background: transparent !important;
  border: none !important;
  padding: 8px !important;
  min-width: auto;
  min-height: auto;
}

.conversation-list.collapsed .conversation-item {
  display: none;
}

.conversation-list.collapsed .empty-state {
  display: none;
}

.new-chat-btn.collapsed {
  width: 48px;
  height: 48px;
  margin: 12px 8px;
  padding: 0;
  border-radius: 50%;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: center;
  align-items: center;
  outline: none !important;
  box-shadow: none !important;
  min-width: 48px;
  min-height: 48px;
}

.new-chat-btn.collapsed:focus {
  outline: none !important;
  box-shadow: none !important;
  border-color: rgba(255, 255, 255, 0.3);
}

.new-chat-btn.collapsed:active {
  outline: none !important;
  box-shadow: none !important;
}

.new-chat-btn.collapsed .el-icon {
  margin-right: 0;
  font-size: 20px;
}

.new-chat-btn.collapsed span {
  display: none;
}

/* Element Plus 按钮样式覆盖 - 消除蓝色闪烁效果 */
.conversation-list :deep(.el-button) {
  outline: none !important;
  box-shadow: none !important;
}

.conversation-list :deep(.el-button:focus) {
  outline: none !important;
  box-shadow: none !important;
}

.conversation-list :deep(.el-button:active) {
  outline: none !important;
  box-shadow: none !important;
}

/* 隐藏滚动条 */
.conversation-items {
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

.conversation-items::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}

</style>