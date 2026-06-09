<template>
  <div class="tool-call-list" :class="{ 'collapsed': isCollapsed }">
    <div class="list-header">
      <div class="header-content">
        <h3 class="header-title">
          <img src="/src/assets/svg/工具调用.svg" class="header-icon" alt="工具调用"/>
          工具调用详情
        </h3>
      </div>
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

    <div class="tool-calls-content">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <el-icon class="is-loading" size="32" color="#FF6F61">
          <Loading />
        </el-icon>
        <p>加载中...</p>
      </div>

      <!-- 空状态：未选择对话 -->
      <div v-else-if="!conversationId" class="empty-state">
        <el-empty description="请选择对话查看工具调用信息" />
      </div>

      <!-- 空状态：无工具调用记录 -->
      <div v-else-if="shouldShowEmpty" class="empty-state">
        <el-empty description="当前对话暂无最新工具调用记录" />
      </div>

      <!-- 工具列表 -->
      <div v-else-if="allToolsList.length > 0" class="tools-list">
        <div 
          v-for="tool in allToolsList" 
          :key="`${tool.recordId}-${tool.toolName}`"
          class="tool-item"
        >
          <div class="tool-basic-info">
            <div class="tool-name">{{ tool.toolName }}</div>
            <div class="tool-time">{{ tool.formattedTime }}</div>
          </div>
          
          <div class="tool-details">
            <div class="detail-row">
              <span class="label">提供商</span>
              <span class="value provider">{{ tool.toolProvider || '未知' }}</span>
            </div>
            
            <div class="detail-row">
              <span class="label">状态</span>
              <span class="value status" :class="tool.status === 1 ? 'active' : 'inactive'">
                {{ tool.statusDesc || '未知' }}
              </span>
            </div>
            
            <div class="detail-row">
              <span class="label">使用次数</span>
              <span class="value usage">{{ tool.usageCount || 0 }}</span>
            </div>
            
            <div class="detail-row description-row" v-if="tool.toolDescription">
              <span class="label">描述</span>
              <span class="value description">{{ tool.toolDescription }}</span>
            </div>
            
            <div class="detail-row" v-if="tool.officialWebsite">
              <span class="label">官网</span>
              <a 
                :href="tool.officialWebsite" 
                target="_blank" 
                class="value website"
              >
                {{ tool.officialWebsite }}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Expand, Fold, Loading } from '@element-plus/icons-vue'
import { getToolRecords, getToolConfigByName } from '../../api/tool'
import type { ToolRecord, ToolConfig } from '../../api/tool'

// Props
interface Props {
  conversationId: string
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'panel-collapsed': [isCollapsed: boolean]
}>()

// 响应式数据
const loading = ref(false)
const toolRecords = ref<ToolRecord[]>([])
const isCollapsed = ref(false)
const isInitialized = ref(false)
const toolConfigs = ref<Map<string, ToolConfig>>(new Map())
const loadingToolConfigs = ref(false)

// 计算属性 - 只展示最新一次工具调用记录
const allToolsList = computed(() => {
  const toolsList: Array<{
    recordId: number
    toolName: string
    formattedTime: string
    toolProvider?: string
    status?: number
    statusDesc?: string
    usageCount?: number
    toolDescription?: string
    officialWebsite?: string
  }> = []

  // 找到最新的有工具调用的记录
  const latestToolRecord = toolRecords.value
    .filter(record => record.hasToolCalls && record.toolsCalledList && record.toolsCalledList.length > 0)
    .sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime())[0]

  // 如果找到最新记录，提取其工具信息
  if (latestToolRecord && latestToolRecord.toolsCalledList) {
    latestToolRecord.toolsCalledList.forEach(toolName => {
      const toolConfig = toolConfigs.value.get(toolName)
      toolsList.push({
        recordId: latestToolRecord.id,
        toolName: toolName,
        formattedTime: latestToolRecord.formattedTime,
        toolProvider: toolConfig?.toolProvider,
        status: toolConfig?.status,
        statusDesc: toolConfig?.statusDesc,
        usageCount: toolConfig?.usageCount,
        toolDescription: toolConfig?.toolDescription,
        officialWebsite: toolConfig?.officialWebsite
      })
    })
  }

  return toolsList
})

// 计算属性 - 控制是否显示空状态
const shouldShowEmpty = computed(() => {
  return props.conversationId && 
         allToolsList.value.length === 0 && 
         !loading.value && 
         isInitialized.value
})

// 方法
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
  emit('panel-collapsed', isCollapsed.value)
}

// 获取工具配置信息
const loadToolConfigs = async (toolNames: string[]) => {
  if (toolNames.length === 0) return

  loadingToolConfigs.value = true
  try {
    const promises = toolNames.map(async (toolName) => {
      if (!toolConfigs.value.has(toolName)) {
        try {
          const result = await getToolConfigByName(toolName)
          if (result.success && result.data) {
            toolConfigs.value.set(toolName, result.data)
          }
        } catch (error) {
          console.error(`获取工具配置失败 ${toolName}:`, error)
        }
      }
    })
    
    await Promise.all(promises)
  } finally {
    loadingToolConfigs.value = false
  }
}

const loadToolRecords = async () => {
  if (!props.conversationId) {
    toolRecords.value = []
    isInitialized.value = true
    loading.value = false
    return
  }

  loading.value = true
  try {
    const result = await getToolRecords(props.conversationId)
    if (result.success) {
      // 使用平滑更新而不是直接替换，避免闪烁
      const newRecords = result.data || []
      
      // 检查是否有实际变化，避免不必要的更新
      if (JSON.stringify(toolRecords.value) !== JSON.stringify(newRecords)) {
        toolRecords.value = newRecords
      }
      
      // 获取所有工具名称
      const allToolNames = new Set<string>()
      toolRecords.value.forEach(record => {
        if (record.hasToolCalls && record.toolsCalledList) {
          record.toolsCalledList.forEach(toolName => {
            allToolNames.add(toolName)
          })
        }
      })
      
      // 加载工具配置信息
      if (allToolNames.size > 0) {
        await loadToolConfigs(Array.from(allToolNames))
      }
    } else {
      console.error('加载工具调用记录失败:', result.message)
      toolRecords.value = []
    }
  } catch (error) {
    console.error('加载工具调用记录失败:', error)
    toolRecords.value = []
  } finally {
    loading.value = false
    isInitialized.value = true
  }
}

// 监听对话ID变化
watch(() => props.conversationId, () => {
  loadToolRecords()
}, { immediate: true })

// 重置状态方法
const resetState = () => {
  isCollapsed.value = false
  isInitialized.value = false
  loading.value = false
  emit('panel-collapsed', false)
}

// 暴露方法给父组件
defineExpose({
  loadToolRecords,
  refresh: loadToolRecords,
  resetState
})
</script>

<style scoped>
.tool-call-list {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: rgba(0, 0, 0, 0.15);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  margin-left: auto;
}

.list-header {
  padding: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.02);
}

.header-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.header-title {
  margin: 0;
  color: rgba(255, 255, 255, 0.9);
  font-size: 16px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-icon {
  width: 20px;
  height: 20px;
  opacity: 0.8;
}

.collapse-btn {
  color: rgba(255, 255, 255, 0.6);
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.collapse-btn:hover {
  color: rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.05);
}

/* 收缩状态下的样式 */
.tool-call-list.collapsed {
  width: 64px;
  min-width: 64px;
  max-width: 64px;
  overflow: hidden;
}

.tool-call-list.collapsed .list-header {
  padding: 12px 8px;
  justify-content: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
  min-height: 56px;
  max-height: 56px;
}

.tool-call-list.collapsed .header-content {
  display: none;
}

.tool-call-list.collapsed .list-header .collapse-btn {
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

.tool-call-list.collapsed .tool-calls-content {
  display: none;
}

.tool-calls-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  min-height: 0;
  max-height: calc(100% - 80px);
}

.loading-container,
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: rgba(255, 255, 255, 0.5);
}

.loading-container {
  flex-direction: column;
  color: rgba(255, 255, 255, 0.6);
}

.loading-container p {
  margin-top: 16px;
  font-size: 16px;
}

.tools-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tool-item {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  padding: 12px;
  min-height: 130px;
  max-height: 180px;
  overflow: hidden;
}

.tool-basic-info {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  gap: 12px;
}

.tool-name {
  font-size: 14px;
  font-weight: 500;
  color: #87ceeb; /* 淡蓝色 */
  letter-spacing: 0.5px;
  word-break: break-all;
  word-wrap: break-word;
  line-height: 1.4;
  max-width: 200px;
  flex: 1;
}

.tool-time {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  white-space: nowrap;
  flex-shrink: 0;
  margin-top: 2px;
}

.tool-details {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.detail-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 12px;
  line-height: 1.4;
}

.detail-row.description-row {
  align-items: flex-start;
}

.detail-row .label {
  font-weight: 500;
  color: rgba(255, 255, 255, 0.6);
  min-width: 50px;
  flex-shrink: 0;
}

.detail-row .value {
  flex: 1;
  word-break: break-word;
}

.detail-row .value.provider {
  color: #98fb98; /* 淡绿色 */
  font-weight: 500;
}

.detail-row .value.status.active {
  color: #90ee90; /* 浅绿色 */
  font-weight: 500;
}

.detail-row .value.status.inactive {
  color: #ffa07a; /* 浅橙色 */
  font-weight: 500;
}

.detail-row .value.usage {
  color: #dda0dd; /* 淡紫色 */
  font-weight: 500;
}

.detail-row .value.description {
  color: #f0e68c; /* 淡黄色 */
  line-height: 1.3;
  max-height: 32px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.detail-row .value.website {
  color: #87cefa; /* 淡天蓝色 */
  text-decoration: none;
  font-size: 11px;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detail-row .value.website:hover {
  color: #add8e6;
  text-decoration: underline;
}

/* 滚动条样式 */
.tool-calls-content::-webkit-scrollbar {
  width: 3px;
}

.tool-calls-content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 2px;
}

.tool-calls-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}

.tool-calls-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .tool-call-list {
    min-width: 280px;
  }
  
  .tool-item {
    min-height: 100px;
    max-height: 140px;
  }
  
  .detail-row {
    font-size: 11px;
  }
  
  .tool-name {
    font-size: 13px;
  }
}
</style>