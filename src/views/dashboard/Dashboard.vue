<template>
  <BackgroundContainer>
    <div class="dashboard-container">
      <el-container class="dashboard-layout">
        <!-- 侧边栏 -->
        <el-aside :width="isCollapsed ? '64px' : '240px'" class="dashboard-aside">
          <div class="sidebar-header">
            <div class="logo-container">
              <img src="/src/assets/png/logo-png.png" alt="Logo" class="logo"/>
              <span class="logo-text">Yolo Agent</span>
            </div>
          </div>

          <el-menu
              :default-active="activeMenu"
              class="sidebar-menu"
              :collapse="isCollapsed"
              :collapse-transition="false"
              background-color="transparent"
              text-color="rgba(255, 255, 255, 0.8)"
              active-text-color="#FF6F61"
              @select="handleMenuSelect"
          >
            <el-menu-item index="dashboard">
              <img src="/工作台.svg" class="menu-icon" alt="工作台"/>
              <template #title>工作台</template>
            </el-menu-item>

            <el-menu-item index="detection">
              <img src="/AI大模型.svg" class="menu-icon" alt="Multi对话"/>
              <template #title>Multi对话</template>
            </el-menu-item>

            <el-menu-item index="mcp">
              <img src="/MCP.svg" class="menu-icon" alt="MCP"/>
              <template #title>MCP服务</template>
            </el-menu-item>

            <el-menu-item index="models">
              <img src="/知识库.svg" class="menu-icon" alt="知识库"/>
              <template #title>知识库</template>
            </el-menu-item>

            <el-menu-item index="profile">
              <img src="/个人中心-置灰.svg" class="menu-icon" alt="个人中心"/>
              <template #title>个人中心</template>
            </el-menu-item>

            <el-menu-item index="inference">
              <img src="/目标检测-copy.svg" class="menu-icon" alt="我的创作"/>
              <template #title>我的创作</template>
            </el-menu-item>

            <el-menu-item index="favorites">
              <img src="/我的收藏.svg" class="menu-icon" alt="我的收藏"/>
              <template #title>我的收藏</template>
            </el-menu-item>




          </el-menu>
        </el-aside>

        <!-- 主内容区 -->
        <el-container class="main-container">
          <!-- 头部 -->
          <el-header class="dashboard-header">
            <div class="header-left">
              <el-button
                  :icon="isCollapsed ? Expand : Fold"
                  @click="toggleSidebar"
                  class="collapse-btn"
                  text
              />
              <h1 class="page-title">{{ pageTitle }}</h1>
              <el-breadcrumb separator="/" class="breadcrumb">
                <el-breadcrumb-item>中控台</el-breadcrumb-item>
                <el-breadcrumb-item v-if="currentView === 'dashboard'">{{ pageTitle }}</el-breadcrumb-item>
                <el-breadcrumb-item v-else-if="currentView === 'model'">
                  <span>{{ pageTitle }}</span>
                  <el-icon style="margin: 0 4px;"><ArrowRight /></el-icon>
                  <span style="color: var(--dashboard-accent-orange);">模型管理</span>
                </el-breadcrumb-item>
                <el-breadcrumb-item v-else-if="currentView === 'document'">
                  <span>{{ pageTitle }}</span>
                  <el-icon style="margin: 0 4px;"><ArrowRight /></el-icon>
                  <span style="color: var(--dashboard-accent-orange);">文档管理</span>
                </el-breadcrumb-item>
                <el-breadcrumb-item v-else-if="currentView === 'user'">
                  <span>{{ pageTitle }}</span>
                  <el-icon style="margin: 0 4px;"><ArrowRight /></el-icon>
                  <span style="color: var(--dashboard-accent-orange);">用户管理</span>
                </el-breadcrumb-item>
                <el-breadcrumb-item v-else-if="activeMenu === 'models'">
                  <span style="color: var(--dashboard-accent-orange);">{{ pageTitle }}</span>
                </el-breadcrumb-item>
                <el-breadcrumb-item v-else-if="activeMenu === 'detection'">
                  <span style="color: var(--dashboard-accent-orange);">{{ pageTitle }}</span>
                </el-breadcrumb-item>
                <el-breadcrumb-item v-else>{{ pageTitle }}</el-breadcrumb-item>
              </el-breadcrumb>
              <!-- 修改 header-tags 部分 -->
              <div class="header-tags">
                <!-- 知识库QA菜单 - 所有用户都可见 -->
                <el-tag
                    type="info"
                    effect="dark"
                    :class="['header-tag', { 'header-tag-active': currentView === 'docqa' }]"
                    @click="handleTagClick('docqa')"
                >
                  <img src="/知识库问答.svg" class="custom-icon" alt="知识库QA"/>
                  知识库QA
                  <el-badge class="tag-badge" type="danger"/>
                </el-tag>

                <!-- 管理员专用菜单 -->
                <template v-if="showAdminFeatures">
                  <el-tag
                      type="info"
                      effect="dark"
                      :class="['header-tag', { 'header-tag-active': currentView === 'model' }]"
                      @click="handleTagClick('model')"
                  >
                    <img src="/元模型管理.svg" class="custom-icon" alt="模型管理"/>
                    模型管理
                    <el-badge class="tag-badge" type="danger"/>
                  </el-tag>

                  <el-tag
                      type="info"
                      effect="dark"
                      :class="['header-tag', { 'header-tag-active': currentView === 'document' }]"
                      @click="handleTagClick('document')"
                  >
                    <img src="/文档管理-copy.svg" class="custom-icon" alt="文档管理"/>
                    文档管理
                    <el-badge class="tag-badge" type="danger"/>
                  </el-tag>

                  <el-tag
                      type="info"
                      effect="dark"
                      :class="['header-tag', { 'header-tag-active': currentView === 'user' }]"
                      @click="handleTagClick('user')"
                  >
                    <img src="/用户管理.svg" class="custom-icon" alt="用户管理"/>
                    用户管理
                    <el-badge class="tag-badge" type="danger"/>
                  </el-tag>

                  <el-dropdown trigger="click" @command="handleSystemCommand">
                    <el-tag
                        type="info"
                        effect="dark"
                        :class="['header-tag', 'header-tag-dropdown', { 'header-tag-active': currentView === 'system' || currentView === 'system-monitoring' || activeMenu === 'logs' }]"
                    >
                      <img src="/系统管理.svg" class="custom-icon" alt="系统管理"/>
                      系统管理
                      <el-icon class="dropdown-arrow"><ArrowDown /></el-icon>
                      <el-badge class="tag-badge" type="danger"/>
                    </el-tag>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item command="system-monitoring">
                          <img src="/工具管理.svg" class="dropdown-icon" alt="工具管理"/>
                          工具管理
                        </el-dropdown-item>
                        <el-dropdown-item command="system-logs" v-if="showAdminFeatures">
                          <img src="/系统日志.svg" class="dropdown-icon" alt="系统日志"/>
                          系统日志
                        </el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>

                  <el-tag
                      type="info"
                      effect="dark"
                      :class="['header-tag', { 'header-tag-active': currentView === 'dashboard' && activeMenu === 'dashboard' }]"
                      @click="handleTagClick('todo')"
                  >
                    <img src="/我的待办.svg" class="custom-icon" alt="我的待办"/>
                    我的待办
                    <el-badge class="tag-badge" type="danger"/>
                  </el-tag>
                </template>
              </div>
            </div>

            <div class="header-right">
              <el-dropdown @command="handleUserCommand">
                <div class="user-avatar">
                  <el-avatar :size="32" :src="userAvatar"/>
                  <span class="username">{{ username }}</span>
                  <el-icon class="dropdown-icon">
                    <ArrowDown/>
                  </el-icon>
                </div>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="profile">个人资料</el-dropdown-item>
                    <el-dropdown-item command="settings">账户设置</el-dropdown-item>
                    <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </el-header>

          <!-- 主内容 -->
          <el-main class="dashboard-main">
            <!-- 工作台内容 -->
            <div class="content-wrapper" v-if="activeMenu === 'dashboard' && currentView === 'dashboard'">
              <!-- 管理员和普通用户都显示AdminTodo组件，组件内部根据角色显示不同内容 -->
              <AdminTodo />
            </div>

            <!-- 模型管理内容 -->
            <div v-else-if="activeMenu === 'dashboard' && currentView === 'model'" class="model-management-wrapper">
              <!-- 固定查询条件栏 -->
              <div class="fixed-query-bar">
                <div class="query-form">
                  <el-form :model="queryForm" inline>
                    <div class="form-left">
                      <el-form-item label="模型类型">
                        <el-select v-model="queryForm.type" placeholder="选择模型类型" clearable style="width: 150px">
                          <el-option label="多模态模型" value="multimodal" />
                          <el-option label="嵌入模型" value="embedding" />
                          <el-option label="文本模型" value="rag" />
                        </el-select>
                      </el-form-item>
                      <el-form-item label="模型名称">
                        <el-input v-model="queryForm.modelName" placeholder="输入模型名称" clearable style="width: 200px" />
                      </el-form-item>
                      <el-form-item label="多模态支持">
                        <el-select v-model="queryForm.isMultimodal" placeholder="选择多模态支持" clearable style="width: 150px">
                          <el-option label="支持" :value="1" />
                          <el-option label="不支持" :value="0" />
                        </el-select>
                      </el-form-item>
                    </div>

                    <div class="form-right">
                      <el-form-item label="每页显示">
                        <el-select v-model="pageSize" @change="handlePageSizeChange" style="width: 80px">
                          <el-option label="4" :value="4" />
                          <el-option label="8" :value="8" />
                          <el-option label="12" :value="12" />
                          <el-option label="16" :value="16" />
                        </el-select>
                      </el-form-item>
                      <el-form-item>
                        <el-button @click="handleQuery" :loading="modelLoading">
                          <el-icon><Search /></el-icon>
                          查询
                        </el-button>
                        <el-button @click="handleReset">
                          <el-icon><Refresh /></el-icon>
                          重置
                        </el-button>
                      </el-form-item>
                    </div>
                  </el-form>
                </div>
              </div>
              
              <!-- 模型管理组件 -->
              <div class="model-content">
                <ModelManagement 
                  :query-form="queryForm" 
                  :page-size="pageSize" 
                  :is-query-mode="isQueryMode"
                  @update-loading="handleUpdateLoading"
                />
              </div>
            </div>

            <!-- 文档管理内容 -->
            <div v-else-if="activeMenu === 'dashboard' && currentView === 'document'" class="document-management-wrapper">
              <DocumentManagement @navigate-to-docqa="handleNavigateToDocQA" />
            </div>

            <!-- 用户管理内容 -->
            <div v-else-if="activeMenu === 'dashboard' && currentView === 'user'" class="user-management-wrapper">
              <UserManagement />
            </div>

            <!-- 工具管理内容 -->
            <div v-else-if="activeMenu === 'dashboard' && currentView === 'system-monitoring'" class="system-monitoring-wrapper">
              <SystemMonitoring />
            </div>

            <!-- 知识库QA内容 -->
            <DocQARag v-else-if="currentView === 'docqa'" :selected-knowledge-base-id="selectedKnowledgeBaseId" />

            <!-- Multi对话内容 -->
            <MultiChat v-else-if="activeMenu === 'detection'" />

            <!-- 知识库内容 -->
            <UserKnowledgeBase v-else-if="activeMenu === 'models'" @navigate-to-docqa="handleNavigateToDocQA" />

            <!-- 个人中心内容 -->
            <UserProfile v-else-if="activeMenu === 'profile'" />

            <!-- 我的收藏内容 -->
            <UserFavorites v-else-if="activeMenu === 'favorites'" />

            <!-- MCP工具内容 -->
            <div v-else-if="activeMenu === 'mcp'" class="mcp-tools-wrapper">
              <div class="mcp-tools-layout">
                <!-- 左侧对话列表 -->
                <div class="left-panel" :class="{ 'collapsed': isLeftPanelCollapsed }">
                  <ToolConversationList
                    ref="conversationListRef"
                    :selected-conversation-id="selectedConversationId"
                    @conversation-selected="handleConversationSelected"
                    @conversation-created="handleConversationCreated"
                    @panel-collapsed="handleLeftPanelCollapsed"
                  />
                </div>

                <!-- 中间聊天容器 -->
                <div class="center-panel">
                  <ToolChatContainer
                    ref="chatContainerRef"
                    :conversation-id="selectedConversationId"
                    @message-sent="handleMessageSent"
                    @conversation-updated="handleConversationUpdated"
                    @conversation-created="handleConversationCreated"
                  />
                </div>

                <!-- 右侧工具调用列表 -->
                <div class="right-panel" :class="{ 'collapsed': isRightPanelCollapsed }">
                  <ToolCallList
                    ref="toolCallListRef"
                    :conversation-id="selectedConversationId"
                    @panel-collapsed="handleRightPanelCollapsed"
                  />
                </div>
              </div>
            </div>

            <!-- 其他菜单项的占位内容 -->
            <div class="placeholder-content" v-else>
              <div class="placeholder-card glass-card">
                <div class="placeholder-icon">
                  <el-icon size="48" color="#FF6F61">
                    <Setting />
                  </el-icon>
                </div>
                <h3>{{ pageTitle }}</h3>
                <p>该功能正在开发中，敬请期待...</p>
              </div>
            </div>
          </el-main>
        </el-container>
      </el-container>
    </div>
  </BackgroundContainer>
</template>

<script setup lang="ts">
import {ref, onMounted, computed, watch, nextTick} from 'vue'
import {useRouter, useRoute} from 'vue-router'
import {useAuthStore} from '../../stores/auth'
import {ElMessage} from 'element-plus'
import {
  Expand,
  Fold,
  ArrowDown,
  ArrowRight,
  Search,
  Refresh,
  Setting,
} from '@element-plus/icons-vue'
import BackgroundContainer from '../../components/BackgroundContainer.vue'
import UserProfile from '../user/UserProfile.vue'
import ModelManagement from './admin/ModelManagement.vue'
import AdminTodo from './admin/AdminTodo.vue'
import DocumentManagement from './admin/DocumentManagement.vue'
import UserManagement from './admin/UserManagement.vue'
import UserKnowledgeBase from './UserKnowledgeBase.vue'
import DocQARag from './DocQARag.vue'
import MultiChat from './MultiChat.vue'
import UserFavorites from '../user/UserFavorites.vue'
import ToolConversationList from './ToolConversationList.vue'
import ToolChatContainer from './ToolChatContainer.vue'
import ToolCallList from './ToolCallList.vue'
import SystemMonitoring from './admin/SystemMonitoring.vue'
import { getUserProfile, logout as apiLogout } from '../../api/user'
import type { ModelQueryParams } from '../../api/dashboard-header'

// 路由和认证
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// 响应式数据
const isCollapsed = ref(false)
const activeMenu = ref('dashboard')
const currentView = ref('dashboard') // 当前显示的视图

// 模型管理相关数据
const modelLoading = ref(false)
const pageSize = ref(12)
const isQueryMode = ref(false)

// 查询表单
const queryForm = ref<ModelQueryParams>({
  type: undefined,
  modelName: undefined,
  isMultimodal: undefined
})

// 计算属性
const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    dashboard: '工作台',
    detection: 'Multi对话',
    models: '知识库',
    inference: '我的创作',
    favorites: '我的收藏',
    mcp: 'MCP',
    profile: '个人中心',
    logs: '系统日志'
  }
  return titles[activeMenu.value] || '工作台'
})

const username = computed(() => authStore.userProfile?.username || '用户')
const userAvatar = computed(() => authStore.userProfile?.avatar || '/default-avatar.png')

// 权限控制 - 判断是否为管理员
const isAdmin = computed(() => authStore.userProfile?.mainRoleId === 0)

// 判断是否显示管理员专用功能
const showAdminFeatures = computed(() => isAdmin.value)

// 选中的知识库ID
const selectedKnowledgeBaseId = ref<number | null>(null)

// MCP工具相关数据
const selectedConversationId = ref('')

const isLeftPanelCollapsed = ref(false)
const isRightPanelCollapsed = ref(false)

// MCP工具组件引用
const conversationListRef = ref<InstanceType<typeof ToolConversationList>>()
const chatContainerRef = ref<InstanceType<typeof ToolChatContainer>>()
const toolCallListRef = ref<InstanceType<typeof ToolCallList>>()

const handleTagClick = (type: string, knowledgeBaseId?: number) => {
  switch (type) {
    case 'docqa':
      activeMenu.value = 'dashboard'
      currentView.value = 'docqa'
      // 如果传递了知识库ID，则设置选中的知识库
      if (knowledgeBaseId) {
        selectedKnowledgeBaseId.value = knowledgeBaseId
      }
      break
    case 'model':
      activeMenu.value = 'dashboard'
      currentView.value = 'model'
      break
    case 'document':
      activeMenu.value = 'dashboard'
      currentView.value = 'document'
      break
    case 'user':
      activeMenu.value = 'dashboard'
      currentView.value = 'user'
      break
    case 'system':
      activeMenu.value = 'dashboard'
      currentView.value = 'system'
      break
    case 'todo':
      // 跳转到工作台显示管理员待办内容
      activeMenu.value = 'dashboard'
      currentView.value = 'dashboard'
      break
  }
}

// 处理知识库QA跳转事件
const handleNavigateToDocQA = (docId: number) => {
  handleTagClick('docqa', docId)
}

// 处理系统管理下拉菜单命令
const handleSystemCommand = (command: string) => {
  switch (command) {
    case 'system-monitoring':
      activeMenu.value = 'dashboard'
      currentView.value = 'system-monitoring'
      break
    case 'system-logs':
      activeMenu.value = 'logs'
      currentView.value = 'logs'
      break
    default:
      console.warn('未知的系统管理命令:', command)
  }
}

// 方法
const handleMenuSelect = (index: string) => {
  activeMenu.value = index
  // 当切换菜单时，重置当前视图
  if (index === 'dashboard') {
    currentView.value = 'dashboard'
  } else {
    currentView.value = index
  }
  
  // 当切换到MCP工具时，重置ToolConversationList和ToolCallList的状态为展开
  if (index === 'mcp') {
    nextTick(() => {
      conversationListRef.value?.resetState()
      toolCallListRef.value?.resetState()
    })
  }
}

// 获取用户资料
const fetchUserProfile = async () => {
  try {
    const result = await getUserProfile()
    if (result.success && result.data) {
      // 更新认证store中的用户信息
      authStore.setUserProfile(result.data)
    } else if (result.needLogin) {
      // 如果需要重新登录，跳转到登录页
      router.push('/login')
    } else {
      console.error('获取用户资料失败:', result.message)
    }
  } catch (error) {
    console.error('获取用户资料异常:', error)
  }
}

const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value
  // 动态添加/移除CSS类来处理布局变化
  const container = document.querySelector('.dashboard-container')
  if (container) {
    if (isCollapsed.value) {
      container.classList.add('sidebar-collapsed')
    } else {
      container.classList.remove('sidebar-collapsed')
    }
  }
}

const handleUserCommand = async (command: 'profile' | 'settings' | 'logout') => {
  switch (command) {
    case 'profile':
    case 'settings': // 将 settings 和 profile 合并处理
      // 跳转到个人中心
      activeMenu.value = 'profile'
      currentView.value = 'profile' // 重置当前视图
      break
    case 'logout':
      try {
        // 调用退出登录API
        const result = await apiLogout()
        if (result.success) {
          authStore.logout()
          router.push('/login')
          ElMessage.success('已退出登录')
        } else {
          ElMessage.error(result.message || '退出登录失败')
        }
      } catch (error) {
        console.error('退出登录失败:', error)
        // 即使API调用失败，也清除本地状态
        authStore.logout()
        router.push('/login')
        ElMessage.warning('退出登录完成')
      }
      break
  }
}

// 模型管理查询相关方法
const handleQuery = async () => {
  // 检查是否有查询条件
  const hasQueryCondition = queryForm.value.type || queryForm.value.modelName || queryForm.value.isMultimodal !== undefined
  
  if (hasQueryCondition) {
    isQueryMode.value = true
  } else {
    ElMessage.warning('请至少输入一个查询条件')
  }
}

const handleReset = async () => {
  queryForm.value = {
    type: undefined,
    modelName: undefined,
    isMultimodal: undefined
  }
  isQueryMode.value = false
}

const handlePageSizeChange = () => {
  // 页面大小变化时的处理逻辑
}

const handleUpdateLoading = (loading: boolean) => {
  modelLoading.value = loading
}

// MCP工具相关方法
const handleConversationSelected = (conversationId: string) => {
  selectedConversationId.value = conversationId
  
  // 当选择对话时，刷新工具调用列表
  nextTick(() => {
    toolCallListRef.value?.loadToolRecords()
  })
}

const handleConversationCreated = (conversationId: string) => {
  selectedConversationId.value = conversationId
  ElMessage.success('新对话已创建')
  
  // 刷新对话列表
  nextTick(() => {
    conversationListRef.value?.loadConversations()
  })
}

const handleMessageSent = () => {
  // 消息发送后，延迟刷新工具调用列表以获取最新的工具调用信息
  // 使用更短的延迟和防抖处理，提升响应体验
  setTimeout(() => {
    toolCallListRef.value?.refresh()
  }, 300)
}

const handleConversationUpdated = () => {
  // 对话更新后，刷新对话列表和工具调用列表
  // 使用nextTick确保DOM更新完成后再刷新
  nextTick(() => {
    conversationListRef.value?.loadConversations()
    
    // 添加一个小延迟，确保对话列表更新完成后再刷新工具调用列表
    setTimeout(() => {
      toolCallListRef.value?.refresh()
    }, 100)
  })
}



const handleLeftPanelCollapsed = (isCollapsed: boolean) => {
  isLeftPanelCollapsed.value = isCollapsed
}

const handleRightPanelCollapsed = (isCollapsed: boolean) => {
  isRightPanelCollapsed.value = isCollapsed
}

// 生命周期
onMounted(async () => {
  // 先获取用户资料
  await fetchUserProfile()
  
  // 检查URL参数，如果有menu参数则激活对应菜单
  const menuParam = route.query.menu as string
  if (menuParam && ['dashboard', 'detection', 'models', 'inference', 'favorites', 'mcp', 'profile', 'logs'].includes(menuParam)) {
    activeMenu.value = menuParam
    // 清除URL参数，但保持当前路由状态
    router.replace({ path: '/dashboard', query: {} })
  }
})

// 监听路由查询参数变化
watch(
  () => route.query.menu,
  (newMenu) => {
    if (newMenu && ['dashboard', 'detection', 'models', 'inference', 'favorites', 'mcp', 'profile', 'logs'].includes(newMenu as string)) {
      activeMenu.value = newMenu as string
      // 当切换菜单时，重置当前视图
      if (newMenu === 'dashboard') {
        currentView.value = 'dashboard'
      } else {
        currentView.value = newMenu as string
      }
      // 清除URL参数，但保持当前路由状态
      router.replace({ path: '/dashboard', query: {} })
    }
  },
  { immediate: false }
)
</script>

<style scoped>
/* 全局变量 */
:root {
  --dashboard-accent-orange: #FF6F61;
  --dashboard-accent-purple: #7D00FF;
  --dashboard-text-primary: #ca8989;
  --dashboard-glass-bg: rgba(255, 255, 255, 0.1);
  --dashboard-glass-border: rgba(255, 255, 255, 0.2);
}

/* 头部标签样式 */
.header-tags {
  position: fixed; /* 固定定位 */
  right: 230px; /* 距离右侧固定距离 */
  top: 16px; /* 顶部对齐位置 */
  display: flex;
  align-items: center;
  gap: 12px;
  height: 40px;
  z-index: 1000; /* 确保在其他元素之上 */
}

/* 图标样式 */
.header-tag .custom-icon {
  width: 22px;
  height: 22px;
  display: inline-block; /* 设置为行内块级元素 */
  vertical-align: middle; /* 垂直居中对齐 */
  margin: 0 8px 0 0; /* 只保留右边距 */
}

.header-tag {
  display: inline-flex; /* 使用 inline-flex 确保内容水平排列 */
  align-items: center; /* 垂直居中对齐 */
  white-space: nowrap; /* 防止文字换行 */
  gap: 8px;
  padding: 6px 12px;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.6s ease;
  background: transparent;
  border: none;
  color: rgba(186, 196, 196, 0.8);
  height: 40px; /* 固定高度 */
  line-height: 1; /* 重置行高 */
  position: relative; /* 为下划线定位做准备 */
}

.header-tag:hover {
  /* 移除背景色,改用文字颜色变化 */
  background: transparent;
  color: var(--dashboard-accent-orange);
}

/* 选中状态的蓝色下划线 */
.header-tag-active {
  color: #409EFF !important; /* 蓝色文字 */
}

.header-tag-active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 50%;
  transform: translateX(-50%);
  width: 80%;
  height: 3px;
  background: linear-gradient(90deg, #409EFF, #66B3FF);
  border-radius: 2px;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.4);
  animation: slideIn 0.3s ease-out;
}

/* 下拉菜单样式 */
.header-tag-dropdown {
  cursor: pointer;
}

.dropdown-arrow {
  margin-left: 4px;
  font-size: 14px;
  transition: transform 0.3s ease;
}

.dropdown-icon {
  width: 16px;
  height: 16px;
  margin-right: 8px;
  vertical-align: middle;
}

/* 下拉菜单项样式 */
.el-dropdown-menu {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.el-dropdown-menu .el-dropdown-menu__item {
  color: #333;
  font-size: 14px;
  padding: 8px 16px;
  display: flex;
  align-items: center;
}

.el-dropdown-menu .el-dropdown-menu__item:hover {
  background: rgba(64, 158, 255, 0.1);
  color: #409EFF;
}

/* 移除用户头像区域的边框 */
.header-right .el-dropdown {
  border: none !important;
  outline: none !important;
}

.header-right .el-dropdown .user-avatar {
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
}

@keyframes slideIn {
  from {
    width: 0;
    opacity: 0;
  }
  to {
    width: 80%;
    opacity: 1;
  }
}

.tag-badge {
  display: inline-flex;
  align-items: center;
}

/* 占位内容样式 */
.placeholder-content {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
  padding: 40px;
}

.placeholder-card {
  text-align: center;
  padding: 60px 40px;
  max-width: 400px;
  width: 100%;
}

.placeholder-icon {
  margin-bottom: 24px;
  display: flex;
  justify-content: center;
}

.placeholder-card h3 {
  font-size: 24px;
  font-weight: 600;
  color: var(--dashboard-text-primary);
  margin: 0 0 16px 0;
}

.placeholder-card p {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
  line-height: 1.6;
}

/* 模型管理包装器样式 */
.model-management-wrapper {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 96px); /* 减去header高度和padding */
}

/* 固定查询条件栏样式 */
.fixed-query-bar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(20px);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 1px;
  padding: 1px; /*减小查询条件栏的高度*/
  transition: all 0.3s ease;
}

.fixed-query-bar:hover {
  background: rgba(0, 0, 0, 0.3);
}

.query-form .el-form {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
}

.form-left {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.form-right {
  display: flex;
  gap: 16px;
  align-items: flex-end;
}

/* 查询表单组件样式 */
.query-form :deep(.el-form-item__label) {
  color: #fff !important;
  font-weight: 500;
}

.query-form :deep(.el-select .el-input__wrapper),
.query-form :deep(.el-input__wrapper) {
  background-color: rgba(255, 255, 255, 0.1) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  border-radius: 8px;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.query-form :deep(.el-select .el-input__wrapper:hover),
.query-form :deep(.el-input__wrapper:hover) {
  background-color: rgba(255, 255, 255, 0.15) !important;
  border-color: rgba(255, 255, 255, 0.3) !important;
}

.query-form :deep(.el-select .el-input__wrapper.is-focus),
.query-form :deep(.el-input__wrapper.is-focus) {
  background-color: rgba(255, 255, 255, 0.2) !important;
  border-color: var(--dashboard-accent-orange) !important;
  box-shadow: 0 0 0 2px rgba(255, 111, 97, 0.2) !important;
}

.query-form :deep(.el-input__inner) {
  color: #fff !important;
}

.query-form :deep(.el-select .el-input__inner) {
  color: #fff !important;
}

/* 模型内容区域 */
.model-content {
  flex: 1;
  overflow-y: auto;
  min-height: 0; /* 确保flex子项可以收缩 */
}

/* 文档管理样式 */
.document-management-wrapper {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 系统管理样式 */
.system-management-wrapper {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

/* 工具管理样式 */
.system-monitoring-wrapper {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  position: relative;
}



/* 当内容不足一屏时，隐藏滚动条 */
.model-content::-webkit-scrollbar {
  width: 0;
  background: transparent;
}

/* 主容器样式 */
.dashboard-container {
  position: relative;
  z-index: 2;
  font-family: 'Inter', 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
  height: 100vh;
  overflow: hidden;
}

.dashboard-layout {
  height: 100vh;
  display: flex;
}

/* 侧边栏宽度调整 */
.dashboard-aside {
  background: var(--dashboard-glass-bg);
  backdrop-filter: blur(20px);
  border-right: 1px solid var(--dashboard-glass-border);
  transition: width 0.3s ease;
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  z-index: 1000;
}

/* 同步调整 logo 区域高度 */
.sidebar-header {
  height: 72px; /* 与顶部栏保持一致 */
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  border-bottom: 1px solid var(--dashboard-glass-border);
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow: hidden;
}

.logo {
  width: 25px;
  height: 25px;
  flex-shrink: 0;
}

.logo-text {
  font-size: 22px;
  font-weight: 600;
  color: var(--dashboard-text-primary);
  white-space: nowrap;
  opacity: 1;
  transition: opacity 0.3s ease;
  text-align: center; /* 文字居中 */
}

/* 菜单图标样式 */
.menu-icon {
  width: 25px;
  height: 25px;
  margin-right: 12px;
}

/* 收缩状态下的菜单图标样式 */
.el-menu--collapse .menu-icon {
  margin-right: 0;
}

.collapse-btn {
  color: rgba(255, 255, 255, 0.8);
  padding: 8px;
  height: 32px;
  font-size: 30px;
}

.collapse-btn:hover {
  background-color: transparent !important;
  color: var(--dashboard-accent-orange);
}

.sidebar-menu {
  border: none;
  background: transparent;
}

.sidebar-menu .el-menu-item {
  display: flex;
  align-items: center;
  color: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  margin: 4px 8px;
  transition: all 0.3s ease;
  font-size: 16px; /*增大侧边栏菜单文字*/
  height: 50px;
}

.sidebar-menu .el-menu-item:hover {
  background: rgba(255, 111, 97, 0.1);
  color: var(--dashboard-accent-orange);
}

.sidebar-menu .el-menu-item.is-active {
  background: rgba(255, 111, 97, 0.2);
  color: var(--dashboard-accent-orange);
}

.el-menu--collapse .el-menu-item {
  padding: 0 !important;
  margin: 4px auto !important;
  width: 48px !important;
  min-width: 50px !important;
  justify-content: center !important;
}

/* 收缩状态下的菜单项样式 */
.sidebar-menu.el-menu--collapse {
  width: 64px;
}

/* 收缩状态下的图标容器样式 */
.sidebar-menu.el-menu--collapse .el-menu-item {
  padding: 0 !important;
  width: 64px !important;
  min-width: 64px !important;
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
}

/* 确保图标内部的SVG也居中 */
.sidebar-menu.el-menu--collapse .el-menu-item .el-icon svg {
  margin: 0 auto !important;
  display: block !important;
}

/* 主容器样式 */
.main-container {
  background: transparent;
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-left: 240px;
  transition: margin-left 0.3s ease;
}

/* 顶部栏高度调整 */
.dashboard-header {
  background: var(--dashboard-glass-bg);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--dashboard-glass-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 72px; /* 增加高度 */
  position: fixed;
  top: 0;
  right: 0;
  left: 240px;
  z-index: 999;
  transition: left 0.3s ease;
}

/* 侧边栏收缩时的样式调整 */
.dashboard-container.sidebar-collapsed .dashboard-header {
  left: 64px;
}

.dashboard-container.sidebar-collapsed .main-container {
  margin-left: 64px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-title {
  font-size: 26px;
  font-weight: 600;
  color: var(--dashboard-text-primary);
  margin: 0;
}

.breadcrumb {
  margin-left: auto;
  font-size: 18px;
}

.header-right {
  position: fixed;
  right: 24px;
  top: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  z-index: 1000;
}

.user-avatar {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
  border: none !important;
  outline: none !important;
  transition: background 0.3s ease;
}

.user-avatar:hover {
  background: rgba(255, 255, 255, 0.1);
  border: none !important;
  outline: none !important;
}

.username {
  color: var(--dashboard-text-primary);
  font-size: 23px;
  font-weight: 500;
}

.dropdown-icon {
  color: rgba(255, 255, 255, 0.6);
  font-size: 16px;
}

/* 主内容样式 */
.dashboard-main {
  padding: 20px;
  background: transparent;
  margin-top: 72px;
  min-height: calc(100vh - 72px);
  max-height: calc(100vh - 72px);
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
}

/* 模型管理页面特殊处理 */
.dashboard-main:has(.model-management-wrapper) {
  overflow-y: hidden;
}

/* MCP工具页面特殊处理 */
.dashboard-main:has(.mcp-tools-wrapper) {
  overflow-y: hidden;
  padding: 0;
}

.content-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 玻璃态效果 */
.glass-card {
  background: var(--dashboard-glass-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--dashboard-glass-border);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3),
  inset 0 1px 0 rgba(255, 255, 255, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.glass-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4),
  inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

/* MCP工具样式 */
.mcp-tools-wrapper {
  height: calc(100vh - 72px);
  position: relative;
  background: transparent;
  overflow: hidden;
}

.mcp-tools-layout {
  height: calc(100vh - 70px);
  display: grid;
  grid-template-columns: 320px 1fr 380px;
  gap: 6px;
  padding: 8px;
  transition: grid-template-columns 0.6s ease, gap 0.6s ease, padding 0.6s ease;
  background: transparent;
  box-sizing: border-box;
}

.mcp-tools-layout:has(.left-panel.collapsed) {
  grid-template-columns: 60px 1fr 380px;
}

.mcp-tools-layout:has(.right-panel.collapsed) {
  grid-template-columns: 320px 1fr 64px;
}

.mcp-tools-layout:has(.left-panel.collapsed):has(.right-panel.collapsed) {
  grid-template-columns: 60px 1fr 64px;
}

.left-panel,
.center-panel,
.right-panel {
  height: 100%;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}





/* 响应式设计 */
@media (max-width: 1200px) {
  .mcp-tools-layout {
    grid-template-columns: 300px 1fr 340px;
    gap: 6px;
    padding: 6px;
    height: calc(100vh - 110px);
  }
  
  .mcp-tools-layout:has(.left-panel.collapsed) {
    grid-template-columns: 60px 1fr 340px;
  }

  .mcp-tools-layout:has(.right-panel.collapsed) {
    grid-template-columns: 300px 1fr 64px;
  }

  .mcp-tools-layout:has(.left-panel.collapsed):has(.right-panel.collapsed) {
    grid-template-columns: 60px 1fr 64px;
  }

}

@media (max-width: 768px) {
  .mcp-tools-layout {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr auto;
    gap: 4px;
    padding: 4px;
    height: calc(100vh - 120px);
  }
  
  .left-panel {
    min-height: 200px;
    max-height: 300px;
  }
  
  .left-panel.collapsed {
    min-height: 60px;
    max-height: 60px;
  }
  
  .right-panel {
    min-height: 200px;
    max-height: 400px;
  }
  
  .right-panel.collapsed {
    min-height: 64px;
    max-height: 64px;
  }

}

/* 动画效果 */
@keyframes slideInMcp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.mcp-tools-layout > * {
  animation: slideInMcp 0.6s ease forwards;
}

.left-panel {
  animation-delay: 0.1s;
}

.center-panel {
  animation-delay: 0.2s;
}

.right-panel {
  animation-delay: 0.3s;
}

/* 深色主题适配 */
@media (prefers-color-scheme: dark) {
  .mcp-tools-wrapper {
    background: transparent;
  }
}
</style>