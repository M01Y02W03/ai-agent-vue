<template>
  <div class="user-favorites-container">
      <!-- 左侧收藏目录树 -->
      <div class="favorites-sidebar glass-card">
        <div class="sidebar-header">
          <h3 class="sidebar-title">
            <el-icon><Folder /></el-icon>
            目录结构
          </h3>
          <div class="header-actions">
            <button class="custom-btn add-category-btn" @click="handleCreateCategory">
              <el-icon><Plus /></el-icon>
              新建目录
            </button>
          </div>
        </div>

        <div class="category-tree">
          <div v-if="treeLoading" class="loading-container">
            <div class="loading-content">
              <el-icon class="is-loading" size="32" color="var(--dashboard-accent-orange)">
                <Loading />
              </el-icon>
              <p>加载目录数据中...</p>
            </div>
          </div>
          
          <div v-else-if="categoryTree.length === 0" class="empty-tree">
            <el-icon class="empty-icon"><FolderOpened /></el-icon>
            <p>您还未添加收藏</p>
          </div>

          <div v-else class="tree-container">
            <CategoryTreeNode
              v-for="category in categoryTree"
              :key="category.id"
              :category="category"
              :selected-id="selectedCategoryId"
              :category-tree="categoryTree"
              @select="handleCategorySelect"
              @expand="handleCategoryExpand"
              @refresh="loadCategoryTree"
              @edit="handleEditCategory"
              @add-child="handleAddChildCategory"
            />
          </div>
        </div>
      </div>

      <!-- 右侧主内容区 -->
      <div class="favorites-main">
        <!-- 搜索栏 -->
        <div class="search-section glass-card">
          <div class="search-content">
            <div class="search-input-row">
              <el-input
                v-model="searchKeyword"
                placeholder="搜索关键词..."
                class="search-input"
                clearable
                @keyup.enter="handleSearch"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
              <button class="custom-btn search-btn" @click="handleSearch">
                <el-icon><Search /></el-icon>
                搜索
              </button>
            </div>
            <div class="file-type-tags">
              <el-tag
                v-for="type in fileTypes"
                :key="type.value"
                :class="['type-tag', { 'selected': selectedFileType === type.value }]"
                @click="handleFileTypeTagClick(type.value)"
              >
                {{ type.label }}
              </el-tag>
            </div>
          </div>
        </div>

        <!-- 收藏内容展示区 -->
        <div class="content-section glass-card">
          <div class="content-body">
            <!-- 收藏列表 -->
            <FavoriteList
              :favorites="favoritesList"
              :loading="favoritesLoading"
              :show-pagination="true"
              :total-count="totalCount"
              :page-size="pageSize"
              :current-page="currentPage"
              @edit="handleEditFavorite"
              @move="handleMoveFavorite"
              @delete="handleDeleteFavorite"
              @click="handleFavoriteClick"
              @batch-delete="handleBatchDeleteFavorites"
              @batch-move="handleBatchMoveFavorites"
              @sort="handleSortFavorites"
              @page-change="handlePageChange"
              @size-change="handleSizeChange"
            />
          </div>
        </div>
      </div>

      <!-- 目录编辑弹窗 -->
      <CategoryEditDialog
        v-model:visible="showCreateDialog"
        :is-edit="!!(editingCategory && 'id' in editingCategory && editingCategory.id)"
        :category-data="editingCategory || { parentId: 0 }"
        :category-tree="categoryTree"
        @success="handleDialogSuccess"
      />

      <!-- 添加/编辑收藏弹窗 -->
      <AddFavoriteDialog
        v-model:visible="addFavoriteDialogVisible"
        :favorite="editingFavorite"
        :categories="flattenCategories(categoryTree)"
        @success="handleFavoriteEditSuccess"
        @category-created="handleCategoryCreated"
      />

      <!-- 移动收藏弹窗 -->
      <el-dialog
        v-model="moveFavoriteDialogVisible"
        title="移动收藏"
        width="400px"
      >
        <el-select
          v-model="targetCategoryId"
          placeholder="请选择目标分类"
          style="width: 100%"
          filterable
        >
          <el-option
            v-for="category in flattenCategories(categoryTree)"
            :key="category.id"
            :label="category.name"
            :value="category.id"
          />
        </el-select>
        <template #footer>
          <el-button @click="moveFavoriteDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleConfirmMove" :disabled="!targetCategoryId">
            移动
          </el-button>
        </template>
      </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Folder,
  FolderOpened,
  Plus,
  Search,
  Loading,
} from '@element-plus/icons-vue'
import {
  getFavoriteCategoryTree,
  getFavoriteList,
  getFavoritesByCategory,
  deleteFavorite,
  moveFavorite,
  searchFavorites,
  type FavoriteCategoryVo,
  type FavoriteVo,
  getFavoritesByType
} from '../../api/favorites'
import CategoryTreeNode from '../../components/CategoryTreeNode.vue'
import CategoryEditDialog from '../../components/CategoryEditDialog.vue'
import FavoriteList from '../../components/FavoriteList.vue'
import AddFavoriteDialog from '../../components/EditFavoriteDialog.vue'

// 响应式数据
const treeLoading = ref(false)
const categoryTree = ref<FavoriteCategoryVo[]>([])
const selectedCategoryId = ref<number | null>(null)
const searchKeyword = ref('')
const selectedFileType = ref('')
const showCreateDialog = ref(false)
const editingCategory = ref<FavoriteCategoryVo | { parentId: number } | null>(null)
const expandedNodes = ref<Set<number>>(new Set())

// 文件类型标签数据
const fileTypes = ref([
  { label: '全部类型', value: '' },
  { label: '文档', value: 'document' },
  { label: '图片', value: 'image' },
  { label: '视频', value: 'video' },
  { label: '音频', value: 'audio' },
  { label: '其他', value: 'other' }
])

// 收藏相关数据
const favoritesList = ref<FavoriteVo[]>([])
const favoritesLoading = ref(false)
const totalCount = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const sortField = ref('createTime')
const sortOrder = ref<'asc' | 'desc'>('desc')

// 对话框相关
const addFavoriteDialogVisible = ref(false)
const editingFavorite = ref<FavoriteVo | null>(null)
const moveFavoriteDialogVisible = ref(false)
const movingFavoriteIds = ref<number[]>([])
const targetCategoryId = ref<number | null>(null)

// 方法
const loadCategoryTree = async (): Promise<void> => {
  treeLoading.value = true
  try {
    const response = await getFavoriteCategoryTree()
    if (response.success) {
      // 在更新目录树之前，清理已删除目录的展开状态
      cleanupExpandedNodes(response.data || [])
      categoryTree.value = response.data || []
    } else {
      ElMessage.error(response.message || '获取目录树失败')
    }
  } catch (error) {
    console.error('加载目录树失败:', error)
    ElMessage.error('加载目录树失败，请稍后重试')
  } finally {
    treeLoading.value = false
  }
}

// 加载收藏列表
const loadFavoritesList = async () => {
  try {
    favoritesLoading.value = true
    
    // 如果有搜索关键词，使用搜索接口
    if (searchKeyword.value.trim()) {
      const params: any = {
        keyword: searchKeyword.value.trim()
      }
      
      if (selectedCategoryId.value) {
        params.categoryId = selectedCategoryId.value
      }
      
      const response = await searchFavorites(params.keyword, params.categoryId)
       if (response.success) {
         let results = response.data || []
         
         // 如果选择了文件类型，进行客户端筛选
         if (selectedFileType.value) {
           results = results.filter((item: any) => filterByFileType(item.fileType, selectedFileType.value))
         }
         
         favoritesList.value = results
         totalCount.value = results.length
       } else {
         ElMessage.error(response.message || '搜索失败')
       }
    } else {
      // 普通列表加载
      const params: any = {
        page: currentPage.value,
        size: pageSize.value
      }
      
      if (selectedCategoryId.value) {
        params.categoryId = selectedCategoryId.value
      }
      
      let response
      if (selectedFileType.value) {
        // 根据文件类型获取
        response = await getFavoritesByType(selectedFileType.value)
      } else {
        // 获取全部或指定分类的收藏
        response = selectedCategoryId.value 
          ? await getFavoritesByCategory(selectedCategoryId.value)
          : await getFavoriteList(params.categoryId, params.page, params.size)
      }
      
      if (response.success) {
         favoritesList.value = response.data || []
         // 更新总数为当前数据长度
         totalCount.value = favoritesList.value.length
       } else {
         ElMessage.error(response.message || '加载收藏列表失败')
       }
    }
  } catch (error) {
    console.error('加载收藏列表失败:', error)
    ElMessage.error('加载收藏列表失败')
  } finally {
    favoritesLoading.value = false
  }
}

// 清理已删除目录的展开状态
const cleanupExpandedNodes = (categories: FavoriteCategoryVo[]) => {
  const existingIds = new Set<number>()
  
  const collectIds = (cats: FavoriteCategoryVo[]) => {
    cats.forEach(cat => {
      existingIds.add(cat.id)
      if (cat.children && cat.children.length > 0) {
        collectIds(cat.children)
      }
    })
  }
  
  collectIds(categories)
  
  // 移除不存在的目录ID
  const expandedArray = Array.from(expandedNodes.value)
  expandedArray.forEach(id => {
    if (!existingIds.has(id)) {
      expandedNodes.value.delete(id)
    }
  })
  
  // 同步展开状态到子组件
  syncExpandState()
}

// 同步展开状态到所有子组件
const syncExpandState = () => {
  window.dispatchEvent(new CustomEvent('sync-expand-state', {
    detail: { expandedNodes: expandedNodes.value }
  }))
}

const findCategoryById = (categories: FavoriteCategoryVo[], id: number): FavoriteCategoryVo | null => {
  for (const category of categories) {
    if (category.id === id) {
      return category
    }
    if (category.children && category.children.length > 0) {
      const found = findCategoryById(category.children, id)
      if (found) return found
    }
  }
  return null
}

const handleCategorySelect = (categoryId: number) => {
  selectedCategoryId.value = categoryId
  currentPage.value = 1
  loadFavoritesList()
  console.log('选中目录:', categoryId)
}

const handleCategoryExpand = (categoryId: number) => {
  console.log('展开/收起目录:', categoryId)
  // 更新展开状态
  if (expandedNodes.value.has(categoryId)) {
    expandedNodes.value.delete(categoryId)
  } else {
    expandedNodes.value.add(categoryId)
  }
}

const handleCreateCategory = () => {
  editingCategory.value = null
  showCreateDialog.value = true
}

const handleEditCategory = (category: FavoriteCategoryVo) => {
  editingCategory.value = category
  showCreateDialog.value = true
}

const handleAddChildCategory = (parentCategory: FavoriteCategoryVo) => {
  editingCategory.value = { parentId: parentCategory.id }
  showCreateDialog.value = true
}

const handleDialogSuccess = () => {
  // 记录当前编辑的分类信息，用于新增后自动展开
  const currentEditingCategory = editingCategory.value
  
  loadCategoryTree().then(() => {
    // 如果是新增子目录，确保所有祖先目录都展开
    if (currentEditingCategory && 'parentId' in currentEditingCategory && currentEditingCategory.parentId && currentEditingCategory.parentId !== 0) {
      // 展开所有祖先目录
      expandAllAncestors(currentEditingCategory.parentId)
      
      // 通知所有CategoryTreeNode组件更新展开状态
      nextTick(() => {
        window.dispatchEvent(new CustomEvent('expand-parent-node', { 
          detail: { parentId: currentEditingCategory.parentId } 
        }))
      })
    }
  })
}

// 展开所有祖先目录的辅助函数
const expandAllAncestors = (categoryId: number) => {
  const findAndExpandAncestors = (categories: FavoriteCategoryVo[], targetId: number): boolean => {
    for (const category of categories) {
      if (category.id === targetId) {
        expandedNodes.value.add(category.id)
        return true
      }
      
      if (category.children && category.children.length > 0) {
        if (findAndExpandAncestors(category.children, targetId)) {
          expandedNodes.value.add(category.id)
          return true
        }
      }
    }
    return false
  }
  
  findAndExpandAncestors(categoryTree.value, categoryId)
}

const handleEditFavorite = (favorite: FavoriteVo) => {
  editingFavorite.value = favorite
  addFavoriteDialogVisible.value = true
}

const handleMoveFavorite = (favorite: FavoriteVo) => {
  movingFavoriteIds.value = [favorite.id]
  targetCategoryId.value = null
  moveFavoriteDialogVisible.value = true
}

const handleDeleteFavorite = async (favoriteId: number) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这个收藏项吗？',
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const response = await deleteFavorite(favoriteId)
     if (response.success) {
       ElMessage.success('删除成功')
       loadFavoritesList()
     } else {
       ElMessage.error(response.message || '删除失败')
     }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除收藏失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

const handleFavoriteClick = (favorite: FavoriteVo) => {
  // 打开收藏项链接
  if (favorite.url) {
    window.open(favorite.url, '_blank')
  }
}

const handleBatchDeleteFavorites = async (favoriteIds: number[]) => {
  try {
    for (const id of favoriteIds) {
      await deleteFavorite(id)
    }
    ElMessage.success(`成功删除 ${favoriteIds.length} 个收藏项`)
    loadFavoritesList()
  } catch (error) {
    console.error('批量删除失败:', error)
    ElMessage.error('批量删除失败')
  }
}

const handleBatchMoveFavorites = (favoriteIds: number[]) => {
  movingFavoriteIds.value = favoriteIds
  targetCategoryId.value = null
  moveFavoriteDialogVisible.value = true
}

const handleConfirmMove = async () => {
  if (!targetCategoryId.value) {
    ElMessage.warning('请选择目标分类')
    return
  }
  
  try {
    for (const id of movingFavoriteIds.value) {
      await moveFavorite(id, targetCategoryId.value)
    }
    ElMessage.success(`成功移动 ${movingFavoriteIds.value.length} 个收藏项`)
    moveFavoriteDialogVisible.value = false
    loadFavoritesList()
  } catch (error) {
    console.error('移动收藏失败:', error)
    ElMessage.error('移动失败')
  }
}

const handleFavoriteEditSuccess = () => {
  addFavoriteDialogVisible.value = false
  loadFavoritesList()
  ElMessage.success('收藏操作成功')
}

const handleCategoryCreated = () => {
  loadCategoryTree()
}

const handleSortFavorites = (field: string, order: 'asc' | 'desc') => {
  sortField.value = field
  sortOrder.value = order
  loadFavoritesList()
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  loadFavoritesList()
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  loadFavoritesList()
}

// 搜索相关方法
const handleSearch = () => {
  currentPage.value = 1
  loadFavoritesList()
}

const handleFileTypeTagClick = (value: string) => {
  selectedFileType.value = value
  currentPage.value = 1
  loadFavoritesList()
}

// 工具方法
const fileTypeMap = {
  document: ['pdf', 'doc', 'docx', 'txt', 'md', 'rtf'],
  image: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'],
  video: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm'],
  audio: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma']
}

const filterByFileType = (fileType: string, selectedType: string): boolean => {
  if (!selectedType) return true
  
  const type = fileType?.toLowerCase() || ''
  const typeList = fileTypeMap[selectedType as keyof typeof fileTypeMap]
  
  if (selectedType === 'other') {
    const allKnownTypes = Object.values(fileTypeMap).flat()
    return !allKnownTypes.includes(type)
  }
  
  return typeList?.includes(type) || false
}

const flattenCategories = (categories: FavoriteCategoryVo[]): FavoriteCategoryVo[] => {
  const result: FavoriteCategoryVo[] = []
  
  const flatten = (cats: FavoriteCategoryVo[]) => {
    for (const cat of cats) {
      result.push(cat)
      if (cat.children && cat.children.length > 0) {
        flatten(cat.children)
      }
    }
  }
  
  flatten(categories)
  return result
}

// 生命周期
onMounted(() => {
  loadCategoryTree()
  loadFavoritesList()
})
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

/* 容器样式 */
.user-favorites-container {
  width: 100%;
  height: 100%;
  padding: 24px;
  background: transparent;
  display: flex;
  gap: 12px;
  overflow: hidden;
}

/* 玻璃卡片效果 */
.glass-card {
  background: var(--dashboard-glass-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--dashboard-glass-border);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

/* 左侧收藏目录树 */
.favorites-sidebar {
  width: 450px;
  min-width: 450px;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid var(--dashboard-glass-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: nowrap;
  gap: 12px;
  min-height: 60px;
}

.sidebar-title {
  color: var(--dashboard-text-primary);
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.sidebar-title .el-icon {
  font-size: 20px;
  color: var(--dashboard-accent-orange);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.expand-all-btn .el-icon {
  font-size: 16px;
}

/* 自定义按钮基础样式 */
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

.custom-btn:active {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(1px);
}

.custom-btn .el-icon {
  font-size: 16px;
}

/* 主要操作按钮样式 */
.add-category-btn,
.add-favorite-btn {
  background: rgba(255, 111, 97, 0.1);
  border-color: rgba(255, 111, 97, 0.3);
  color: var(--dashboard-accent-orange);
}

.add-category-btn:hover,
.add-favorite-btn:hover {
  background: rgba(255, 111, 97, 0.2);
  border-color: rgba(255, 111, 97, 0.5);
}

/* 搜索按钮样式 */
.search-btn {
  background: transparent;
  border: none;
  color: var(--dashboard-accent-orange);
  padding: 8px 12px;
}

.search-btn:hover {
  opacity: 0.8;
}

/* 更多操作按钮 */
.more-btn {
  padding: 8px 12px;
}

.category-tree {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  overflow-x: hidden;
}

.empty-tree {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: rgba(255, 255, 255, 0.6);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
  opacity: 0.6;
}

.empty-tree p {
  margin: 0;
  font-size: 14px;
}

.tree-container {
  width: 100%;
}

/* 加载状态样式 */
.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
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

/* 右侧主内容区 */
.favorites-main {
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 24px;
  overflow: hidden;
}

/* 搜索区域 */
.search-section {
  padding: 16px 20px;
  flex-shrink: 0;
}

.search-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.search-input-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.search-input {
  flex: 1;
  min-width: 200px;
  --el-input-bg-color: rgba(255, 255, 255, 0.1);
  --el-input-border-color: rgba(255, 255, 255, 0.2);
  --el-input-hover-border-color: rgba(255, 111, 97, 0.4);
  --el-input-focus-border-color: var(--dashboard-accent-orange);
  --el-input-text-color: rgba(255, 255, 255, 0.9);
  --el-input-placeholder-color: rgba(255, 255, 255, 0.5);
}



/* 内容展示区域 */
.content-section {
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.content-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--dashboard-glass-border);
}

.count-badge {
  color: var(--dashboard-accent-orange);
  font-weight: 600;
  margin-left: 8px;
}

.content-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.content-body {
  flex: 1;
  overflow-y: auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 开发中提示样式 */
.development-notice {
  display: flex;
  align-items: center;
  gap: 20px;
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
}

.notice-icon {
  font-size: 48px;
  color: #FFC107;
  opacity: 0.8;
}

.notice-text h4 {
  font-size: 20px;
  font-weight: 600;
  color: var(--dashboard-text-primary);
  margin: 0 0 8px 0;
}

.notice-text p {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
  line-height: 1.5;
}

/* 自定义滚动条 */
.category-tree::-webkit-scrollbar,
.content-body::-webkit-scrollbar {
  width: 6px;
}

.category-tree::-webkit-scrollbar-track,
.content-body::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.category-tree::-webkit-scrollbar-thumb,
.content-body::-webkit-scrollbar-thumb {
  background: rgba(255, 111, 97, 0.4);
  border-radius: 3px;
}

.category-tree::-webkit-scrollbar-thumb:hover,
.content-body::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 111, 97, 0.6);
}



/* 文件类型标签样式 */
.file-type-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

.type-tag {
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.15);
  border: none;
  color: rgba(255, 255, 255, 0.8);
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
}

.type-tag:hover {
  background: rgba(255, 255, 255, 0.25);
  color: rgba(255, 255, 255, 0.9);
}

.type-tag.selected {
  background: var(--dashboard-accent-orange);
  color: white;
}

.type-tag.selected:hover {
  background: rgba(255, 111, 97, 0.8);
}

/* 操作按钮样式 */
.batch-btn, .sort-btn, .grid-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.8);
  padding: 8px 16px;
  border-radius: 8px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
}

.batch-btn:hover, .sort-btn:hover, .grid-btn:hover {
  background: rgba(255, 111, 97, 0.2);
  border-color: rgba(255, 111, 97, 0.4);
  color: var(--dashboard-accent-orange);
  transform: translateY(-1px);
}



/* 响应式设计 */
@media (max-width: 1200px) {
  .favorites-sidebar {
    width: 280px;
    min-width: 280px;
  }
}

@media (max-width: 768px) {
  .user-favorites-container {
    padding: 16px;
  }

  .favorites-sidebar {
    width: 100%;
    min-width: auto;
    height: 300px;
  }

  .favorites-main {
    gap: 16px;
  }

  .search-section,
  .content-section {
    padding: 16px;
  }

  .sidebar-header {
    padding: 16px;
  }

  .content-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .content-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .development-notice {
    flex-direction: column;
    gap: 16px;
  }

  .notice-text h4 {
    font-size: 18px;
  }

  .notice-text p {
    font-size: 13px;
  }

  .search-filters {
    gap: 8px;
  }

  .type-filter {
    min-width: 100px;
  }
}
</style>