<template>
  <div class="time-range-selector">
    <div class="selector-content">
      <div class="quick-options">
        <el-button
          v-for="option in quickOptions"
          :key="option.value"
          :type="selectedQuick === option.value ? 'primary' : 'default'"
          size="small"
          @click="selectQuickOption(option)"
          class="quick-btn"
        >
          {{ option.label }}
        </el-button>
      </div>
      
      <div class="custom-range">
        <el-date-picker
          v-model="customRange"
          type="datetimerange"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          format="YYYY-MM-DD HH:mm:ss"
          value-format="YYYY-MM-DD HH:mm:ss"
          @change="handleCustomRangeChange"
          size="small"
          class="range-picker"
        />
      </div>
    </div>
    
    <div class="actions">
      <el-button 
        type="primary" 
        size="small" 
        @click="applyTimeRange"
        :loading="loading"
        class="action-btn"
      >
        应用
      </el-button>
      <el-button 
        size="small" 
        @click="resetTimeRange"
        class="action-btn"
      >
        重置
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import dayjs from 'dayjs'

// Props
interface Props {
  loading?: boolean
  defaultRange?: string
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  defaultRange: 'today'
})

// Emits
const emit = defineEmits<{
  'time-change': [{ startTime: string, endTime: string, type: string }]
}>()

// 响应式数据
const selectedQuick = ref(props.defaultRange)
const customRange = ref<[string, string] | null>(null)

// 快捷选项
const quickOptions = [
  { label: '今天', value: 'today' },
  { label: '昨天', value: 'yesterday' },
  { label: '近3天', value: '3days' },
  { label: '近7天', value: '7days' },
  { label: '近30天', value: '30days' }
]

// 计算当前时间范围
const currentTimeRange = computed(() => {
  const now = dayjs()
  
  switch (selectedQuick.value) {
    case 'today':
      return {
        startTime: now.startOf('day').format('YYYY-MM-DD HH:mm:ss'),
        endTime: now.endOf('day').format('YYYY-MM-DD HH:mm:ss'),
        type: 'today'
      }
    case 'yesterday':
      const yesterday = now.subtract(1, 'day')
      return {
        startTime: yesterday.startOf('day').format('YYYY-MM-DD HH:mm:ss'),
        endTime: yesterday.endOf('day').format('YYYY-MM-DD HH:mm:ss'),
        type: 'yesterday'
      }
    case '3days':
      return {
        startTime: now.subtract(2, 'day').startOf('day').format('YYYY-MM-DD HH:mm:ss'),
        endTime: now.endOf('day').format('YYYY-MM-DD HH:mm:ss'),
        type: '3days'
      }
    case '7days':
      return {
        startTime: now.subtract(6, 'day').startOf('day').format('YYYY-MM-DD HH:mm:ss'),
        endTime: now.endOf('day').format('YYYY-MM-DD HH:mm:ss'),
        type: '7days'
      }
    case '30days':
      return {
        startTime: now.subtract(29, 'day').startOf('day').format('YYYY-MM-DD HH:mm:ss'),
        endTime: now.endOf('day').format('YYYY-MM-DD HH:mm:ss'),
        type: '30days'
      }
    case 'custom':
      if (customRange.value) {
        return {
          startTime: customRange.value[0],
          endTime: customRange.value[1],
          type: 'custom'
        }
      }
      return {
        startTime: now.startOf('day').format('YYYY-MM-DD HH:mm:ss'),
        endTime: now.endOf('day').format('YYYY-MM-DD HH:mm:ss'),
        type: 'today'
      }
    default:
      return {
        startTime: now.startOf('day').format('YYYY-MM-DD HH:mm:ss'),
        endTime: now.endOf('day').format('YYYY-MM-DD HH:mm:ss'),
        type: 'today'
      }
  }
})

// 选择快捷选项
const selectQuickOption = (option: { label: string, value: string }) => {
  selectedQuick.value = option.value
  customRange.value = null
}

// 处理自定义时间范围变化
const handleCustomRangeChange = (value: [string, string] | null) => {
  if (value) {
    selectedQuick.value = 'custom'
  }
}

// 应用时间范围
const applyTimeRange = () => {
  emit('time-change', currentTimeRange.value)
}

// 重置时间范围
const resetTimeRange = () => {
  selectedQuick.value = 'today'
  customRange.value = null
  emit('time-change', currentTimeRange.value)
}

// 监听快捷选项变化，自动应用
watch(selectedQuick, () => {
  if (selectedQuick.value !== 'custom') {
    applyTimeRange()
  }
})

// 初始化时应用默认时间范围
applyTimeRange()
</script>

<style scoped>
.time-range-selector {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  min-height: 48px;
}

.selector-content {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.quick-options {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.quick-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.quick-btn:hover {
  background: rgba(74, 144, 226, 0.3);
  border-color: #4A90E2;
}

.quick-btn.el-button--primary {
  background: #4A90E2;
  border-color: #4A90E2;
  color: #fff;
}

.custom-range {
  flex: 1;
  max-width: 320px;
  min-width: 280px;
}

.range-picker {
  width: 100%;
}

.range-picker :deep(.el-input__wrapper) {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
}

.range-picker :deep(.el-input__inner) {
  color: #fff !important;
}

.range-picker :deep(.el-input__inner::placeholder) {
  color: rgba(255, 255, 255, 0.6) !important;
}

.range-picker :deep(.el-range-input) {
  color: #fff !important;
}

.range-picker :deep(.el-range-input::placeholder) {
  color: rgba(255, 255, 255, 0.6) !important;
}

.range-picker :deep(.el-date-editor__editor-wrap) {
  color: #fff !important;
}

.range-picker :deep(.el-date-editor .el-input__inner) {
  color: #fff !important;
}

.range-picker :deep(.el-date-editor .el-input__inner::placeholder) {
  color: rgba(255, 255, 255, 0.6) !important;
}

.range-picker :deep(.el-date-editor .el-range-input) {
  color: #fff !important;
}

.range-picker :deep(.el-date-editor .el-range-input::placeholder) {
  color: rgba(255, 255, 255, 0.6) !important;
}

.range-picker :deep(.el-range-separator) {
  color: #fff !important;
}

.range-picker :deep(.el-date-editor .el-range__icon) {
  color: rgba(255, 255, 255, 0.8) !important;
}

.range-picker :deep(.el-date-editor .el-range__close-icon) {
  color: rgba(255, 255, 255, 0.8) !important;
}

/* 额外的样式确保所有文字都是白色 */
.range-picker :deep(.el-date-editor) {
  color: #fff !important;
}

.range-picker :deep(.el-date-editor input) {
  color: #fff !important;
}

.range-picker :deep(.el-date-editor input::placeholder) {
  color: rgba(255, 255, 255, 0.6) !important;
}

/* 强制覆盖所有可能的输入框样式 */
.time-range-selector :deep(.el-date-editor) {
  color: #fff !important;
}

.time-range-selector :deep(.el-date-editor input) {
  color: #fff !important;
}

.time-range-selector :deep(.el-date-editor input::placeholder) {
  color: rgba(255, 255, 255, 0.6) !important;
}

.time-range-selector :deep(.el-input__inner) {
  color: #fff !important;
}

.time-range-selector :deep(.el-input__inner::placeholder) {
  color: rgba(255, 255, 255, 0.6) !important;
}

.time-range-selector :deep(.el-range-input) {
  color: #fff !important;
}

.time-range-selector :deep(.el-range-input::placeholder) {
  color: rgba(255, 255, 255, 0.6) !important;
}

.time-range-selector :deep(.el-range-separator) {
  color: #fff !important;
}

.actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
  margin-left: auto;
}

.action-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  min-width: 60px;
  transition: all 0.3s ease;
}

.action-btn.el-button--primary {
  background: #4A90E2;
  border-color: #4A90E2;
}

.action-btn:hover {
  background: rgba(74, 144, 226, 0.3);
  border-color: #4A90E2;
}

.action-btn.el-button--primary:hover {
  background: #3A7BC8;
  border-color: #3A7BC8;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .time-range-selector {
    flex-wrap: wrap;
    gap: 12px;
  }
  
  .selector-content {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    width: 100%;
  }
  
  .quick-options {
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .custom-range {
    max-width: 100%;
    min-width: auto;
  }
  
  .actions {
    justify-content: center;
    margin-left: 0;
  }
}

@media (max-width: 768px) {
  .time-range-selector {
    flex-direction: column;
    gap: 12px;
    padding: 16px;
  }
  
  .selector-content {
    width: 100%;
  }
  
  .quick-options {
    justify-content: center;
  }
  
  .quick-btn {
    flex: 1;
    min-width: 60px;
  }
  
  .actions {
    width: 100%;
    justify-content: center;
  }
  
  .action-btn {
    flex: 1;
    max-width: 120px;
  }
}

@media (max-width: 480px) {
  .quick-options {
    flex-direction: column;
    gap: 6px;
  }
  
  .quick-btn {
    width: 100%;
  }
}
</style>