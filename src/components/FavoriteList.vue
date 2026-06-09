<template>
  <div class="favorite-list">
    <!-- 列表头部 -->
    <div class="list-header" v-if="showHeader">
      <div class="list-info">
        <h3 class="list-title">
          <el-icon><Star /></el-icon>
          {{ title || '我的收藏' }}
          <span class="count-badge" v-if="favorites.length > 0">({{ favorites.length }})</span>
        </h3>
        <div class="list-actions">
          <el-dropdown v-if="showBatchActions">
            <button class="custom-btn batch-btn">
              <el-icon><Operation /></el-icon>
              批量操作
            </button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="handleBatchDelete" :disabled="selectedIds.length === 0">
                  <el-icon><Delete /></el-icon>
                  批量删除 ({{ selectedIds.length }})
                </el-dropdown-item>
                <el-dropdown-item @click="handleBatchMove" :disabled="selectedIds.length === 0">
                  <el-icon><FolderOpened /></el-icon>
                  批量移动 ({{ selectedIds.length }})
                </el-dropdown-item>
                <el-dropdown-item divided @click="handleSelectAll">
                  <el-icon><Select /></el-icon>
                  {{ selectedIds.length === favorites.length ? '取消全选' : '全选' }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          
          <el-dropdown v-if="showSortOptions">
            <button class="custom-btn sort-btn">
              <el-icon><Sort /></el-icon>
              排序
            </button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="handleSort('createTime', 'desc')">
                  <el-icon><Clock /></el-icon>
                  按创建时间（新到旧）
                </el-dropdown-item>
                <el-dropdown-item @click="handleSort('createTime', 'asc')">
                  <el-icon><Clock /></el-icon>
                  按创建时间（旧到新）
                </el-dropdown-item>
                <el-dropdown-item @click="handleSort('title', 'asc')">
                  <el-icon><Document /></el-icon>
                  按标题（A-Z）
                </el-dropdown-item>
                <el-dropdown-item @click="handleSort('accessCount', 'desc')">
                  <el-icon><View /></el-icon>
                  按访问次数
                </el-dropdown-item>
                <el-dropdown-item @click="handleSort('fileSize', 'desc')">
                  <el-icon><Files /></el-icon>
                  按文件大小
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          
          <button class="custom-btn view-toggle-btn" @click="toggleViewMode">
            <el-icon v-if="viewMode === 'grid'"><Grid /></el-icon>
            <el-icon v-else><List /></el-icon>
            {{ viewMode === 'grid' ? '网格视图' : '列表视图' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <div class="loading-content">
        <el-icon class="is-loading" size="32" color="var(--model-accent-orange)">
          <Loading />
        </el-icon>
        <p>加载收藏数据中...</p>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else-if="favorites.length === 0" class="empty-state">
      <el-icon class="empty-icon"><DocumentRemove /></el-icon>
      <h4>{{ emptyText || '暂无收藏' }}</h4>
      <p>{{ emptySubText || '您还没有添加任何收藏项' }}</p>
    </div>

    <!-- 收藏列表 -->
    <div v-else class="favorites-container" :class="{ 'grid-view': viewMode === 'grid', 'list-view': viewMode === 'list' }">
      <div 
        v-for="favorite in sortedFavorites" 
        :key="favorite.id" 
        class="favorite-item"
        :class="{ 'selected': selectedIds.includes(favorite.id) }"
      >
        <!-- 收藏卡片 -->
        <FavoriteCard 
          :favorite="favorite"
          @edit="handleEdit"
          @move="handleMove"
          @delete="handleDelete"
          @click="handleCardClick"
        />
      </div>
    </div>

    <!-- 分页 -->
    <div class="pagination-container" v-if="showPagination && totalCount > pageSize">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="totalCount"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        background
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Star,
  Operation,
  Delete,
  FolderOpened,
  Select,
  Sort,
  Clock,
  Document,
  View,
  Files,
  Grid,
  List,
  Loading,
  DocumentRemove,
} from '@element-plus/icons-vue'
import type { FavoriteVo } from '../api/favorites'
import FavoriteCard from './FavoriteCard.vue'

// Props
interface Props {
  favorites: FavoriteVo[]
  loading?: boolean
  title?: string
  emptyText?: string
  emptySubText?: string
  showHeader?: boolean
  showBatchActions?: boolean
  showSortOptions?: boolean
  showAddButton?: boolean
  showPagination?: boolean
  totalCount?: number
  pageSize?: number
  currentPage?: number
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  showHeader: true,
  showBatchActions: true,
  showSortOptions: true,
  showAddButton: true,
  showPagination: false,
  totalCount: 0,
  pageSize: 20,
  currentPage: 1
})

// Emits
interface Emits {
  edit: [favorite: FavoriteVo]
  move: [favorite: FavoriteVo]
  delete: [favoriteId: number]
  click: [favorite: FavoriteVo]
  batchDelete: [favoriteIds: number[]]
  batchMove: [favoriteIds: number[]]
  addFavorite: []
  sort: [field: string, order: 'asc' | 'desc']
  pageChange: [page: number]
  sizeChange: [size: number]
}

const emit = defineEmits<Emits>()

// 响应式数据
const selectedIds = ref<number[]>([])
const viewMode = ref<'grid' | 'list'>('grid')
const sortField = ref<string>('createTime')
const sortOrder = ref<'asc' | 'desc'>('desc')
const currentPage = ref(props.currentPage)
const pageSize = ref(props.pageSize)

// 计算属性
const sortedFavorites = computed(() => {
  const favorites = [...props.favorites]
  
  favorites.sort((a, b) => {
    let aValue: any = a[sortField.value as keyof FavoriteVo]
    let bValue: any = b[sortField.value as keyof FavoriteVo]
    
    // 处理字符串比较
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      aValue = aValue.toLowerCase()
      bValue = bValue.toLowerCase()
    }
    
    // 处理日期比较
    if (sortField.value.includes('Time')) {
      aValue = new Date(aValue).getTime()
      bValue = new Date(bValue).getTime()
    }
    
    if (sortOrder.value === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })
  
  return favorites
})

// 监听props变化
watch(() => props.currentPage, (newVal) => {
  currentPage.value = newVal
})

watch(() => props.pageSize, (newVal) => {
  pageSize.value = newVal
})

const handleSelectAll = () => {
  if (selectedIds.value.length === props.favorites.length) {
    selectedIds.value = []
  } else {
    selectedIds.value = props.favorites.map(f => f.id)
  }
}

const handleBatchDelete = async () => {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请先选择要删除的收藏项')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedIds.value.length} 个收藏项吗？`,
      '批量删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    emit('batchDelete', [...selectedIds.value])
    selectedIds.value = []
  } catch (error) {
    // 用户取消删除
  }
}

const handleBatchMove = () => {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请先选择要移动的收藏项')
    return
  }
  
  emit('batchMove', [...selectedIds.value])
}

const handleSort = (field: string, order: 'asc' | 'desc') => {
  sortField.value = field
  sortOrder.value = order
  emit('sort', field, order)
}

const toggleViewMode = () => {
  viewMode.value = viewMode.value === 'grid' ? 'list' : 'grid'
}

const handleEdit = (favorite: FavoriteVo) => {
  emit('edit', favorite)
}

const handleMove = (favorite: FavoriteVo) => {
  emit('move', favorite)
}

const handleDelete = (favoriteId: number) => {
  emit('delete', favoriteId)
  // 从选中列表中移除
  const index = selectedIds.value.indexOf(favoriteId)
  if (index > -1) {
    selectedIds.value.splice(index, 1)
  }
}

const handleCardClick = (favorite: FavoriteVo) => {
  emit('click', favorite)
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
  emit('pageChange', page)
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  emit('sizeChange', size)
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
  --model-accent-orange: #FF6F61;
}

/* 列表容器 */
.favorite-list {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 列表头部 */
.list-header {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--dashboard-glass-border);
}

.list-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
}

.list-title {
  color: var(--dashboard-text-primary);
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.list-title .el-icon {
  font-size: 20px;
  color: var(--dashboard-accent-orange);
}

.count-badge {
  color: var(--dashboard-accent-orange);
  font-weight: 600;
  margin-left: 8px;
}

.list-actions {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

/* 自定义按钮 */
.custom-btn {
  background: transparent;
  border: 1px solid var(--dashboard-glass-border);
  color: rgba(255, 255, 255, 0.8);
  padding: 8px 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  font-family: inherit;
  outline: none;
}

.custom-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
  color: rgba(255, 255, 255, 0.9);
}

.custom-btn .el-icon {
  font-size: 16px;
}

.batch-btn {
  background: rgba(125, 0, 255, 0.1);
  border-color: rgba(125, 0, 255, 0.3);
  color: var(--dashboard-accent-purple);
}

.batch-btn:hover {
  background: rgba(125, 0, 255, 0.2);
  border-color: rgba(125, 0, 255, 0.5);
}

/* 加载状态 */
.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  width: 100%;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  color: rgba(255, 255, 255, 0.8);
}

.loading-content p {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  color: rgba(255, 255, 255, 0.7);
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 20px;
  opacity: 0.6;
  color: rgba(255, 255, 255, 0.4);
}

.empty-state h4 {
  color: var(--dashboard-text-primary);
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.empty-state p {
  font-size: 14px;
  margin: 0 0 24px 0;
  line-height: 1.5;
}

/* 收藏容器 */
.favorites-container {
  flex: 1;
  overflow-y: auto;
}

.favorites-container.grid-view {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 8px;
}

.favorites-container.list-view {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.favorite-item {
  position: relative;
  transition: all 0.3s ease;
}

.favorite-item.selected {
  transform: scale(0.98);
}

.favorite-item.selected :deep(.favorite-card) {
  border-color: var(--dashboard-accent-orange);
  background: rgba(255, 111, 97, 0.1);
}

/* 分页 */
.pagination-container {
  margin-top: 24px;
  display: flex;
  justify-content: center;
}

:deep(.el-pagination) {
  --el-pagination-bg-color: transparent;
  --el-pagination-text-color: rgba(255, 255, 255, 0.8);
  --el-pagination-border-radius: 8px;
  --el-pagination-button-bg-color: rgba(255, 255, 255, 0.1);
  --el-pagination-button-color: rgba(255, 255, 255, 0.8);
  --el-pagination-hover-color: var(--dashboard-accent-orange);
}

:deep(.el-pagination .btn-prev),
:deep(.el-pagination .btn-next),
:deep(.el-pagination .el-pager li) {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid var(--dashboard-glass-border);
  color: rgba(255, 255, 255, 0.8);
}

:deep(.el-pagination .btn-prev:hover),
:deep(.el-pagination .btn-next:hover),
:deep(.el-pagination .el-pager li:hover) {
  background: rgba(255, 111, 97, 0.2);
  border-color: rgba(255, 111, 97, 0.4);
  color: var(--dashboard-accent-orange);
}

:deep(.el-pagination .el-pager li.is-active) {
  background: var(--dashboard-accent-orange);
  border-color: var(--dashboard-accent-orange);
  color: white;
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

:deep(.el-dropdown-menu__item.is-disabled) {
  color: rgba(0, 0, 0, 0.4);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .favorites-container.grid-view {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }
}

@media (max-width: 768px) {
  .list-info {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .list-actions {
    width: 100%;
    justify-content: flex-end;
  }
  
  .favorites-container.grid-view {
    grid-template-columns: 1fr;
  }
  
  .custom-btn {
    padding: 6px 12px;
    font-size: 13px;
  }
}
</style>