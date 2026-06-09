<template>
  <div class="user-management-container">
    <!-- 顶部操作栏 -->
    <div class="top-toolbar">
      <div class="toolbar-left">
        <h2 class="page-title">用户管理</h2>
      </div>
      
      <div class="toolbar-center">
        <!-- 搜索框 -->
        <el-input
          v-model="searchQuery"
          placeholder="搜索用户名或邮箱"
          :prefix-icon="Search"
          clearable
          style="width: 300px;"
        />
        
        <!-- 筛选器 -->
        <el-select v-model="filterRole" placeholder="角色" clearable style="width: 120px; margin-left: 12px;">
          <el-option label="管理员" :value="0" />
          <el-option label="普通用户" :value="1" />
        </el-select>
        
        <el-select v-model="filterStatus" placeholder="状态" clearable style="width: 120px; margin-left: 12px;">
          <el-option label="正常" :value="0" />
          <el-option label="异常" :value="1" />
        </el-select>
        
        <!-- 查询按钮 -->
        <el-button 
          type="primary" 
          @click="handleQuery"
          :icon="Search"
          :loading="loading"
          style="margin-left: 12px;"
          class="query-button"
        >
          查询
        </el-button>
      </div>
      
      <div class="toolbar-right">
        <!-- 布局切换 -->
        <el-button-group class="layout-toggle-group">
          <el-button 
            :type="viewMode === 'card' ? 'primary' : 'default'"
            @click="viewMode = 'card'"
            class="layout-toggle-btn"
          >
            <el-tooltip content="卡片组布局" placement="top">
              <img src="/布局-切换1.svg" alt="卡片布局" class="layout-icon" />
            </el-tooltip>
          </el-button>
          <el-button 
            :type="viewMode === 'table' ? 'primary' : 'default'"
            @click="viewMode = 'table'"
            class="layout-toggle-btn"
          >
            <el-tooltip content="表格布局" placement="top">
              <img src="/布局-切换2.svg" alt="表格布局" class="layout-icon" />
            </el-tooltip>
          </el-button>
        </el-button-group>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-icon class="is-loading" size="32" color="#FF6F61">
        <Loading />
      </el-icon>
      <p>加载中...</p>
    </div>

    <!-- 空状态 -->
    <div v-else-if="filteredUsers.length === 0" class="empty-state">
      <el-empty description="暂无用户数据" />
    </div>

    <!-- 卡片式布局 -->
    <div v-else-if="viewMode === 'card'" class="card-layout">
      <div class="user-cards-grid">
        <div 
          v-for="user in filteredUsers" 
          :key="user.id" 
          class="user-card glass-card"
        >
          <!-- 用户头像和基本信息 -->
          <div class="card-header">
            <el-avatar :size="60" :src="user.avatar" class="user-avatar">
              <el-icon><User /></el-icon>
            </el-avatar>
            <div class="user-info">
              <h3 class="username">{{ user.username }}</h3>
              <p class="email">{{ user.email }}</p>
            </div>
            <!-- 状态指示器 -->
            <div class="status-indicator">
              <el-badge 
                :type="user.status === 0 ? 'success' : 'danger'"
                :value="user.status === 0 ? '正常' : '异常'"
                class="status-badge"
              />
            </div>
          </div>
          
          <!-- 角色标签 -->
          <div class="card-body">
            <el-tag 
              :type="user.mainRoleId === 0 ? 'danger' : 'primary'"
              effect="dark"
              class="role-tag"
            >
              {{ user.mainRoleId === 0 ? '管理员' : '普通用户' }}
            </el-tag>
          </div>
          
          <!-- 时间信息 -->
          <div class="card-footer">
            <div class="time-info">
              <p class="register-time">注册时间: {{ formatDate(user.registerTime) }}</p>
              <p class="login-time">最后登录: {{ formatDate(user.lastLoginTime) }}</p>
              <p class="location-info" v-if="user.location">位置: {{ user.location }}</p>
              <p class="login-ip">登录IP: {{ user.loginIp || '-' }}</p>
              <p class="login-device">设备: {{ formatDevice(user.loginDevice) }}</p>
            </div>
          </div>
          
          <!-- 操作菜单 -->
          <div class="card-actions">
            <el-dropdown @command="(command: string) => handleUserAction(command, user)">
              <el-button type="text" :icon="MoreFilled" class="action-btn" />
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item v-if="user.status === 1" command="toggle-status">
                    恢复
                  </el-dropdown-item>
                  <el-dropdown-item v-if="user.status === 0" command="restrict-status" :disabled="user.mainRoleId === 0">
                    限制
                  </el-dropdown-item>
                  <el-dropdown-item command="delete" :divided="user.status === 1 || user.status === 0" :disabled="user.mainRoleId === 0">删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </div>
    </div>

    <!-- 表格式布局 -->
    <div v-else class="table-layout">
      <el-table 
        :data="filteredUsers" 
        style="width: 100%"
        class="user-table"
        header-row-class-name="table-header"
      >
        <el-table-column label="头像" width="80" align="center">
          <template #default="{ row }">
            <el-avatar :size="40" :src="row.avatar" class="table-avatar">
              <el-icon><User /></el-icon>
            </el-avatar>
          </template>
        </el-table-column>
        
        <el-table-column label="用户名" min-width="120" align="center">
          <template #default="{ row }">
            <span class="username">{{ row.username }}</span>
          </template>
        </el-table-column>
        
        <el-table-column label="邮箱" min-width="180" align="center">
          <template #default="{ row }">
            <span class="email">{{ row.email }}</span>
          </template>
        </el-table-column>
        
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <div class="status-cell">
              <span :class="['status-dot', row.status === 0 ? 'status-active' : 'status-inactive']"></span>
              <span class="status-text">{{ row.status === 0 ? '正常' : '异常' }}</span>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="角色" width="100" align="center">
          <template #default="{ row }">
            <el-tag 
              :type="row.mainRoleId === 0 ? 'danger' : 'primary'"
              effect="dark"
              size="small"
            >
              {{ row.mainRoleId === 0 ? '管理员' : '普通用户' }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="注册时间" min-width="140" align="center">
          <template #default="{ row }">
            {{ formatDate(row.registerTime) }}
          </template>
        </el-table-column>
        
        <el-table-column label="最后登录" min-width="140" align="center">
          <template #default="{ row }">
            {{ formatDate(row.lastLoginTime) }}
          </template>
        </el-table-column>
        
        <el-table-column label="位置" min-width="120" align="center">
          <template #default="{ row }">
            {{ row.location || '-' }}
          </template>
        </el-table-column>
        
        <el-table-column label="登录IP" min-width="120" align="center">
          <template #default="{ row }">
            {{ row.loginIp || '-' }}
          </template>
        </el-table-column>
        
        <el-table-column label="登录设备" min-width="150" align="center">
          <template #default="{ row }">
            <div class="device-info">
              {{ formatDevice(row.loginDevice) }}
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="100" fixed="right" align="center">
          <template #default="{ row }">
            <el-dropdown @command="(command: any) => handleUserAction(command, row)">
              <el-button type="text" :icon="MoreFilled" />
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item v-if="row.status === 1" command="toggle-status">
                    恢复
                  </el-dropdown-item>
                  <el-dropdown-item v-if="row.status === 0" command="restrict-status" :disabled="row.mainRoleId === 0">
                    限制
                  </el-dropdown-item>
                  <el-dropdown-item command="delete" :divided="row.status === 1 || row.status === 0" :disabled="row.mainRoleId === 0">删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>
    </div>


  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search,
  User,
  MoreFilled,
  Loading
} from '@element-plus/icons-vue'
import {
  getAllUsers,
  queryUsers,
  deleteUser,
  toggleUserStatus,
  type SysUser,
  type UserMultiQueryParams
} from '../../../api/dashboard-header.ts'

// 响应式数据
const loading = ref(false)
const users = ref<SysUser[]>([])
const viewMode = ref<'card' | 'table'>('card')
const searchQuery = ref('')
const filterRole = ref<number | undefined>()
const filterStatus = ref<number | undefined>()

// 计算属性
const filteredUsers = computed(() => {
  // 直接返回用户数据，不进行实时过滤
  // 过滤逻辑移到查询按钮的handleQuery方法中
  return users.value
})

// 方法
const fetchUsers = async () => {
  loading.value = true
  try {
    const result = await getAllUsers()
    if (result.success) {
      users.value = result.data
    } else {
      ElMessage.error(result.message || '获取用户列表失败')
    }
  } catch (error) {
    console.error('获取用户列表失败:', error)
    ElMessage.error('获取用户列表失败')
  } finally {
    loading.value = false
  }
}

const handleQuery = async () => {
  loading.value = true
  try {
    const queryParams: UserMultiQueryParams = {}
    
    // 收集搜索条件
    if (searchQuery.value) {
      queryParams.usernameOrEmail = searchQuery.value
    }
    if (filterRole.value !== undefined) {
      queryParams.mainRoleId = filterRole.value
    }
    if (filterStatus.value !== undefined) {
      queryParams.status = filterStatus.value
    }
    
    const result = await queryUsers(queryParams)
    if (result.success) {
      users.value = result.data
      ElMessage.success('查询成功')
    } else {
      ElMessage.error(result.message || '查询失败')
    }
  } catch (error) {
    console.error('查询用户失败:', error)
    ElMessage.error('查询用户失败')
  } finally {
    loading.value = false
  }
}

const handleUserAction = async (command: string, user: SysUser) => {
  switch (command) {
    case 'toggle-status':
      await handleToggleUserStatus(user)
      break
      
    case 'restrict-status':
      await handleRestrictUserStatus(user)
      break
      
    case 'delete':
      await handleDeleteUser(user)
      break
  }
}

const handleToggleUserStatus = async (user: SysUser) => {
  // 只有异常状态(status=1)的用户才能恢复到正常状态(status=0)
  if (user.status !== 1) {
    ElMessage.warning('只有异常状态的用户才能恢复')
    return
  }
  
  const newStatus = 0 // 恢复到正常状态
  
  try {
    await ElMessageBox.confirm(
      `确定要恢复用户 "${user.username}" 吗？`,
      '确认恢复',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const result = await toggleUserStatus(user.id, newStatus)
    if (result.success) {
      ElMessage.success('恢复成功')
      await fetchUsers()
    } else {
      ElMessage.error(result.message || '恢复失败')
    }
  } catch (error) {
    // 用户取消操作
  }
}

const handleRestrictUserStatus = async (user: SysUser) => {
  // 只有正常状态(status=0)的用户才能限制到异常状态(status=1)
  if (user.status !== 0) {
    ElMessage.warning('只有正常状态的用户才能限制')
    return
  }
  
  // 管理员不能被限制
  if (user.mainRoleId === 0) {
    ElMessage.warning('管理员用户不能被限制')
    return
  }
  
  const newStatus = 1 // 限制到异常状态
  
  try {
    await ElMessageBox.confirm(
      `确定要限制用户 "${user.username}" 吗？`,
      '确认限制',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const result = await toggleUserStatus(user.id, newStatus)
    if (result.success) {
      ElMessage.success('限制成功')
      await fetchUsers()
    } else {
      ElMessage.error(result.message || '限制失败')
    }
  } catch (error) {
    // 用户取消操作
  }
}

const handleDeleteUser = async (user: SysUser) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除用户 "${user.username}" 吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const result = await deleteUser(user.id)
    if (result.success) {
      ElMessage.success('删除成功')
      await fetchUsers()
    } else {
      ElMessage.error(result.message || '删除失败')
    }
  } catch (error) {
    // 用户取消操作
  }
}



const formatDate = (dateString: string) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('zh-CN')
}

const formatDevice = (deviceString: string) => {
  if (!deviceString) return '-'
  
  // 提取浏览器信息
  if (deviceString.includes('Chrome')) {
    return 'Chrome浏览器'
  } else if (deviceString.includes('Edge')) {
    return 'Edge浏览器'
  } else if (deviceString.includes('Firefox')) {
    return 'Firefox浏览器'
  } else if (deviceString.includes('Safari') && !deviceString.includes('Chrome')) {
    return 'Safari浏览器'
  } else {
    return '其他浏览器'
  }
}

// 生命周期
onMounted(() => {
  fetchUsers()
})
</script>

<style scoped>
.user-management-container {
  padding: 24px;
  background: transparent;
}

/* 顶部工具栏 */
.top-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-title {
  margin: 0;
  color: #fff;
  font-size: 24px;
  font-weight: 600;
}

.toolbar-center {
  display: flex;
  align-items: center;
}

.toolbar-right {
  display: flex;
  align-items: center;
}

/* 加载状态 */
.loading-container {
  display: flex;
  justify-content: center;
  padding: 24px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* 空状态 */
.empty-state {
  padding: 60px 24px;
  text-align: center;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* 卡片布局 */
.card-layout {
  margin-top: 24px;
}

.user-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.user-card {
  position: relative;
  padding: 24px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
}

.user-card:hover {
  border-color: rgba(255, 111, 97, 0.3);
}

.card-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
}

.user-avatar {
  flex-shrink: 0;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.username {
  margin: 0 0 4px 0;
  color: #fff;
  font-size: 18px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.email {
  margin: 0;
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 表格中的用户名和邮箱样式 */
.user-table .username {
  font-weight: 600;
  color: #2c3e50;
}

.user-table .email {
  color: #7f8c8d;
  font-size: 14px;
}

.status-indicator {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-indicator.active {
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80 !important;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.status-indicator.inactive {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171 !important;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.status-badge {
  font-size: 12px;
}

.card-body {
  margin-bottom: 16px;
}

.role-tag {
  font-size: 12px;
}

.card-footer {
  margin-bottom: 16px;
}

.time-info p {
  margin: 0 0 4px 0;
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
}

.card-actions {
  position: absolute;
  bottom: 16px;
  right: 16px;
}

.action-btn {
  color: rgba(255, 255, 255, 0.6);
}

.action-btn:hover {
  color: #FF6F61;
}

/* 表格布局 */
.table-layout {
  margin-top: 24px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.user-table {
  background: transparent;
  width: 100% !important;
}

.user-table :deep(.el-table__inner-wrapper) {
  width: 100% !important;
}

.user-table :deep(.el-table__header-wrapper),
.user-table :deep(.el-table__body-wrapper) {
  width: 100% !important;
}

/* 去除悬停高亮效果 */
.user-table :deep(.el-table__body tr:hover) {
  background-color: transparent !important;
}

.user-table :deep(.el-table__body tr:hover > td) {
  background-color: transparent !important;
}

/* 表头样式 */
.user-table :deep(.table-header) {
  background: rgba(102, 126, 234, 0.1) !important;
  backdrop-filter: blur(10px);
}

.user-table :deep(.table-header th) {
  background: transparent !important;
  color: white !important;
  font-weight: 600;
  border-bottom: 2px solid rgba(102, 126, 234, 0.2);
  padding: 16px 12px;
}

.user-table :deep(.el-table__body tr) {
  background: transparent;
}

.user-table :deep(.el-table__body td) {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  color: white !important;
  padding: 12px;
}

.table-avatar {
  margin: 0 auto;
  border: 2px solid #e1e5e9;
}

.status-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-text {
  font-size: 14px;
}

.user-table :deep(.el-button) {
  color: white !important;
}

.user-table :deep(.el-button:hover) {
  color: #409eff !important;
}

.user-table :deep(.el-tag) {
  color: white !important;
}

.device-info {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  word-break: break-word;
  line-height: 1.4;
}

/* 查询按钮自定义样式 */
.query-button {
  background: #f5f5f5 !important;
  border: 1px solid #d9d9d9 !important;
  color: #666666 !important;
}

.query-button:hover {
  background: #e6f7ff !important;
  border-color: #40a9ff !important;
  color: #1890ff !important;
}

.query-button:active {
  background: #d9d9d9 !important;
}

/* 布局切换按钮组样式 */
.layout-toggle-group {
  background: rgba(255, 255, 255, 0.1) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  border-radius: 8px !important;
  padding: 4px !important;
  backdrop-filter: blur(10px);
}

.layout-toggle-btn {
  background: transparent !important;
  border: none !important;
  padding: 8px !important;
  min-width: auto !important;
  height: auto !important;
  border-radius: 6px !important;
}

.layout-toggle-btn:hover {
  background: rgba(255, 255, 255, 0.15) !important;
}

.layout-toggle-btn.is-active {
  background: rgba(102, 126, 234, 0.2) !important;
}

.layout-icon {
  width: 20px;
  height: 20px;
  filter: brightness(0.9);
  transition: filter 0.2s ease;
}

.layout-toggle-btn:hover .layout-icon {
  filter: brightness(1.1);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .top-toolbar {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .toolbar-left,
  .toolbar-center,
  .toolbar-right {
    justify-content: center;
  }
  
  .user-cards-grid {
    grid-template-columns: 1fr;
  }
}
</style>