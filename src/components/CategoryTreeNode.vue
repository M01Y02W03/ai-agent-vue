<template xmlns="http://www.w3.org/1999/html">
  <div class="category-tree-node">
    <div
        class="node-content"
        :class="{
        'node-selected': category.id === selectedId,
        'drag-over': isDragOver,
        'dragging': isDragging
      }"
        draggable="true"
        @click="handleSelect"
        @dragstart="handleDragStart"
        @dragend="handleDragEnd"
        @dragover="handleDragOver"
        @dragleave="handleDragLeave"
        @drop="handleDrop"
    >
      <div class="node-left">
        <!-- 展开/收起按钮 -->
        <div
            class="expand-btn"
            :class="{ 'expand-btn-expanded': isExpanded, 'expand-btn-disabled': !hasChildren }"
            @click.stop="handleExpand"
        >
          <el-icon v-if="hasChildren" class="expand-icon">
            <ArrowRight/>
          </el-icon>
        </div>

        <!-- 文件夹图标 -->
        <div class="folder-icon">
          <span class="icon-emoji">{{ getFolderIcon(category.icon) }}</span>
        </div>

        <!-- 目录名称 -->
        <span class="category-name">{{ category.name }}</span>
      </div>

      <div class="node-right">
        <!-- 收藏数量 -->
        <span class="favorite-count" v-if="category.favoriteCount > 0">
          {{ category.favoriteCount }}
        </span>

        <!-- 操作按钮 -->
        <el-dropdown trigger="click" @click.stop>
          <button class="custom-action-btn">
            <el-icon>
              <MoreFilled/>
            </el-icon>
          </button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="handleEdit">
                <el-icon>
                  <Edit/>
                </el-icon>
                编辑目录
              </el-dropdown-item>
              <el-dropdown-item @click="handleAddChild">
                <el-icon>
                  <Plus/>
                </el-icon>
                新增目录
              </el-dropdown-item>
              <el-dropdown-item @click="handleDelete" class="delete-item">
                <el-icon>
                  <Delete/>
                </el-icon>
                删除目录
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- 子目录 -->
    <transition name="expand" @enter="onEnter" @leave="onLeave" @after-leave="onAfterLeave">
      <div class="children-container" v-if="hasChildren && isExpanded">
        <CategoryTreeNode
            v-for="child in category.children"
            :key="child.id"
            :category="child"
            :selected-id="selectedId"
            :level="level + 1"
            :category-tree="categoryTree"
            @select="$emit('select', $event)"
            @expand="$emit('expand', $event)"
            @refresh="$emit('refresh')"
            @edit="$emit('edit', $event)"
          @add-child="$emit('add-child', $event)"
      />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import {ref, computed, onMounted, onUnmounted} from 'vue'
import {ElMessage, ElMessageBox} from 'element-plus'
import {
  ArrowRight,
  MoreFilled,
  Edit,
  Plus,
  Delete,
} from '@element-plus/icons-vue'
import {
  getFolderIcon,
  type FavoriteCategoryVo,
  deleteFavoriteCategory,
  moveFavoriteCategory
} from '../api/favorites.ts'


// Props
interface Props {
  category: FavoriteCategoryVo
  selectedId: number | null
  level?: number
  categoryTree?: FavoriteCategoryVo[]
}

const props = withDefaults(defineProps<Props>(), {
  level: 0,
  categoryTree: () => []
})

// Emits
const emit = defineEmits<{
  select: [categoryId: number]
  expand: [categoryId: number]
  refresh: []
  edit: [category: FavoriteCategoryVo]
  'add-child': [parentCategory: FavoriteCategoryVo]
}>()

// 响应式数据
// 默认展开前三层，支持更深层级的目录显示（最多支持5级）
const isExpanded = ref(props.level < 3)
const isDragOver = ref(false)
const isDragging = ref(false)

// 计算属性
const hasChildren = computed(() => {
  return props.category.children && props.category.children.length > 0
})

const nodeIndent = computed(() => {
  return props.level * 20 + 'px'
})

// 方法
const handleSelect = () => {
  emit('select', props.category.id)
}

const handleExpand = () => {
  if (!hasChildren.value) return

  isExpanded.value = !isExpanded.value
  emit('expand', props.category.id)
}


// 拖拽相关方法
const handleDragStart = (event: DragEvent) => {
  if (!event.dataTransfer) {
    event.preventDefault()
    return
  }

  // 检查是否是在操作按钮上开始拖拽
  if ((event.target as HTMLElement).closest('.custom-action-btn, .expand-btn')) {
    event.preventDefault()
    return
  }

  // 设置拖拽状态
  isDragging.value = true

  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', JSON.stringify({
    id: props.category.id,
    name: props.category.name
  }))

  // 设置拖拽图像为透明，使用CSS控制视觉效果
  const dragImage = new Image()
  dragImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs='
  event.dataTransfer.setDragImage(dragImage, 0, 0)
}

const handleDragEnd = () => {
  isDragging.value = false
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  event.stopPropagation()

  if (!event.dataTransfer) return

  // 检查是否可以放置
  const dragData = event.dataTransfer.getData('text/plain')
  if (dragData) {
    try {
      const draggedCategory = JSON.parse(dragData)

      // 不能拖拽到自己身上
      if (draggedCategory.id === props.category.id) {
        event.dataTransfer.dropEffect = 'none'
        return
      }

      // 不能拖拽到自己的子目录下
      if (isDescendantOf(props.category, draggedCategory.id)) {
        event.dataTransfer.dropEffect = 'none'
        return
      }

      event.dataTransfer.dropEffect = 'move'
      isDragOver.value = true
    } catch (error) {
      event.dataTransfer.dropEffect = 'none'
    }
  }
}

const handleDragLeave = (event: DragEvent) => {
  event.preventDefault()
  event.stopPropagation()

  // 检查是否真的离开了当前元素
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const x = event.clientX
  const y = event.clientY

  if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
    isDragOver.value = false
  }
}

const handleDrop = async (event: DragEvent) => {
  event.preventDefault()
  event.stopPropagation()

  isDragOver.value = false

  if (!event.dataTransfer) return

  const dragData = event.dataTransfer.getData('text/plain')
  if (!dragData) return

  try {
    const draggedCategory = JSON.parse(dragData)

    // 验证移动的有效性
    if (draggedCategory.id === props.category.id) {
      ElMessage.warning('不能将目录移动到自己身上')
      return
    }

    if (isDescendantOf(props.category, draggedCategory.id)) {
      ElMessage.warning('不能将目录移动到自己的子目录下')
      return
    }

    // 显示确认对话框
    try {
      await ElMessageBox.confirm(
          `是否将目录 "${draggedCategory.name}" 移动到 "${props.category.name}" 目录下？`,
          '确认移动',
          {
            confirmButtonText: '确定移动',
            cancelButtonText: '取消',
            type: 'warning'
          }
      )

      // 执行移动操作
      const result = await moveFavoriteCategory(draggedCategory.id, props.category.id)

      if (result.success) {
        ElMessage.success(`已将 "${draggedCategory.name}" 移动到 "${props.category.name}" 下`)
        emit('refresh')
      } else {
        ElMessage.error(result.message || '目录移动失败')
      }
    } catch (confirmError) {
      // 用户取消了移动操作
      if (confirmError !== 'cancel') {
        console.error('移动确认失败:', confirmError)
      }
    }
  } catch (error: any) {
    console.error('目录移动失败:', error)
    ElMessage.error('目录移动失败: ' + (error.message || error))
  }
}

// 检查是否为某个目录的后代
const isDescendantOf = (category: FavoriteCategoryVo, ancestorId: number): boolean => {
  if (category.id === ancestorId) return true

  if (category.children) {
    return category.children.some(child => isDescendantOf(child, ancestorId))
  }

  return false
}

// 编辑和新增相关方法
const handleEdit = () => {
  emit('edit', props.category)
}

const handleAddChild = () => {
  emit('add-child', props.category)
}

const handleDelete = async () => {
  try {
    await ElMessageBox.confirm(
        `确定要删除目录 "${props.category.name}" 吗？\n注意：删除后将无法恢复，且会同时删除该目录下的所有收藏内容。`,
        '删除目录',
        {
          confirmButtonText: '确定删除',
          cancelButtonText: '取消',
          type: 'warning',
          confirmButtonClass: 'el-button--danger'
        }
    )

    const result = await deleteFavoriteCategory(props.category.id)

    if (result.success) {
      ElMessage.success('目录删除成功')
      emit('refresh')
    } else {
      ElMessage.error(result.message || '目录删除失败')
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('目录删除失败: ' + (error.message || error))
    }
  }
}

// 监听全局展开/折叠事件
const handleToggleExpandAll = (event: CustomEvent) => {
  const { expanded } = event.detail
  if (expanded) {
    // 展开所有节点
    isExpanded.value = true
  } else {
    // 折叠所有节点
    isExpanded.value = false
  }
}

// 监听展开父节点事件
const handleExpandParentNode = (event: CustomEvent) => {
  const { parentId } = event.detail
  if (props.category.id === parentId) {
    isExpanded.value = true
  }
}

// 监听展开状态同步事件
const handleSyncExpandState = (event: CustomEvent) => {
  const { expandedNodes } = event.detail
  if (expandedNodes instanceof Set) {
    isExpanded.value = expandedNodes.has(props.category.id)
  }
}

// 生命周期
onMounted(() => {
  window.addEventListener('toggle-expand-all', handleToggleExpandAll as EventListener)
  window.addEventListener('expand-parent-node', handleExpandParentNode as EventListener)
  window.addEventListener('sync-expand-state', handleSyncExpandState as EventListener)
})

onUnmounted(() => {
  window.removeEventListener('toggle-expand-all', handleToggleExpandAll as EventListener)
  window.removeEventListener('expand-parent-node', handleExpandParentNode as EventListener)
  window.removeEventListener('sync-expand-state', handleSyncExpandState as EventListener)
})

// 动画方法
const onEnter = (el: Element) => {
  const element = el as HTMLElement
  element.style.height = '0'
  element.style.overflow = 'hidden'
  
  // 强制重排
  element.offsetHeight
  
  element.style.height = element.scrollHeight + 'px'
}

const onLeave = (el: Element) => {
  const element = el as HTMLElement
  element.style.height = element.scrollHeight + 'px'
  element.style.overflow = 'hidden'
  
  // 强制重排
  element.offsetHeight
  
  element.style.height = '0'
}

const onAfterLeave = (el: Element) => {
  const element = el as HTMLElement
  // 清理内联样式，避免留下空白区域
  element.style.height = ''
  element.style.overflow = ''
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

.category-tree-node {
  width: 100%;
  max-width: 330px;
  box-sizing: border-box;
}

.node-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 4px;
  margin: 1px 0;
  position: relative;
  margin-left: v-bind(nodeIndent);
  width: calc(100% - v-bind(nodeIndent));
  max-width: calc(330px - v-bind(nodeIndent));
  box-sizing: border-box;
  border-radius: 6px;
  user-select: none;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.node-content:hover {
  background: rgba(255, 255, 255, 0.05);
}

.node-content.node-selected {
  background: rgba(135, 206, 250, 0.15);
}

.node-content.node-selected .category-name {
  color: #87CEEB;
  font-weight: 600;
}

.node-content.drag-over {
  background: rgba(255, 255, 255, 0.1);
  border: 1px dashed rgba(255, 255, 255, 0.3);
}

.node-content.dragging {
  opacity: 0.5;
}

.node-left {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.expand-btn {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 2px;
  cursor: pointer;
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.expand-btn-expanded .expand-icon {
  transform: rotate(90deg);
}

.expand-btn-disabled {
  cursor: default;
  opacity: 0.3;
}

.folder-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.icon-emoji {
  font-size: 16px;
  line-height: 1;
}

.category-name {
  color: #87CEEB;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
  max-width: 200px;
  line-height: 1.2;
  transition: color 0.2s ease;
}

.node-right {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.favorite-count {
  color: #87CEEB;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: 500;
  min-width: 16px;
  text-align: center;
}

.custom-action-btn {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.custom-action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
}

.children-container {
   overflow: hidden;
 }

 /* 展开收起动画 */
 .expand-enter-active,
 .expand-leave-active {
   transition: height 0.3s ease;
   overflow: hidden;
 }

 .expand-enter-from,
 .expand-leave-to {
   height: 0;
 }

.delete-item {
  color: #ff6b6b;
}

.delete-item:hover {
  background: rgba(255, 107, 107, 0.1);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .node-content {
    padding: 6px 8px;
  }

  .category-name {
    font-size: 13px;
  }

  .favorite-count {
    font-size: 11px;
    padding: 1px 4px;
  }
}
</style>