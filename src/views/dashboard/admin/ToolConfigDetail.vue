<template>
  <el-drawer
    v-model="visible"
    title="工具配置详情"
    direction="rtl"
    size="600px"
    :before-close="handleClose"
    class="tool-config-drawer"
  >
    <div v-loading="loading" class="drawer-body">
      <!-- 工具基本信息 -->
      <div class="config-section">
        <div class="section-header">
          <div class="header-left">
            <el-icon class="section-icon"><Tools /></el-icon>
            <h3 class="section-title">基本信息</h3>
          </div>
          <div class="header-actions">
            <el-button 
              type="primary" 
              size="small" 
              @click="editMode = !editMode"
            >
              {{ editMode ? '保存' : '编辑' }}
            </el-button>
            <el-button 
              :type="configData.status === 1 ? 'warning' : 'success'" 
              size="small"
              @click="toggleStatus"
              :loading="statusLoading"
            >
              {{ configData.status === 1 ? '禁用' : '启用' }}
            </el-button>
          </div>
        </div>
        
        <el-form :model="configData" label-width="100px" label-position="left" class="config-form">
          <el-form-item label="工具名称">
            <el-input 
              v-model="configData.toolName" 
              :readonly="!editMode"
              :class="{ 'readonly-input': !editMode }"
            />
          </el-form-item>
          
          <el-form-item label="提供商">
            <el-input 
              v-model="configData.toolProvider" 
              :readonly="!editMode"
              :class="{ 'readonly-input': !editMode }"
            />
          </el-form-item>
          
          <el-form-item label="端点URL">
            <el-input 
              v-model="configData.toolUrl" 
              :readonly="!editMode"
              :class="{ 'readonly-input': !editMode }"
              type="url"
            />
          </el-form-item>
          
          <el-form-item label="官方网站">
            <el-input 
              v-model="configData.officialWebsite" 
              :readonly="!editMode"
              :class="{ 'readonly-input': !editMode }"
              type="url"
            />
          </el-form-item>
          
          <el-form-item label="工具描述">
            <el-input 
              v-model="configData.toolDescription" 
              :readonly="!editMode"
              :class="{ 'readonly-input': !editMode }"
              type="textarea"
              :rows="3"
            />
          </el-form-item>
          
          <el-form-item label="状态">
            <el-tag 
              :type="configData.status === 1 ? 'success' : 'danger'" 
              size="large"
            >
              {{ configData.statusDesc || (configData.status === 1 ? '启用' : '禁用') }}
            </el-tag>
          </el-form-item>
        </el-form>
      </div>

      <!-- 使用统计 -->
      <div class="config-section">
        <div class="section-header">
          <div class="header-left">
            <el-icon class="section-icon"><DataAnalysis /></el-icon>
            <h3 class="section-title">使用统计</h3>
          </div>
          <el-button size="small" @click="refreshStats" :loading="statsLoading">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
        
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon total">
              <el-icon><TrendCharts /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ formatNumber(statistics.totalCalls) }}</div>
              <div class="stat-label">总调用次数</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon success">
              <el-icon><SuccessFilled /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.successRate.toFixed(1) }}%</div>
              <div class="stat-label">成功率</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon response">
              <el-icon><Timer /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.avgResponseTime.toFixed(0) }}ms</div>
              <div class="stat-label">平均响应时间</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon today">
              <el-icon><Calendar /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ formatNumber(statistics.todayCalls) }}</div>
              <div class="stat-label">今日调用</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 最近使用趋势 -->
      <div class="config-section">
        <div class="section-header">
          <div class="header-left">
            <el-icon class="section-icon"><TrendCharts /></el-icon>
            <h3 class="section-title">最近使用趋势</h3>
          </div>
        </div>
        
        <div ref="trendChartRef" class="trend-chart"></div>
      </div>

      <!-- 操作记录 -->
      <div class="config-section">
        <div class="section-header">
          <div class="header-left">
            <el-icon class="section-icon"><Document /></el-icon>
            <h3 class="section-title">操作记录</h3>
          </div>
        </div>
        
        <div class="operation-timeline">
          <el-timeline>
            <el-timeline-item
              v-for="(record, index) in operationRecords"
              :key="index"
              :timestamp="record.createTime"
              placement="top"
              :type="getTimelineType(record.operation)"
            >
              <div class="timeline-content">
                <div class="operation-title">{{ record.operation }}</div>
                <div class="operation-detail">{{ record.detail }}</div>
                <div class="operation-user">操作人: {{ record.operator }}</div>
              </div>
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>

      <!-- 危险操作区域 -->
      <div class="config-section danger-section">
        <div class="section-header">
          <div class="header-left">
            <el-icon class="section-icon danger-icon"><Warning /></el-icon>
            <h3 class="section-title">危险操作</h3>
          </div>
        </div>
        
        <div class="danger-content">
          <el-button 
            type="danger" 
            @click="showDeleteConfirm = true"
            :loading="deleteLoading"
            class="delete-btn"
          >
            <el-icon><Delete /></el-icon>
            删除配置
          </el-button>
          
          <p class="danger-warning">
            <el-icon><Warning /></el-icon>
            删除操作不可恢复，请谨慎操作
          </p>
        </div>
      </div>
    </div>

    <!-- 删除确认对话框 -->
    <el-dialog
      v-model="showDeleteConfirm"
      title="确认删除"
      width="400px"
      :before-close="() => showDeleteConfirm = false"
      class="delete-confirm-dialog"
      append-to-body
    >
      <div class="delete-confirm-content">
        <el-icon size="48" color="#dc3545"><Warning /></el-icon>
        <p class="confirm-text">确定要删除工具配置 <strong>{{ configData.toolName }}</strong> 吗？</p>
        <p class="warning-text">此操作不可恢复，请谨慎操作！</p>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showDeleteConfirm = false" class="cancel-btn">取消</el-button>
          <el-button type="danger" @click="confirmDelete" :loading="deleteLoading" class="confirm-btn">
            确认删除
          </el-button>
        </div>
      </template>
    </el-dialog>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Tools, 
  DataAnalysis, 
  Refresh, 
  TrendCharts, 
  SuccessFilled, 
  Timer, 
  Calendar,
  Document,
  Warning,
  Delete,
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { 
  toolConfigApi, 
  toolUsageApi,
  type ToolsConfigVo, 
  type ToolsUsageStatisticsVo 
} from '../../../api/tool'

// Props
interface Props {
  visible: boolean
  toolName?: string
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  toolName: ''
})

// Emits
const emit = defineEmits<{
  close: []
  refresh: []
}>()

// 响应式数据
const visible = ref(false)
const loading = ref(false)
const editMode = ref(false)
const statusLoading = ref(false)
const statsLoading = ref(false)
const deleteLoading = ref(false)
const showDeleteConfirm = ref(false)

const configData = ref<ToolsConfigVo>({
  id: 0,
  toolName: '',
  toolProvider: '',
  toolUrl: '',
  officialWebsite: '',
  toolDescription: '',
  status: 0,
  statusDesc: '',
  createdBy: '',
  updatedBy: '',
  createTime: '',
  updateTime: '',
  usageCount: 0
})

const statistics = ref<ToolsUsageStatisticsVo>({
  toolName: '',
  totalCalls: 0,
  successCalls: 0,
  failedCalls: 0,
  successRate: 0,
  avgResponseTime: 0,
  maxResponseTime: 0,
  minResponseTime: 0,
  todayCalls: 0,
  weekCalls: 0,
  monthCalls: 0,
  dailyUsage: [],
  hourlyUsage: []
})

const operationRecords = ref([
  {
    operation: '创建配置',
    detail: '初始化工具配置',
    operator: 'admin',
    createTime: '2024-01-15 10:30:00'
  },
  {
    operation: '更新配置',
    detail: '修改工具端点URL',
    operator: 'admin',
    createTime: '2024-01-14 15:20:00'
  },
  {
    operation: '启用工具',
    detail: '工具状态变更为启用',
    operator: 'admin',
    createTime: '2024-01-13 09:15:00'
  }
])

// 图表引用
const trendChartRef = ref<HTMLElement>()
let trendChart: echarts.ECharts | null = null

// 监听 visible 变化
watch(() => props.visible, (newVal) => {
  visible.value = newVal
  if (newVal && props.toolName) {
    loadConfigData()
  }
})

watch(visible, (newVal) => {
  if (!newVal) {
    emit('close')
  }
})

// 加载配置数据
const loadConfigData = async () => {
  if (!props.toolName) return
  
  loading.value = true
  try {
    await Promise.all([
      loadToolConfig(),
      loadStatistics()
    ])
    
    // 初始化图表
    await nextTick()
    initTrendChart()
  } catch (error) {
    console.error('加载配置数据失败:', error)
    ElMessage.error('加载配置数据失败')
  } finally {
    loading.value = false
  }
}

// 加载工具配置
const loadToolConfig = async () => {
  try {
    const result = await toolConfigApi.getByName(props.toolName)
    if (result.success) {
      configData.value = result.data
    }
  } catch (error) {
    console.error('加载工具配置失败:', error)
  }
}

// 加载统计数据
const loadStatistics = async () => {
  try {
    const result = await toolUsageApi.getStatistics(props.toolName)
    if (result.success) {
      statistics.value = result.data
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

// 初始化趋势图表
const initTrendChart = () => {
  if (!trendChartRef.value) return
  
  trendChart = echarts.init(trendChartRef.value)
  
  const dailyData = statistics.value.dailyUsage || []
  const dates = dailyData.map(item => item.date)
  const callCounts = dailyData.map(item => item.callCount)
  
  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#6c757d',
      textStyle: { color: '#333' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLine: { lineStyle: { color: '#6c757d' } },
      axisLabel: { color: '#6c757d' }
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#6c757d' } },
      axisLabel: { color: '#6c757d' },
      splitLine: { lineStyle: { color: '#e9ecef' } }
    },
    series: [{
      type: 'line',
      data: callCounts,
      smooth: true,
      lineStyle: { color: '#6c757d', width: 2 },
      areaStyle: { 
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(108, 117, 125, 0.2)' },
          { offset: 1, color: 'rgba(108, 117, 125, 0.05)' }
        ])
      },
      itemStyle: { color: '#6c757d' }
    }]
  }
  
  trendChart.setOption(option)
}

// 切换状态
const toggleStatus = async () => {
  statusLoading.value = true
  try {
    const newStatus = configData.value.status === 1 ? 0 : 1
    const result = await toolConfigApi.updateStatus(configData.value.id, newStatus)
    if (result.success) {
      configData.value.status = newStatus
      configData.value.statusDesc = newStatus === 1 ? '启用' : '禁用'
      ElMessage.success(`工具已${newStatus === 1 ? '启用' : '禁用'}`)
      emit('refresh')
    }
  } catch (error) {
    console.error('更新状态失败:', error)
    ElMessage.error('更新状态失败')
  } finally {
    statusLoading.value = false
  }
}

// 刷新统计数据
const refreshStats = async () => {
  statsLoading.value = true
  try {
    await loadStatistics()
    initTrendChart()
    ElMessage.success('统计数据已刷新')
  } catch (error) {
    console.error('刷新统计数据失败:', error)
    ElMessage.error('刷新统计数据失败')
  } finally {
    statsLoading.value = false
  }
}

// 确认删除
const confirmDelete = async () => {
  deleteLoading.value = true
  try {
    const result = await toolConfigApi.delete(configData.value.id)
    if (result.success) {
      ElMessage.success('工具配置已删除')
      showDeleteConfirm.value = false
      visible.value = false
      emit('refresh')
    }
  } catch (error) {
    console.error('删除配置失败:', error)
    ElMessage.error('删除配置失败')
  } finally {
    deleteLoading.value = false
  }
}

// 关闭抽屉
const handleClose = () => {
  if (editMode.value) {
    ElMessageBox.confirm('有未保存的更改，确定要关闭吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      editMode.value = false
      visible.value = false
    }).catch(() => {})
  } else {
    visible.value = false
  }
}

// 格式化数字
const formatNumber = (num: number) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

// 获取时间线类型
const getTimelineType = (operation: string) => {
  if (operation.includes('创建')) return 'success'
  if (operation.includes('更新') || operation.includes('修改')) return 'primary'
  if (operation.includes('启用')) return 'success'
  if (operation.includes('禁用')) return 'warning'
  if (operation.includes('删除')) return 'danger'
  return 'info'
}
</script>

<style scoped>
/* 抽屉整体样式 */
.tool-config-drawer :deep(.el-drawer__header) {
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  color: #333;
  padding: 20px;
  margin-bottom: 0;
}

.tool-config-drawer :deep(.el-drawer__body) {
  background: #ffffff;
  padding: 0;
}

/* 抽屉主体 */
.drawer-body {
  padding: 20px;
  height: 100%;
  overflow-y: auto;
  background: #ffffff;
}

/* 配置区块 */
.config-section {
  margin-bottom: 24px;
  padding: 20px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
}

/* 区块头部 */
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e9ecef;
}

.header-left {
  display: flex;
  align-items: center;
}

.section-icon {
  margin-right: 8px;
  color: #6c757d;
  font-size: 16px;
}

.section-title {
  margin: 0;
  color: #333;
  font-size: 16px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 8px;
}

/* 表单样式 */
.config-form :deep(.el-form-item__label) {
  color: #495057;
  font-weight: 500;
}

.config-form :deep(.el-input__wrapper) {
  background: #ffffff;
  border: 1px solid #ced4da;
  box-shadow: none;
}

.config-form :deep(.el-input__inner) {
  color: #495057;
}

.config-form :deep(.el-textarea__inner) {
  background: #ffffff;
  border: 1px solid #ced4da;
  color: #495057;
  box-shadow: none;
}

.readonly-input :deep(.el-input__wrapper) {
  background: #f8f9fa;
  border-color: #e9ecef;
}

.readonly-input :deep(.el-input__inner) {
  color: #6c757d;
}

/* 统计卡片网格 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 16px;
  background: #ffffff;
  border: 1px solid #e9ecef;
  border-radius: 6px;
}

.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  font-size: 18px;
}

.stat-icon.total {
  background: #e3f2fd;
  color: #1976d2;
}

.stat-icon.success {
  background: #e8f5e8;
  color: #2e7d32;
}

.stat-icon.response {
  background: #fff3e0;
  color: #f57c00;
}

.stat-icon.today {
  background: #f3e5f5;
  color: #7b1fa2;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #6c757d;
}

/* 图表样式 */
.trend-chart {
  height: 200px;
  width: 100%;
  background: #ffffff;
  border: 1px solid #e9ecef;
  border-radius: 6px;
}

/* 时间线样式 */
.operation-timeline {
  max-height: 300px;
  overflow-y: auto;
}

.operation-timeline :deep(.el-timeline-item__timestamp) {
  color: #6c757d;
  font-size: 12px;
}

.timeline-content {
  background: #ffffff;
  padding: 12px 16px;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  border-left: 3px solid #6c757d;
}

.operation-title {
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.operation-detail {
  color: #6c757d;
  font-size: 14px;
  margin-bottom: 4px;
}

.operation-user {
  color: #868e96;
  font-size: 12px;
}

/* 危险操作区域 */
.danger-section {
  border-color: #f8d7da;
  background: #f8d7da;
}

.danger-icon {
  color: #dc3545 !important;
}

.danger-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.delete-btn {
  flex-shrink: 0;
}

.danger-warning {
  margin: 0;
  color: #721c24;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
}

/* 删除确认对话框 */
.delete-confirm-dialog :deep(.el-dialog) {
  background: #ffffff;
}

.delete-confirm-dialog :deep(.el-dialog__header) {
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.delete-confirm-dialog :deep(.el-dialog__title) {
  color: #333;
}

.delete-confirm-dialog :deep(.el-button) {
  border-radius: 4px !important;
  font-weight: 500 !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  text-align: center !important;
  white-space: nowrap !important;
  min-height: 32px !important;
  padding: 8px 15px !important;
}

.delete-confirm-dialog :deep(.el-button span) {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 4px !important;
}

.delete-confirm-content {
  text-align: center;
  padding: 20px;
}

.confirm-text {
  margin: 16px 0 8px 0;
  color: #333;
  font-size: 16px;
}

.warning-text {
  color: #dc3545;
  font-size: 14px;
  margin: 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 0 0 0;
}

.cancel-btn {
  background: #f8f9fa !important;
  border-color: #6c757d !important;
  color: #6c757d !important;
}

.cancel-btn:hover {
  background: #e9ecef !important;
  border-color: #5a6268 !important;
  color: #5a6268 !important;
}

.confirm-btn {
  background: #dc3545 !important;
  border-color: #dc3545 !important;
  color: #ffffff !important;
}

.confirm-btn:hover {
  background: #c82333 !important;
  border-color: #bd2130 !important;
  color: #ffffff !important;
}

/* Element Plus 按钮全局样式覆盖 */
.tool-config-drawer :deep(.el-button) {
  border-radius: 4px !important;
  font-weight: 500 !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  text-align: center !important;
  white-space: nowrap !important;
  min-height: 32px !important;
  padding: 8px 15px !important;
}

.tool-config-drawer :deep(.el-button span) {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 4px !important;
}

/* 按钮样式优化 */
.el-button {
  border-radius: 4px;
  font-weight: 500;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  text-align: center !important;
  white-space: nowrap !important;
}

.el-button--primary {
  background: #007bff !important;
  border-color: #007bff !important;
  color: #ffffff !important;
}

.el-button--primary:hover {
  background: #0056b3 !important;
  border-color: #004085 !important;
  color: #ffffff !important;
}

.el-button--success {
  background: #28a745 !important;
  border-color: #28a745 !important;
  color: #ffffff !important;
}

.el-button--success:hover {
  background: #1e7e34 !important;
  border-color: #1c7430 !important;
  color: #ffffff !important;
}

.el-button--warning {
  background: #ffc107 !important;
  border-color: #ffc107 !important;
  color: #212529 !important;
}

.el-button--warning:hover {
  background: #e0a800 !important;
  border-color: #d39e00 !important;
  color: #212529 !important;
}

.el-button--danger {
  background: #dc3545 !important;
  border-color: #dc3545 !important;
  color: #ffffff !important;
}

.el-button--danger:hover {
  background: #c82333 !important;
  border-color: #bd2130 !important;
  color: #ffffff !important;
}

/* 删除按钮特殊样式 */
.delete-btn {
  background: #6c757d !important;
  border-color: #6c757d !important;
  color: #ffffff !important;
}

.delete-btn:hover {
  background: #dc3545 !important;
  border-color: #dc3545 !important;
  color: #ffffff !important;
}

/* 滚动条样式 */
.drawer-body::-webkit-scrollbar,
.operation-timeline::-webkit-scrollbar {
  width: 6px;
}

.drawer-body::-webkit-scrollbar-track,
.operation-timeline::-webkit-scrollbar-track {
  background: #f8f9fa;
  border-radius: 3px;
}

.drawer-body::-webkit-scrollbar-thumb,
.operation-timeline::-webkit-scrollbar-thumb {
  background: #ced4da;
  border-radius: 3px;
}

.drawer-body::-webkit-scrollbar-thumb:hover,
.operation-timeline::-webkit-scrollbar-thumb:hover {
  background: #adb5bd;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }
  
  .danger-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .delete-btn {
    width: 100%;
  }
}
</style>