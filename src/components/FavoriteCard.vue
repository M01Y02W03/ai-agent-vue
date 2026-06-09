<template>
  <div class="favorite-card glass-card">
    <!-- 收藏项头部 -->
    <div class="card-header">
      <div class="file-info">
        <!-- 文件图标已移除 -->
        <div class="file-details">
          <h4 class="file-title" :title="favorite.title">{{ favorite.title }}</h4>
          <div class="file-meta">
            <span class="file-size">{{ formatFileSize(favorite.fileSize) }}</span>
            <span class="file-type">{{ favorite.fileType }}</span>
            <span class="access-count">{{ favorite.accessCount }} 次访问</span>
          </div>
        </div>
      </div>
      <div class="card-actions">
        <el-dropdown @click.stop trigger="hover">
          <button class="action-btn">
            <el-icon><MoreFilled /></el-icon>
          </button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="handleEdit">
                <el-icon><Edit /></el-icon>
                编辑
              </el-dropdown-item>
              <el-dropdown-item @click="handleMove">
                <el-icon><FolderOpened /></el-icon>
                移动
              </el-dropdown-item>
              <el-dropdown-item @click="handleDownload" v-if="favorite.url">
                <el-icon><Download /></el-icon>
                下载
              </el-dropdown-item>
              <el-dropdown-item divided @click="handleDelete">
                <el-icon><Delete /></el-icon>
                删除
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- 收藏项描述 -->
    <div class="card-body" v-if="favorite.description">
      <p class="description" :title="favorite.description">{{ favorite.description }}</p>
    </div>

    <!-- 收藏项底部信息 -->
    <div class="card-footer">
      <div class="category-info">
        <el-icon><Folder /></el-icon>
        <span class="category-name">{{ favorite.categoryName }}</span>
      </div>
      <div class="time-info">
        <div class="privacy-status">
          <el-icon v-if="favorite.isPublic === 1"><View /></el-icon>
          <el-icon v-else><Hide /></el-icon>
          <span>{{ favorite.isPublic === 1 ? '公开' : '私有' }}</span>
        </div>
        <span class="create-time">{{ formatTime(favorite.createTime) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import {
  MoreFilled,
  Edit,
  Delete,
  Download,
  FolderOpened,
  Folder,
  View,
  Hide
} from '@element-plus/icons-vue'
import type { FavoriteVo } from '../api/favorites'

// Props
interface Props {
  favorite: FavoriteVo
}

const props = defineProps<Props>()

// Emits
interface Emits {
  edit: [favorite: FavoriteVo]
  move: [favorite: FavoriteVo]
  delete: [favoriteId: number]
  click: [favorite: FavoriteVo]
}

const emit = defineEmits<Emits>()

// 文件图标函数已移除

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (!bytes || bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 格式化时间
const formatTime = (timeStr: string): string => {
  if (!timeStr) return ''
  
  const date = new Date(timeStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  const week = 7 * day
  const month = 30 * day
  
  if (diff < minute) {
    return '刚刚'
  } else if (diff < hour) {
    return Math.floor(diff / minute) + '分钟前'
  } else if (diff < day) {
    return Math.floor(diff / hour) + '小时前'
  } else if (diff < week) {
    return Math.floor(diff / day) + '天前'
  } else if (diff < month) {
    return Math.floor(diff / week) + '周前'
  } else {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }
}

const handleEdit = () => {
  emit('edit', props.favorite)
}

const handleMove = () => {
  emit('move', props.favorite)
}

const handleDownload = () => {
  if (props.favorite.url) {
    window.open(props.favorite.url, '_blank')
  } else {
    ElMessage.warning('该收藏项没有可下载的文件')
  }
}

const handleDelete = () => {
  // 直接触发删除事件，让父组件处理确认逻辑
  emit('delete', props.favorite.id)
}
</script>

<style scoped>
/* 全局变量 */
:root {
  --dashboard-accent-orange: #FF6F61;
  --dashboard-accent-purple: #7D00FF;
  --dashboard-text-primary: #d28787;
  --dashboard-glass-bg: rgba(255, 255, 255, 0.1);
  --dashboard-glass-border: rgba(255, 255, 255, 0.2);
}

/* 收藏卡片样式 */
.favorite-card {
  padding: 16px;
  margin-bottom: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 12px;
  position: relative;
  overflow: hidden;
}

.favorite-card:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 111, 97, 0.4);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.favorite-card:active {
  transform: translateY(0);
}

/* 卡片头部 */
.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 12px;
}

.file-info {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

/* 文件图标样式已移除 */

.file-details {
  flex: 1;
  min-width: 0;
}

.file-title {
  color: var(--dashboard-text-primary);
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 6px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.2;
}

.file-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  flex-wrap: wrap;
}

.file-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.card-actions {
  flex-shrink: 0;
}

.action-btn {
  background: transparent;
  border: 1px solid var(--dashboard-glass-border);
  color: rgba(255, 255, 255, 0.7);
  padding: 6px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
  color: rgba(255, 255, 255, 0.9);
}

.action-btn .el-icon {
  font-size: 16px;
}

/* 卡片主体 */
.card-body {
  margin-bottom: 12px;
}

.description {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  line-height: 1.5;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

/* 卡片底部 */
.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px solid var(--dashboard-glass-border);
  font-size: 12px;
}

.category-info {
  display: flex;
  align-items: center;
  gap: 6px;
  color: rgba(255, 255, 255, 0.7);
}

.category-info .el-icon {
  font-size: 14px;
  color: var(--dashboard-accent-orange);
}

.category-name {
  font-weight: 500;
}

.time-info {
  display: flex;
  align-items: center;
  gap: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.privacy-status {
  display: flex;
  align-items: center;
  gap: 4px;
}

.privacy-status .el-icon {
  font-size: 14px;
}

.create-time {
  font-size: 11px;
}

/* 下拉菜单样式 */
:deep(.el-dropdown-menu) {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

:deep(.el-dropdown-menu__item) {
  color: rgba(0, 0, 0, 0.8);
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

:deep(.el-dropdown-menu__item:hover) {
  background: rgba(0, 0, 0, 0.1);
  color: rgba(0, 0, 0, 0.9);
}

:deep(.el-dropdown-menu__item.is-divided) {
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .favorite-card {
    padding: 12px;
  }
  
  .file-info {
    gap: 8px;
  }
  
  /* 响应式文件图标样式已移除 */
  
  .file-title {
    font-size: 14px;
  }
  
  .file-meta {
    font-size: 11px;
    gap: 8px;
  }
  
  .card-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .time-info {
    gap: 8px;
  }
}
</style>