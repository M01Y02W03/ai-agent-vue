<template>
  <div class="admin-todo-container">
    <!-- 数据总览标题 -->
    <div class="overview-title">
      <div class="title-content">
        <img src="/数据总览.svg" alt="数据总览图标" class="title-icon" />
        <h2>数据总览</h2>
      </div>
    </div>

    <!-- 顶部数据总览 -->
    <div class="overview-section">
      <div class="overview-cards">
        <div class="overview-card glass-card">
          <div class="card-icon">
            <img src="/模型数.svg" alt="可用模型数图标" class="overview-icon" />
          </div>
          <div class="card-content">
            <h3>{{ dataView.modelCount }}</h3>
            <p>可用模型数</p>
          </div>
        </div>

        <div class="overview-card glass-card">
          <div class="card-icon">
            <img src="/知识库数.svg" alt="知识库文档数图标" class="overview-icon" />
          </div>
          <div class="card-content">
            <h3>{{ dataView.docCount }}</h3>
            <p>知识库文档数</p>
          </div>
        </div>

        <div class="overview-card glass-card">
          <div class="card-icon">
            <img src="/模型对话数.svg" alt="模型对话次数图标" class="overview-icon" />
          </div>
          <div class="card-content">
            <h3>{{ dataView.chatCount }}</h3>
            <p>模型对话次数</p>
          </div>
        </div>

        <div class="overview-card glass-card">
          <div class="card-icon">
            <img src="/检测记录数.svg" alt="检测记录数图标" class="overview-icon" />
          </div>
          <div class="card-content">
            <h3>{{ dataView.detectCount }}</h3>
            <p>作品</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 左侧：待办列表和审核历史 -->
      <div class="left-panel">
        <el-tabs v-model="activeTab" class="todo-tabs">
          <!-- 管理员版本：待办任务 -->
          <el-tab-pane name="pending" v-if="isAdmin">
            <template #label>
              <div class="tab-label">
                <span>待办任务</span>
                <el-badge :value="pendingCount" class="tab-badge" />
              </div>
            </template>
            <div class="pending-list">
              <div v-if="pendingLoading" class="loading-container">
                <el-icon class="is-loading" size="32" color="#FF6F61">
                  <Loading />
                </el-icon>
                <p>加载中...</p>
              </div>
              <div v-else-if="pendingList.length === 0" class="empty-state">
                <el-empty description="暂无待办任务" />
              </div>
              <div v-else class="todo-items">
                <div
                    v-for="item in pendingList"
                    :key="item.id"
                    class="todo-item glass-card"
                    @click="handleItemClick(item)"
                >
                  <div class="item-header">
                    <div class="item-title">{{ item.title }}</div>
                    <div class="item-meta">
                      <div class="meta-row">
                        <span class="meta-label">任务级别：</span>
                        <el-tag
                            :type="getPriorityType(item.level)"
                            size="small"
                        >
                          {{ getPriorityText(item.level) }}
                        </el-tag>
                      </div>
                      <div class="meta-row">
                        <span class="meta-label">创建时间：</span>
                        <span class="item-time">{{ formatTime(item.createTime) }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="item-content">
                    <p class="item-desc">描述：{{ item.orderDesc }}</p>
                    <div class="item-info">
                      <span class="service-name">操作：{{ item.serviceName }}</span>
                      <span class="deal-result">处理结果：{{ item.dealResult || '无' }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>

          <!-- 管理员版本：审核历史 -->
          <el-tab-pane name="history" v-if="isAdmin">
            <template #label>
              <div class="tab-label">
                <span>审核历史</span>
                <el-badge :value="historyCount" class="tab-badge" />
              </div>
            </template>
            <div class="history-list">
              <div v-if="historyLoading" class="loading-container">
                <el-icon class="is-loading" size="32" color="#FF6F61">
                  <Loading />
                </el-icon>
                <p>加载中...</p>
              </div>
              <div v-else-if="historyList.length === 0" class="empty-state">
                <el-empty description="暂无审核历史" />
              </div>
              <div v-else class="history-items">
                <div
                    v-for="item in historyList"
                    :key="item.id"
                    class="history-item glass-card"
                >
                  <div class="item-header">
                    <div class="item-title">{{ item.title }}</div>
                    <div class="item-meta">
                      <div class="meta-row">
                        <span class="meta-label">审核结果：</span>
                        <el-tag
                            :type="getApprovalType(item.approvalResult)"
                            size="small"
                        >
                          {{ getApprovalText(item.approvalResult) }}
                        </el-tag>
                      </div>
                      <div class="meta-row">
                        <span class="meta-label">更新时间：</span>
                        <span class="item-time">{{ formatTime(item.updateTime) }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="item-content">
                    <p class="item-desc" v-html="highlightUserName(item.orderDesc)"></p>
                    <div class="item-info">
                      <span class="service-name">操作：{{ item.serviceName }}</span>
                      <span class="creator">创建人：<span class="highlight-user">{{ item.createUser }}</span></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>

          <!-- 普通用户版本：我的待办 -->
          <el-tab-pane name="my-todo" v-if="!isAdmin">
            <template #label>
              <div class="tab-label">
                <span>我的待办</span>
                <el-badge :value="pendingDocCount" class="tab-badge" />
              </div>
            </template>
            <div class="my-todo-list">
              <div v-if="tempDocLoading" class="loading-container">
                <el-icon class="is-loading" size="32" color="#FF6F61">
                  <Loading />
                </el-icon>
                <p>加载中...</p>
              </div>
              <div v-else-if="pendingDocuments.length === 0" class="empty-state">
                <el-empty description="暂无待审核文档" />
              </div>
              <div v-else class="doc-items">
                <div
                    v-for="(doc, index) in pendingDocuments"
                    :key="index"
                    class="doc-item glass-card"
                >
                  <div class="item-header">
                    <div class="item-title">{{ doc.docName }}</div>
                    <div class="item-meta">
                      <div class="meta-row">
                        <span class="meta-label">审核状态：</span>
                        <el-tag
                            :type="getAuditStatusType(doc.auditStatus)"
                            size="small"
                        >
                          {{ getAuditStatusText(doc.auditStatus) }}
                        </el-tag>
                      </div>
                      <div class="meta-row">
                        <span class="meta-label">创建时间：</span>
                        <span class="item-time">{{ formatTime(doc.createTime) }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="item-content">
                    <p class="item-desc">文档类型：{{ doc.docType }}</p>
                    <p class="item-desc">使用场景：{{ doc.usageScenario }}</p>
                    <div class="item-info">
                      <span class="doc-size">文件大小：{{ formatSize(doc.size) }}</span>
                      <span class="audit-comment" v-if="doc.auditComment">审核意见：{{ doc.auditComment }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>

          <!-- 普通用户版本：已办 -->
          <el-tab-pane name="completed" v-if="!isAdmin">
            <template #label>
              <div class="tab-label">
                <span>已办</span>
                <el-badge :value="completedDocCount" class="tab-badge" />
              </div>
            </template>
            <div class="completed-list">
              <div v-if="tempDocLoading" class="loading-container">
                <el-icon class="is-loading" size="32" color="#FF6F61">
                  <Loading />
                </el-icon>
                <p>加载中...</p>
              </div>
              <div v-else-if="completedDocuments.length === 0" class="empty-state">
                <el-empty description="暂无已办文档" />
              </div>
              <div v-else class="doc-items">
                <div
                    v-for="(doc, index) in completedDocuments"
                    :key="index"
                    class="doc-item glass-card"
                >
                  <div class="item-header">
                    <div class="item-title">{{ doc.docName }}</div>
                    <div class="item-meta">
                      <div class="meta-row">
                        <span class="meta-label">审核状态：</span>
                        <el-tag
                            :type="getAuditStatusType(doc.auditStatus)"
                            size="small"
                        >
                          {{ getAuditStatusText(doc.auditStatus) }}
                        </el-tag>
                      </div>
                      <div class="meta-row">
                        <span class="meta-label">创建时间：</span>
                        <span class="item-time">{{ formatTime(doc.createTime) }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="item-content">
                    <p class="item-desc">文档类型：{{ doc.docType }}</p>
                    <p class="item-desc">使用场景：{{ doc.usageScenario }}</p>
                    <div class="item-info">
                      <span class="doc-size">文件大小：{{ formatSize(doc.size) }}</span>
                      <span class="audit-comment" v-if="doc.auditComment">审核意见：{{ doc.auditComment }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>

      <!-- 右侧：通知公告 -->
      <div class="right-panel">
        <div class="notice-section glass-card">
          <div class="section-header">
            <div class="title-content">
              <img src="/通知公告.svg" alt="通知公告图标" class="title-icon" />
              <h3>通知公告</h3>
            </div>
          </div>
          <div class="notice-list">
            <div v-if="commitsLoading" class="loading-container">
              <el-icon class="is-loading" size="32" color="#FF6F61">
                <Loading />
              </el-icon>
              <p>加载中...</p>
            </div>
            <div v-else-if="commits.length === 0" class="empty-state">
              <el-empty description="暂无提交记录" />
            </div>
            <div v-else class="notice-scroll-container" @mouseenter="pauseScroll" @mouseleave="resumeScroll">
              <div class="notice-scroll-content" :class="{ 'paused': isScrollPaused }">
                <div class="commit-item" v-for="(commit, index) in displayCommits" :key="`${commit.id}-${index}`">
                  <div class="commit-message">{{ commit.message.split('\n')[0] }}</div>
                  <div class="commit-meta">
                    <span class="commit-author">{{ commit.author.name }}</span>
                    <span class="commit-time">{{ formatCommitTime(commit.author.date) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 审核对话框 -->
    <el-dialog
        v-model="approvalDialogVisible"
        title="审核任务"
        width="500px"
        :before-close="handleDialogClose"
    >
      <div v-if="currentItem">
        <div class="approval-info">
          <h4>{{ currentItem.title }}</h4>
          <p class="approval-desc">{{ currentItem.orderDesc }}</p>
          <div class="approval-meta">
            <span>创建人：{{ currentItem.createUser }}</span>
            <span>创建时间：{{ formatTime(currentItem.createTime) }}</span>
          </div>
        </div>

        <el-form :model="approvalForm" label-width="80px">
          <el-form-item label="审核结果" required>
            <el-radio-group v-model="approvalForm.approvalResult">
              <el-radio :label="0">通过</el-radio>
              <el-radio :label="1">不通过</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="审核意见">
            <el-input
                v-model="approvalForm.comment"
                type="textarea"
                :rows="4"
                placeholder="请输入审核意见（可选）"
            />
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleDialogClose">取消</el-button>
          <el-button
              type="primary"
              @click="handleApproval"
              :loading="approvalLoading"
          >
            确认审核
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Loading
} from '@element-plus/icons-vue'
import {
  getPendingList,
  getApprovalHistory,
  approveDocument,
  getCommits,
  getDataView,
  type PendingOrder,
  type ApprovalParams,
  type CodeCommit,
  type DataViewVO,
} from '../../../api/dashboard-header.ts'
import {
  getTempDocuments,
  type LLMDocTempVO,
} from '../../../api/dashboard-sidebar.ts'
import { useAuthStore } from '../../../stores/auth'

// 响应式数据
const authStore = useAuthStore()
const activeTab = ref('pending')
const pendingList = ref<PendingOrder[]>([])
const historyList = ref<PendingOrder[]>([])
const pendingCount = ref(0)
const historyCount = ref(0)
const pendingLoading = ref(false)
const historyLoading = ref(false)
const approvalDialogVisible = ref(false)
const approvalLoading = ref(false)
const currentItem = ref<PendingOrder | null>(null)

// 待审核文档数据
const tempDocuments = ref<LLMDocTempVO[]>([])
const tempDocLoading = ref(false)
const tempDocCount = ref(0)

// 计算属性：分离待办和已办文档
const pendingDocuments = computed(() => {
  return tempDocuments.value.filter(doc => doc.auditStatus === 0)
})

const completedDocuments = computed(() => {
  return tempDocuments.value.filter(doc => doc.auditStatus === 1 || doc.auditStatus === 2)
})

const pendingDocCount = computed(() => pendingDocuments.value.length)
const completedDocCount = computed(() => completedDocuments.value.length)

// 数据视图数据
const dataView = ref<DataViewVO>({
  chatCount: 0,
  docCount: 0,
  modelCount: 0,
  detectCount: 0
})
const dataViewLoading = ref(false)

// 审核表单
const approvalForm = ref({
  approvalResult: 0,
  comment: ''
})

// 提交记录数据
const commits = ref<CodeCommit[]>([])
const commitsLoading = ref(false)

// 滚动相关数据
const isScrollPaused = ref(false)
const displayCommits = ref<CodeCommit[]>([])

// 判断是否为管理员
const isAdmin = computed(() => authStore.userProfile?.mainRoleId === 0)

// 获取数据视图的方法
const fetchDataView = async () => {
  dataViewLoading.value = true
  try {
    const result = await getDataView()
    if (result.success) {
      dataView.value = result.data || {
        chatCount: 0,
        docCount: 0,
        modelCount: 0,
        detectCount: 0
      }
    } else {
      ElMessage.error(result.message || '获取数据视图失败')
    }
  } catch (error) {
    console.error('获取数据视图异常:', error)
    ElMessage.error('获取数据视图异常')
  } finally {
    dataViewLoading.value = false
  }
}

// 获取待审核文档的方法
const fetchTempDocuments = async () => {
  tempDocLoading.value = true
  try {
    const result = await getTempDocuments()
    if (result.success) {
      tempDocuments.value = result.data || []
      tempDocCount.value = tempDocuments.value.length
    } else {
      ElMessage.error(result.message || '获取待审核文档失败')
    }
  } catch (error) {
    console.error('获取待审核文档异常:', error)
    ElMessage.error('获取待审核文档异常')
  } finally {
    tempDocLoading.value = false
  }
}

// 方法
const fetchPendingList = async () => {
  pendingLoading.value = true
  try {
    const result = await getPendingList()
    if (result.success) {
      pendingList.value = result.data?.pendingOrders || []
      pendingCount.value = result.data?.count || 0
    } else {
      ElMessage.error(result.message || '获取待办列表失败')
    }
  } catch (error) {
    console.error('获取待办列表异常:', error)
    ElMessage.error('获取待办列表异常')
  } finally {
    pendingLoading.value = false
  }
}

const fetchHistoryList = async () => {
  historyLoading.value = true
  try {
    const result = await getApprovalHistory()
    if (result.success) {
      historyList.value = result.data?.pendingOrders || []
      historyCount.value = result.data?.count || 0
    } else {
      ElMessage.error(result.message || '获取审核历史失败')
    }
  } catch (error) {
    console.error('获取审核历史异常:', error)
    ElMessage.error('获取审核历史异常')
  } finally {
    historyLoading.value = false
  }
}

const handleItemClick = (item: PendingOrder) => {
  currentItem.value = item
  approvalForm.value = {
    approvalResult: 0,
    comment: ''
  }
  approvalDialogVisible.value = true
}

const handleApproval = async () => {
  if (!currentItem.value) return

  approvalLoading.value = true
  try {
    const params: ApprovalParams = {
      pendingOrderId: currentItem.value.id,
      approvalResult: approvalForm.value.approvalResult,
      comment: approvalForm.value.comment
    }

    const result = await approveDocument(params)
    if (result.success) {
      ElMessage.success('审核完成')
      approvalDialogVisible.value = false
      // 刷新数据
      await fetchPendingList()
      await fetchHistoryList()
    } else {
      ElMessage.error(result.message || '审核失败')
    }
  } catch (error) {
    console.error('审核异常:', error)
    ElMessage.error('审核异常')
  } finally {
    approvalLoading.value = false
  }
}

const handleDialogClose = () => {
  approvalDialogVisible.value = false
  currentItem.value = null
}

const getPriorityType = (level: number) => {
  switch (level) {
    case 0: return 'danger'
    case 1: return 'warning'
    case 2: return 'info'
    default: return 'info'
  }
}

const getPriorityText = (level: number) => {
  switch (level) {
    case 0: return '高'
    case 1: return '中'
    case 2: return '低'
    default: return '未知'
  }
}

const getApprovalType = (result: number) => {
  return result === 0 ? 'success' : 'danger'
}

const getApprovalText = (result: number) => {
  return result === 0 ? '通过' : '不通过'
}

// 审核状态相关方法
const getAuditStatusType = (status: number) => {
  switch (status) {
    case 0: return 'warning'  // 待审核
    case 1: return 'success'  // 审核通过
    case 2: return 'danger'   // 审核不通过
    default: return 'info'
  }
}

const getAuditStatusText = (status: number) => {
  switch (status) {
    case 0: return '待审核'
    case 1: return '审核通过'
    case 2: return '审核不通过'
    default: return '未知'
  }
}

// 文件大小格式化
const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 高亮用户名方法
const highlightUserName = (description: string) => {
  if (!description) return '描述：'
  // 匹配"用户 xxx"模式的用户名
  const userPattern = /(用户\s+)([^\s]+)/g
  const highlightedDesc = description.replace(userPattern, '$1<span class="highlight-user">$2</span>')
  return `描述：${highlightedDesc}`
}

const formatTime = (time: string) => {
  return new Date(time).toLocaleString('zh-CN')
}

// 获取提交记录
const fetchCommits = async () => {
  commitsLoading.value = true
  try {
    const result = await getCommits(1) // 默认仓库ID为1
    if (result.success) {
      commits.value = result.data || []
      initDisplayCommits()
    } else {
      ElMessage.error(result.message || '获取提交记录失败')
    }
  } catch (error) {
    console.error('获取提交记录异常:', error)
    ElMessage.error('获取提交记录异常')
  } finally {
    commitsLoading.value = false
  }
}

// 格式化提交时间
const formatCommitTime = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 滚动控制方法
const pauseScroll = () => {
  isScrollPaused.value = true
}

const resumeScroll = () => {
  isScrollPaused.value = false
}

// 初始化显示数据（复制数据以实现无缝滚动）
const initDisplayCommits = () => {
  if (commits.value.length > 0) {
    // 复制数据以实现无缝循环滚动
    displayCommits.value = [...commits.value, ...commits.value]
  }
}

// 生命周期
onMounted(async () => {
  // 首先获取数据视图
  await fetchDataView()
  
  if (isAdmin.value) {
    // 管理员：加载待办任务、审核历史和提交记录
    await Promise.all([fetchPendingList(), fetchHistoryList(), fetchCommits()])
    // 设置默认激活tab
    activeTab.value = 'pending'
  } else {
    // 普通用户：加载待审核文档和提交记录
    await Promise.all([fetchTempDocuments(), fetchCommits()])
    // 设置默认激活tab
    activeTab.value = 'my-todo'
  }
})
</script>

<style scoped>
.admin-todo-container {
  padding: 20px;
  background: transparent;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

/* 平台数据总览标题样式 */
.overview-title {
  margin-bottom: 20px;
  text-align: left; /* 改为左对齐 */
}

.title-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-icon {
  width: 24px;
  height: 24px;
}

.overview-title h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: var(--dashboard-text-primary);
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.overview-title h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: var(--dashboard-text-primary);
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

/* 数据总览样式 */
.overview-section {
  margin-bottom: 24px;
  flex-shrink: 0;
}

.overview-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.overview-card {
  display: flex;
  align-items: center;
  padding: 20px;
  border-radius: 12px;
  background: var(--dashboard-glass-bg);
  border: 1px solid var(--dashboard-glass-border);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.overview-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.card-icon {
  margin-right: 16px;
}

.overview-icon {
  width: 32px;
  height: 32px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  transition: all 0.3s ease;
}

.overview-card:hover .overview-icon {
  transform: scale(1.1);
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.4));
}

.card-content h3 {
  font-size: 28px;
  font-weight: bold;
  margin: 0;
  color: var(--dashboard-text-primary);
}

.card-content p {
  margin: 4px 0 0 0;
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
}

/* 主要内容区域 */
.main-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
  flex: 1;
  min-height: 0;
}

/* 左侧面板 */
.left-panel {
  background: var(--dashboard-glass-bg);
  border: 1px solid var(--dashboard-glass-border);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  padding: 20px;
  overflow: hidden;
}

.todo-tabs {
  height: 100%;
}

.todo-tabs :deep(.el-tabs__content) {
  height: calc(100% - 40px);
  overflow-y: auto;
}

.todo-tabs :deep(.el-tabs__item) {
  color: rgba(255, 255, 255, 0.8) !important;
}

.todo-tabs :deep(.el-tabs__item.is-active) {
  color: var(--dashboard-accent-orange) !important;
}

.tab-label {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tab-badge :deep(.el-badge__content) {
  background-color: #f56565;
  border: none;
  font-size: 10px;
  height: 16px;
  line-height: 16px;
  min-width: 16px;
  padding: 0 4px;
  border-radius: 8px;
  font-weight: 600;
}

.pending-list,
.history-list,
.my-todo-list,
.completed-list {
  height: 100%;
}

.loading-container,
.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

.todo-items,
.history-items,
.doc-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.todo-item,
.history-item,
.doc-item {
  padding: 16px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
}

.todo-item:hover,
.doc-item:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateX(4px);
}

.history-item {
  cursor: default;
}

.doc-item {
  cursor: default;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.item-title {
  font-weight: 600;
  color: var(--dashboard-text-primary);
  font-size: 16px;
}

.item-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.meta-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
}

.item-time {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.item-content {
  color: rgba(255, 255, 255, 0.8);
}

.item-desc {
  margin: 0 0 8px 0;
  font-size: 14px;
  line-height: 1.4;
  color: rgba(255, 254, 254, 0.9);
}

.item-info {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.doc-size,
.audit-comment {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

/* 右侧面板 */
.right-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.notice-section {
  background: var(--dashboard-glass-bg);
  border: 1px solid var(--dashboard-glass-border);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  padding: 20px;
  flex: 1;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h3 {
  margin: 0;
  color: var(--dashboard-text-primary);
  font-size: 18px;
}

.notice-list {
  height: 400px; /* 固定高度 */
  overflow: hidden;
}

/* 滚动容器样式 */
.notice-scroll-container {
  height: 100%;
  overflow: hidden;
  position: relative;
  mask: linear-gradient(to bottom,
  transparent 0%,
  black 10%,
  black 90%,
  transparent 100%);
}

.notice-scroll-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  animation: scrollUp 170s linear infinite;
  transition: animation-play-state 0.3s ease;
}

.notice-scroll-content.paused {
  animation-play-state: paused;
}

/* 滚动动画 */
@keyframes scrollUp {
  0% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(-50%);
  }
}

.commit-item {
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border-left: 3px solid var(--dashboard-accent-orange);
  flex-shrink: 0;
  transition: all 0.3s ease;
  backdrop-filter: blur(5px);

  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.commit-item:hover {
  background: rgba(255, 255, 255, 0.08);
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-left-color: #ff8a7a;
}

.commit-message {
  font-weight: 500;
  color: var(--dashboard-text-primary);
  margin-bottom: 6px;
  line-height: 1.4;
  word-break: break-word; /* 处理长文本换行 */
}

.commit-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
}

.commit-author {
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
}

.commit-time {
  color: rgba(255, 255, 255, 0.6);
}

/* 用户名高亮样式 */
.highlight-user {
  color: #b4372c;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  text-shadow: 0 0 8px rgba(255, 111, 97, 0.4);
  transition: all 0.3s ease;
}
/* 审核对话框样式 */
.approval-info {
  margin-bottom: 20px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.approval-info h4 {
  margin: 0 0 8px 0;
  color: var(--dashboard-text-primary);
}

.approval-desc {
  margin: 0 0 12px 0;
  color: rgba(180, 180, 180, 0.9);
  line-height: 1.4;
}

.approval-meta {
  display: flex;
  gap: 20px;
  font-size: 12px;
  color: rgba(160, 160, 160, 0.8);
}

/* 全局变量 */
:root {
  --dashboard-accent-orange: #FF6F61;
  --dashboard-accent-purple: #7D00FF;
  --dashboard-text-primary: #ca8989;
  --dashboard-glass-bg: rgba(255, 255, 255, 0.1);
  --dashboard-glass-border: rgba(255, 255, 255, 0.2);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .main-content {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .overview-cards {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }
}

@media (max-width: 768px) {
  .admin-todo-container {
    padding: 0;
  }

  .overview-cards {
    grid-template-columns: 1fr;
  }

  .overview-title h2 {
    font-size: 20px;
  }
}
</style>