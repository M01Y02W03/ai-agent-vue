<template>
  <div class="system-monitoring">
    <!-- 时间选择器 -->
    <div class="time-selector-wrapper">
      <TimeRangeSelector 
        :loading="globalLoading"
        default-range="30days"
        @time-change="handleTimeRangeChange"
      />
    </div>

    <!-- 概览卡片 -->
    <div class="overview-section">
      <el-row :gutter="20">
        <el-col :span="6" v-for="(metric, index) in overviewMetrics" :key="index">
          <div class="metric-card glass-card">
            <!-- 百分比趋势 - 右上角 -->
            <div class="metric-trend" :class="metric.trend">
              <el-icon :size="16">
                <component :is="metric.trend === 'up' ? 'TrendCharts' : 'Bottom'" />
              </el-icon>
              <span>{{ metric.changePercent }}%</span>
            </div>
            
            <!-- 主要内容区域 -->
            <div class="metric-main">
              <div class="metric-icon" :style="{ background: metric.color + '20', color: metric.color }">
                <el-icon :size="24">
                  <component :is="metric.icon" />
                </el-icon>
              </div>
              <div class="metric-info">
                <div class="metric-value">{{ formatNumber(metric.value) }}</div>
                <div class="metric-label">{{ metric.label }}</div>
              </div>
            </div>
            
            <!-- 描述信息 - 右下角 -->
            <div class="metric-subtitle" :class="getSubtitleClass(metric.subtitle)">{{ metric.subtitle }}</div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 图表区域 -->
    <div class="charts-section">
      <el-row :gutter="20">
        <!-- 调用趋势图 -->
        <el-col :span="12">
          <div class="chart-container glass-card">
            <div class="chart-header">
              <h3 class="chart-title">工具调用趋势分析</h3>
              <div class="chart-actions">
                <el-button size="small" @click="refreshTrendChart" :loading="trendLoading">
                  <el-icon><Refresh /></el-icon>
                </el-button>
              </div>
            </div>
            <div ref="trendChartRef" class="chart-content" v-loading="trendLoading"></div>
          </div>
        </el-col>

        <!-- 工具使用分布 -->
        <el-col :span="12">
          <div class="chart-container glass-card">
            <div class="chart-header">
              <h3 class="chart-title">工具使用分布饼图</h3>
              <div class="chart-actions">
                <el-button size="small" @click="refreshDistributionChart" :loading="distributionLoading">
                  <el-icon><Refresh /></el-icon>
                </el-button>
              </div>
            </div>
            <div ref="distributionChartRef" class="chart-content" v-loading="distributionLoading"></div>
          </div>
        </el-col>
      </el-row>

      <el-row :gutter="20" style="margin-top: 20px;">
        <!-- 成功率统计 -->
        <el-col :span="8">
          <div class="chart-container glass-card">
            <div class="chart-header">
              <h3 class="chart-title">工具性能雷达图</h3>
              <div class="chart-actions">
                <el-button size="small" @click="refreshSuccessChart" :loading="successLoading">
                  <el-icon><Refresh /></el-icon>
                </el-button>
              </div>
            </div>
            <div ref="successChartRef" class="chart-content" v-loading="successLoading"></div>
          </div>
        </el-col>

        <!-- 每小时调用量分析 -->
        <el-col :span="16">
          <div class="chart-container glass-card">
            <div class="chart-header">
              <h3 class="chart-title">每小时调用量分析</h3>
              <div class="chart-actions">
                <el-select 
                  v-model="selectedTool" 
                  placeholder="选择工具" 
                  size="small" 
                  style="width: 150px; margin-right: 8px;"
                  @change="refreshResponseChart"
                >
                  <el-option 
                    v-for="tool in toolList" 
                    :key="tool.toolName" 
                    :label="tool.toolName" 
                    :value="tool.toolName" 
                  />
                </el-select>
                <el-button size="small" @click="refreshResponseChart" :loading="responseLoading">
                  <el-icon><Refresh /></el-icon>
                </el-button>
              </div>
            </div>
            <div ref="responseChartRef" class="chart-content" v-loading="responseLoading"></div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 工具配置信息 -->
    <div class="config-section">
      <div class="section-header">
        <h3 class="section-title">工具配置信息</h3>
        <div class="section-actions">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索工具..."
            size="small"
            style="width: 200px; margin-right: 10px;"
            @input="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-button size="small" @click="refreshToolConfigs" :loading="configLoading">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </div>

      <div class="config-grid">
        <div 
          v-for="config in filteredConfigs" 
          :key="config.id" 
          class="config-card glass-card"
        >
          <div class="config-header">
            <div class="config-info">
              <h4 class="config-name">{{ config.toolName }}</h4>
              <p class="config-provider">{{ config.toolProvider }}</p>
            </div>
            <div class="config-status">
              <el-tag 
                :type="config.status === 1 ? 'success' : 'danger'" 
                size="small"
              >
                {{ config.status === 1 ? '启用' : '禁用' }}
              </el-tag>
            </div>
          </div>
          
          <div class="config-content">
            <div class="config-description">
              {{ config.toolDescription || '暂无描述' }}
            </div>
            
            <div class="config-stats">
              <div class="stat-item">
                <span class="stat-label">使用次数</span>
                <span class="stat-value">{{ formatNumber(config.usageCount) }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">最后更新</span>
                <span class="stat-value">{{ formatTime(config.updateTime) }}</span>
              </div>
            </div>
          </div>
          
          <div class="config-actions">
            <el-button 
              size="small" 
              type="primary" 
              @click.stop="viewConfigDetail(config)"
            >
              查看详情
            </el-button>
            <el-button 
              size="small" 
              :type="config.status === 1 ? 'warning' : 'success'"
              @click.stop="toggleConfigStatus(config)"
            >
              {{ config.status === 1 ? '禁用' : '启用' }}
            </el-button>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[8, 16, 24, 32]"
          :total="totalConfigs"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 工具配置详情弹窗 -->
    <ToolConfigDetail 
      :visible="isConfigDetailVisible"
      :tool-name="selectedConfigTool"
      @close="handleConfigDetailClose"
      @refresh="refreshToolConfigs"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Refresh, 
  Search,
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import dayjs from 'dayjs'
import TimeRangeSelector from '../../../components/TimeRangeSelector.vue'
import ToolConfigDetail from './ToolConfigDetail.vue'
import { 
  toolUsageApi, 
  toolConfigApi,
  type ToolsUsageStatisticsVo, 
  type ToolsConfigVo,
  type DailyUsageVo,
  type HourlyUsageVo
} from '../../../api/tool'

// 响应式数据
const globalLoading = ref(false)
const trendLoading = ref(false)
const distributionLoading = ref(false)
const successLoading = ref(false)
const responseLoading = ref(false)
const configLoading = ref(false)

// 时间范围
const timeRange = ref({
  startTime: '',
  endTime: '',
  type: 'today'
})

// 概览数据
const overviewData = ref<ToolsUsageStatisticsVo[]>([])

// 工具列表
const toolList = ref<ToolsUsageStatisticsVo[]>([])
const selectedTool = ref('')

// 工具配置
const toolConfigs = ref<ToolsConfigVo[]>([])
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(16)
const totalConfigs = ref(0)

// 配置详情
const isConfigDetailVisible = ref(false)
const selectedConfigTool = ref('')

// 图表引用
const trendChartRef = ref<HTMLElement>()
const distributionChartRef = ref<HTMLElement>()
const successChartRef = ref<HTMLElement>()
const responseChartRef = ref<HTMLElement>()

// 图表实例
let trendChart: echarts.ECharts | null = null
let distributionChart: echarts.ECharts | null = null
let successChart: echarts.ECharts | null = null
let responseChart: echarts.ECharts | null = null

// 概览指标计算
const overviewMetrics = computed(() => {
  const totalCalls = overviewData.value.reduce((sum, item) => sum + item.totalCalls, 0)
  const totalSuccess = overviewData.value.reduce((sum, item) => sum + item.successCalls, 0)
  const totalFailed = overviewData.value.reduce((sum, item) => sum + item.failedCalls, 0)
  const avgResponseTime = overviewData.value.length > 0 
    ? overviewData.value.reduce((sum, item) => sum + item.avgResponseTime, 0) / overviewData.value.length 
    : 0

  return [
    {
      label: '总调用次数',
      value: totalCalls,
      subtitle: '今日新增 ' + overviewData.value.reduce((sum, item) => sum + item.todayCalls, 0),
      icon: 'DataAnalysis',
      color: '#4A90E2',
      trend: 'up',
      changePercent: 12.5
    },
    {
      label: '成功调用',
      value: totalSuccess,
      subtitle: '成功率 ' + (totalCalls > 0 ? ((totalSuccess / totalCalls) * 100).toFixed(1) : 0) + '%',
      icon: 'SuccessFilled',
      color: '#67C23A',
      trend: 'up',
      changePercent: 8.3
    },
    {
      label: '失败调用',
      value: totalFailed,
      subtitle: '失败率 ' + (totalCalls > 0 ? ((totalFailed / totalCalls) * 100).toFixed(1) : 0) + '%',
      icon: 'Bottom',
      color: '#F56C6C',
      trend: 'down',
      changePercent: -3.2
    },
    {
      label: '平均响应时间',
      value: Math.round(avgResponseTime),
      subtitle: '毫秒',
      icon: 'Timer',
      color: '#E6A23C',
      trend: 'down',
      changePercent: -5.1
    }
  ]
})

// 过滤后的配置列表
const filteredConfigs = computed(() => {
  if (!searchKeyword.value) return toolConfigs.value
  return toolConfigs.value.filter(config => 
    config.toolName.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
    config.toolProvider.toLowerCase().includes(searchKeyword.value.toLowerCase())
  )
})

// 处理时间范围变化
const handleTimeRangeChange = (range: { startTime: string, endTime: string, type: string }) => {
  timeRange.value = range
  refreshAllData()
}

// 加载概览数据
const loadOverviewData = async () => {
  try {
    const result = await toolUsageApi.getOverview()
    if (result.success) {
      overviewData.value = result.data || []
      toolList.value = result.data || []
      if (toolList.value.length > 0 && !selectedTool.value) {
        selectedTool.value = toolList.value[0].toolName
      }
    }
  } catch (error) {
    console.error('加载概览数据失败:', error)
    ElMessage.error('加载概览数据失败')
  }
}

// 加载工具配置
const loadToolConfigs = async () => {
  configLoading.value = true
  try {
    const result = await toolConfigApi.getPage({
      page: currentPage.value,
      pageSize: pageSize.value
    })
    if (result.success) {
      toolConfigs.value = result.data?.records || []
      totalConfigs.value = result.data?.total || 0
    }
  } catch (error) {
    console.error('加载工具配置失败:', error)
    ElMessage.error('加载工具配置失败')
  } finally {
    configLoading.value = false
  }
}

// 初始化图表
const initCharts = async () => {
  await nextTick()
  
  if (trendChartRef.value) {
    trendChart = echarts.init(trendChartRef.value)
  }
  if (distributionChartRef.value) {
    distributionChart = echarts.init(distributionChartRef.value)
  }
  if (successChartRef.value) {
    successChart = echarts.init(successChartRef.value)
  }
  if (responseChartRef.value) {
    responseChart = echarts.init(responseChartRef.value)
  }

  // 监听窗口大小变化
  window.addEventListener('resize', () => {
    trendChart?.resize()
    distributionChart?.resize()
    successChart?.resize()
    responseChart?.resize()
  })
}

// 刷新趋势图表
const refreshTrendChart = async () => {
  if (!trendChart) return
  
  trendLoading.value = true
  try {
    // 获取所有工具的趋势数据
    const promises = toolList.value.slice(0, 5).map(tool => 
      toolUsageApi.getTrendData(tool.toolName, getDaysFromTimeRange())
    )
    
    const results = await Promise.all(promises)
    const series: any[] = []
    let dates: string[] = []
    
    results.forEach((result, index) => {
      if (result.success && result.data && result.data.length > 0) {
        const tool = toolList.value[index]
        const callData = result.data.map((item: DailyUsageVo) => item.callCount)
        const successData = result.data.map((item: DailyUsageVo) => item.successCount)
        
        if (index === 0) {
          // 第一个工具设置x轴数据
          dates = result.data.map((item: DailyUsageVo) => dayjs(item.date).format('MM-DD'))
        }
        
        // 总调用量折线
        series.push({
          name: `${tool.toolName}-总调用`,
          type: 'line',
          data: callData,
          smooth: true,
          lineStyle: { 
            width: 3,
            color: getToolColor(index)
          },
          itemStyle: {
            color: getToolColor(index)
          },
          areaStyle: { 
            opacity: 0.1,
            color: getToolColor(index)
          },
          symbol: 'circle',
          symbolSize: 6
        })
        
        // 成功调用量折线（虚线）
        series.push({
          name: `${tool.toolName}-成功`,
          type: 'line',
          data: successData,
          smooth: true,
          lineStyle: { 
            width: 2,
            color: getToolColor(index),
            type: 'dashed'
          },
          itemStyle: {
            color: getToolColor(index)
          },
          symbol: 'diamond',
          symbolSize: 4,
          showSymbol: false
        })
      }
    })

    const option = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        borderColor: '#4A90E2',
        borderWidth: 1,
        textStyle: { color: '#fff' },
        extraCssText: 'z-index: 99999 !important; box-shadow: 0 4px 12px rgba(0,0,0,0.3); position: fixed !important;',
        appendToBody: true,
        formatter: function(params: any) {
          let result = `<div style="margin-bottom: 8px; font-weight: bold;">${params[0].axisValue}</div>`
          
          // 按工具分组显示
          const toolGroups: any = {}
          params.forEach((param: any) => {
            const toolName = param.seriesName.split('-')[0]
            if (!toolGroups[toolName]) {
              toolGroups[toolName] = []
            }
            toolGroups[toolName].push(param)
          })
          
          Object.keys(toolGroups).forEach(toolName => {
            result += `<div style="margin: 5px 0; padding: 3px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
              <div style="font-weight: bold; color: #4A90E2;">${toolName}</div>`
            
            toolGroups[toolName].forEach((param: any) => {
              const type = param.seriesName.split('-')[1]
              result += `<div style="margin: 2px 0; margin-left: 10px;">
                <span style="display:inline-block;margin-right:5px;border-radius:10px;width:8px;height:8px;background-color:${param.color};"></span>
                ${type}: ${param.value} 次
              </div>`
            })
            result += `</div>`
          })
          
          return result
        }
      },
      legend: {
        data: series.map(s => s.name),
        textStyle: { color: '#fff' },
        top: 10,
        itemGap: 15,
        type: 'scroll',
        pageIconColor: '#fff',
        pageIconInactiveColor: '#666',
        pageTextStyle: { color: '#fff' }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '20%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLine: { lineStyle: { color: '#444' } },
        axisLabel: { 
          color: '#ccc',
          rotate: dates.length > 10 ? 45 : 0
        },
        splitLine: { show: false }
      },
      yAxis: {
        type: 'value',
        name: '调用次数',
        nameTextStyle: { color: '#ccc' },
        axisLine: { lineStyle: { color: '#444' } },
        axisLabel: { color: '#ccc' },
        splitLine: { lineStyle: { color: '#333' } }
      },
      series: series,
      dataZoom: [
        {
          type: 'inside',
          start: 0,
          end: 100
        },
        {
          type: 'slider',
          start: 0,
          end: 100,
          height: 20,
          bottom: 10,
          textStyle: { color: '#fff' },
          borderColor: '#444',
          fillerColor: 'rgba(74, 144, 226, 0.3)',
          handleStyle: { color: '#4A90E2' }
        }
      ]
    }
    
    trendChart.setOption(option, true)
  } catch (error) {
    console.error('刷新趋势图表失败:', error)
  } finally {
    trendLoading.value = false
  }
}

// 刷新分布图表
const refreshDistributionChart = async () => {
  if (!distributionChart) return
  
  distributionLoading.value = true
  try {
    const pieData = toolList.value.map((tool, index) => ({
      value: tool.totalCalls,
      name: tool.toolName,
      itemStyle: {
        color: getToolColor(index),
        borderColor: '#fff',
        borderWidth: 2
      }
    }))

    const option = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        borderColor: '#4A90E2',
        borderWidth: 1,
        textStyle: { color: '#fff' },
        extraCssText: 'z-index: 99999 !important; box-shadow: 0 4px 12px rgba(0,0,0,0.3); position: fixed !important;',
        appendToBody: true,
        formatter: function(params: any) {
          return `
            <div style="font-weight: bold; margin-bottom: 5px;">${params.name}</div>
            <div>调用次数: ${params.value}</div>
            <div>占比: ${params.percent}%</div>
          `
        }
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        top: 'center',
        textStyle: { 
          color: '#fff',
          fontSize: 12
        },
        itemGap: 10,
        formatter: function(name: string) {
          const item = toolList.value.find(tool => tool.toolName === name)
          return `${name} (${item ? item.totalCalls : 0})`
        }
      },
      series: [{
        name: '工具使用分布',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['65%', '50%'],
        avoidLabelOverlap: false,
        emphasis: {
          scale: true,
          scaleSize: 10,
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        label: {
          show: true,
          position: 'outside',
          color: '#fff',
          fontSize: 11,
          formatter: function(params: any) {
            return `${params.percent}%`
          }
        },
        labelLine: {
          show: true,
          lineStyle: {
            color: '#fff'
          }
        },
        data: pieData,
        animationType: 'scale',
        animationEasing: 'elasticOut',
        animationDelay: function () {
          return Math.random() * 200
        }
      }]
    }
    
    distributionChart.setOption(option, true)
  } catch (error) {
    console.error('刷新分布图表失败:', error)
  } finally {
    distributionLoading.value = false
  }
}

// 刷新成功率图表
const refreshSuccessChart = async () => {
  if (!successChart) return
  
  successLoading.value = true
  try {
    // 构建雷达图数据
    const indicators = [
      { name: '成功率', max: 100 },
      { name: '调用频率', max: 100 },
      { name: '响应速度', max: 100 },
      { name: '稳定性', max: 100 },
      { name: '用户满意度', max: 100 }
    ]
    
    const seriesData = toolList.value.slice(0, 5).map((tool, index) => {
      // 模拟多维度数据（实际项目中应从API获取）
      const callFrequency = Math.min(100, (tool.totalCalls / Math.max(...toolList.value.map(d => d.totalCalls))) * 100)
      const responseSpeed = Math.max(60, Math.min(100, 100 - (Math.random() * 40))) // 模拟响应速度
      const stability = Math.max(70, Math.min(100, tool.successRate + (Math.random() * 10 - 5))) // 基于成功率模拟稳定性
      const satisfaction = Math.max(60, Math.min(100, tool.successRate + (Math.random() * 20 - 10))) // 模拟用户满意度
      
      return {
        value: [
          tool.successRate,
          callFrequency,
          responseSpeed,
          stability,
          satisfaction
        ],
        name: tool.toolName,
        itemStyle: {
          color: getToolColor(index)
        },
        areaStyle: {
          color: getToolColor(index),
          opacity: 0.1
        },
        lineStyle: {
          color: getToolColor(index),
          width: 2
        }
      }
    })

    const option = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        borderColor: '#4A90E2',
        borderWidth: 1,
        textStyle: { color: '#fff' },
        extraCssText: 'z-index: 99999 !important; box-shadow: 0 4px 12px rgba(0,0,0,0.3);',
        appendToBody: true,
        confine: true,
        formatter: function(params: any) {
          console.log('雷达图 tooltip params:', params) // 调试日志
          
          // 更严格的数据验证
          if (!params) {
            console.warn('雷达图 tooltip: params 为空')
            return ''
          }
          
          // 雷达图的数据结构检查
          let data, name, color
          if (params.data) {
            data = params.data
            name = data.name || params.name || '未知工具'
            color = params.color || data.itemStyle?.color || '#4A90E2'
          } else {
            console.warn('雷达图 tooltip: 无法获取数据')
            return ''
          }
          
          // 检查value数组
          if (!data.value || !Array.isArray(data.value)) {
            console.warn('雷达图 tooltip: value 数据无效', data.value)
            return `<div style="font-weight: bold; color: #4A90E2;">${name}</div><div>数据加载中...</div>`
          }
          
          let result = `<div style="font-weight: bold; margin-bottom: 8px; color: #4A90E2;">${name}</div>`
          
          indicators.forEach((indicator, index) => {
            const value = data.value[index]
            if (value !== undefined && value !== null) {
              const unit = index === 0 ? '%' : (index === 1 ? '%' : '分')
              const displayValue = typeof value === 'number' ? value.toFixed(1) : value
              result += `<div style="margin: 3px 0;">
                <span style="display:inline-block;margin-right:5px;border-radius:10px;width:8px;height:8px;background-color:${color};"></span>
                ${indicator.name}: ${displayValue}${unit}
              </div>`
            }
          })
          
          return result
        }
      },
      legend: {
        data: seriesData.map(item => item.name),
        textStyle: { 
          color: '#fff',
          fontSize: 12
        },
        top: 10,
        itemGap: 15
      },
      radar: {
        indicator: indicators,
        center: ['50%', '55%'],
        radius: '65%',
        startAngle: 90,
        splitNumber: 4,
        shape: 'polygon',
        name: {
          formatter: '{value}',
          textStyle: {
            color: '#fff',
            fontSize: 12
          }
        },
        splitLine: {
          lineStyle: {
            color: 'rgba(255, 255, 255, 0.2)'
          }
        },
        splitArea: {
          show: true,
          areaStyle: {
            color: [
              'rgba(74, 144, 226, 0.05)',
              'rgba(74, 144, 226, 0.1)',
              'rgba(74, 144, 226, 0.15)',
              'rgba(74, 144, 226, 0.2)'
            ]
          }
        },
        axisLine: {
          lineStyle: {
            color: 'rgba(255, 255, 255, 0.3)'
          }
        }
      },
      series: [{
        name: '工具性能指标',
        type: 'radar',
        data: seriesData,
        symbol: 'circle',
        symbolSize: 8,
        emphasis: {
          lineStyle: {
            width: 4
          },
          areaStyle: {
            opacity: 0.3
          },
          symbolSize: 12
        }
      }]
    }
    
    successChart.setOption(option, true)
  } catch (error) {
    console.error('刷新成功率图表失败:', error)
  } finally {
    successLoading.value = false
  }
}

// 刷新每小时调用量图表
const refreshResponseChart = async () => {
  if (!responseChart) return
  
  responseLoading.value = true
  try {
    // 获取前5个工具的每小时统计数据
    const promises = toolList.value.slice(0, 5).map(tool => 
      toolUsageApi.getHourlyStatistics(tool.toolName)
    )
    
    const results = await Promise.all(promises)
    const series: any[] = []
    let hours: string[] = []
    
    results.forEach((result, index) => {
      if (result.success && result.data) {
        const tool = toolList.value[index]
        const data = result.data.map((item: HourlyUsageVo) => item.callCount)
        
        if (index === 0) {
          // 第一个工具设置x轴数据
          hours = result.data.map((item: HourlyUsageVo) => `${item.hour}:00`)
        }
        
        series.push({
          name: tool.toolName,
          type: 'line',
          data: data,
          smooth: true,
          lineStyle: { 
            width: 3,
            color: getToolColor(index)
          },
          itemStyle: {
            color: getToolColor(index)
          },
          areaStyle: { 
            opacity: 0.2,
            color: getToolColor(index)
          },
          symbol: 'circle',
          symbolSize: 6
        })
      }
    })

    const option = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        borderColor: '#4A90E2',
        borderWidth: 1,
        textStyle: { color: '#fff' },
        extraCssText: 'z-index: 99999 !important; box-shadow: 0 4px 12px rgba(0,0,0,0.3); position: fixed !important;',
        appendToBody: true,
        formatter: function(params: any) {
          let result = `<div style="margin-bottom: 5px;">${params[0].axisValue}</div>`
          params.forEach((param: any) => {
            result += `<div style="margin: 2px 0;">
              <span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:${param.color};"></span>
              ${param.seriesName}: ${param.value} 次调用
            </div>`
          })
          return result
        }
      },
      legend: {
        data: series.map(s => s.name),
        textStyle: { color: '#fff' },
        top: 10,
        itemGap: 20
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: hours,
        axisLine: { lineStyle: { color: '#444' } },
        axisLabel: { 
          color: '#ccc',
          interval: 2 // 每隔2个小时显示一次标签
        },
        splitLine: { show: false }
      },
      yAxis: {
        type: 'value',
        name: '调用次数',
        nameTextStyle: { color: '#ccc' },
        axisLine: { lineStyle: { color: '#444' } },
        axisLabel: { color: '#ccc' },
        splitLine: { lineStyle: { color: '#333' } }
      },
      series: series
    }
    
    responseChart.setOption(option, true)
  } catch (error) {
    console.error('刷新每小时调用量图表失败:', error)
  } finally {
    responseLoading.value = false
  }
}

// 获取工具颜色
const getToolColor = (index: number) => {
  const colors = [
    '#FF6F61', // 橙红色
    '#4A90E2', // 蓝色
    '#7ED321', // 绿色
    '#F5A623', // 橙色
    '#BD10E0', // 紫色
    '#B8E986', // 浅绿色
    '#50E3C2', // 青色
    '#D0021B'  // 红色
  ]
  return colors[index % colors.length]
}

// 刷新所有图表
const refreshAllCharts = async () => {
  await Promise.all([
    refreshTrendChart(),
    refreshDistributionChart(),
    refreshSuccessChart(),
    refreshResponseChart()
  ])
}

// 刷新所有数据
const refreshAllData = async () => {
  globalLoading.value = true
  try {
    await Promise.all([
      loadOverviewData(),
      loadToolConfigs()
    ])
    await refreshAllCharts()
  } catch (error) {
    console.error('刷新数据失败:', error)
  } finally {
    globalLoading.value = false
  }
}

// 刷新工具配置
const refreshToolConfigs = () => {
  loadToolConfigs()
}

// 获取时间范围对应的天数
const getDaysFromTimeRange = () => {
  switch (timeRange.value.type) {
    case 'today':
    case 'yesterday':
      return 1
    case '3days':
      return 3
    case '7days':
      return 7
    case '30days':
      return 30
    default:
      return 7
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

// 根据小字内容判断颜色类型
const getSubtitleClass = (subtitle: string) => {
  if (subtitle.includes('新增')) {
    return 'subtitle-new'
  } else if (subtitle.includes('成功率')) {
    return 'subtitle-success'
  } else if (subtitle.includes('失败率')) {
    return 'subtitle-failed'
  }
  return ''
}

// 格式化时间
const formatTime = (time: string) => {
  return dayjs(time).format('MM-DD HH:mm')
}

// 搜索处理
const handleSearch = () => {
  // 搜索是通过计算属性实现的，这里可以添加额外逻辑
}

// 分页处理
const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  loadToolConfigs()
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
  loadToolConfigs()
}

// 查看配置详情
const viewConfigDetail = (config: ToolsConfigVo) => {
  console.log('查看配置详情:', config)
  selectedConfigTool.value = config.toolName
  isConfigDetailVisible.value = true
  console.log('设置状态:', {
    selectedConfigTool: selectedConfigTool.value,
    isConfigDetailVisible: isConfigDetailVisible.value
  })
}

// 关闭配置详情
const handleConfigDetailClose = () => {
  isConfigDetailVisible.value = false
  selectedConfigTool.value = ''
}

// 切换配置状态
const toggleConfigStatus = async (config: ToolsConfigVo) => {
  try {
    const newStatus = config.status === 1 ? 0 : 1
    const result = await toolConfigApi.updateStatus(config.id, newStatus)
    if (result.success) {
      // 找到配置在数组中的索引并更新，确保响应式更新
      const index = toolConfigs.value.findIndex(item => item.id === config.id)
      if (index !== -1) {
        toolConfigs.value[index].status = newStatus
        toolConfigs.value[index].statusDesc = newStatus === 1 ? '启用' : '禁用'
      }
      ElMessage.success(`工具已${newStatus === 1 ? '启用' : '禁用'}`)
    } else {
      ElMessage.error(result.message || '更新状态失败')
    }
  } catch (error) {
    console.error('更新状态失败:', error)
    ElMessage.error('更新状态失败')
  }
}

// 监听选中工具变化
watch(selectedTool, () => {
  refreshResponseChart()
})

// 组件挂载
onMounted(async () => {
  await initCharts()
  await refreshAllData()
})
</script>

<style scoped>
.system-monitoring {
  padding: 24px;
  height: auto;
  overflow-y: auto;
  position: relative;
}

.time-selector-wrapper {
  margin-bottom: 24px;
}

.overview-section {
  margin-bottom: 24px;
  position: relative;
  z-index: 1;
}

.metric-card {
  padding: 16px;
  height: 120px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  z-index: 2;
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
}

/* 百分比趋势 - 右上角 */
.metric-trend {
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
}

.metric-trend.up {
  color: #67C23A;
}

.metric-trend.down {
  color: #F56C6C;
}

/* 主要内容区域 */
.metric-main {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
}

.metric-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.metric-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.metric-value {
  font-size: 28px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 0;
  line-height: 1;
}

.metric-label {
  font-size: 16px;
  color: #fff;
  margin-bottom: 0;
  font-weight: 500;
  line-height: 1;
}

/* 描述信息 - 右下角 */
.metric-subtitle {
  font-size: 13px;
  color: #A0A9B8;
  font-weight: 400;
  position: absolute;
  bottom: 16px;
  right: 16px;
}

/* 条件颜色样式 */
.metric-subtitle.subtitle-new {
  color: #67C23A; /* 绿色 - 新增 */
}

.metric-subtitle.subtitle-success {
  color: #409EFF; /* 蓝色 - 成功率 */
}

.metric-subtitle.subtitle-failed {
  color: #F56C6C; /* 红色 - 失败率 */
}

.charts-section {
  margin-bottom: 24px;
  position: relative;
  z-index: 0;
}

.chart-container {
  padding: 20px;
  height: 400px;
  position: relative;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.chart-title {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  margin: 0;
}

.chart-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chart-content {
  height: calc(100% - 60px);
}

.config-section {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  margin: 0;
}

.section-actions {
  display: flex;
  align-items: center;
}

.config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.config-card {
  padding: 16px;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  height: 280px;
}

.config-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.config-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  flex-shrink: 0;
}

.config-name {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  margin: 0 0 4px 0;
  word-wrap: break-word;
  word-break: break-all;
  line-height: 1.3;
  max-width: 180px;
}

.config-provider {
  font-size: 13px;
  color: #4A90E2;
  margin: 0;
  font-weight: 500;
}

.config-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-bottom: 12px;
}

.config-description {
  font-size: 14px;
  color: #ccc;
  margin-bottom: 12px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
}

.config-stats {
  display: flex;
  justify-content: space-between;
  flex-shrink: 0;
}

.stat-item {
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: #A0A9B8;
  margin-bottom: 4px;
  font-weight: 500;
}

.stat-value {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #67C23A;
}

.config-actions {
  display: flex;
  gap: 8px;
  margin-top: auto;
  flex-shrink: 0;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

/* 玻璃卡片效果 */
.glass-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

/* Element Plus 样式覆盖 */
:deep(.overview-section .el-row) {
  margin-bottom: 20px;
}

:deep(.overview-section .el-col) {
  margin-bottom: 20px;
}

:deep(.el-input__wrapper) {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
}

:deep(.el-input__inner) {
  color: #fff;
}

:deep(.el-select .el-input__wrapper) {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

:deep(.el-button) {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
}

:deep(.el-button--primary) {
  background: #4A90E2;
  border-color: #4A90E2;
}

:deep(.el-button:hover) {
  background: rgba(74, 144, 226, 0.3);
  border-color: #4A90E2;
}

:deep(.el-pagination) {
  color: #fff;
}

/* 分页按钮统一背景色 */
:deep(.el-pagination .el-pager li) {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

:deep(.el-pagination .el-pager li.is-active) {
  background: #4A90E2;
  color: #fff;
  border-color: #4A90E2;
}

/* 前一页/后一页按钮 */
:deep(.el-pagination .btn-prev),
:deep(.el-pagination .btn-next) {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

:deep(.el-pagination .btn-prev:hover),
:deep(.el-pagination .btn-next:hover) {
  background: rgba(74, 144, 226, 0.3);
  border-color: #4A90E2;
  color: #fff;
}

/* 跳转输入框 */
:deep(.el-pagination .el-pagination__jump .el-input__wrapper) {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
}

:deep(.el-pagination .el-pagination__jump .el-input__inner) {
  color: #fff;
}

/* 每页显示数量选择器 */
:deep(.el-pagination .el-pagination__sizes .el-select .el-input__wrapper) {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
}

:deep(.el-pagination .el-pagination__sizes .el-select .el-input__inner) {
  color: #fff;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .config-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }
}

@media (max-width: 768px) {
  .system-monitoring {
    padding: 16px;
  }
  
  .overview-section .el-col {
    margin-bottom: 16px;
  }
  
  .charts-section .el-col {
    margin-bottom: 20px;
  }
  
  .config-grid {
    grid-template-columns: 1fr;
  }
  
  .section-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .section-actions {
    justify-content: space-between;
  }
}
</style>