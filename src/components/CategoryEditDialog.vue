<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    :title="isEdit ? '编辑目录' : '新建目录'"
    width="500px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    class="category-dialog"
  >
    <div class="dialog-content">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="80px"
        class="category-form"
      >
        <el-form-item label="目录名称" prop="name">
          <el-input
            v-model="formData.name"
            placeholder="请输入目录名称"
            maxlength="50"
            show-word-limit
            clearable
          />
        </el-form-item>
        
        <el-form-item label="目录图标" prop="icon">
          <el-select
            v-model="formData.icon"
            placeholder="选择图标"
            class="icon-select"
          >
            <el-option
              v-for="(emoji, key) in iconOptions"
              :key="key"
              :label="`${emoji} ${key}`"
              :value="key"
            >
              <span class="option-icon">{{ emoji }}</span>
              <span class="option-name">{{ key }}</span>
            </el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item label="父目录" prop="parentId" v-if="!isEdit">
          <el-tree-select
            v-model="formData.parentId"
            :data="categoryTreeOptions"
            :props="treeSelectProps"
            placeholder="选择父目录（留空为根目录）"
            clearable
            check-strictly
            :render-after-expand="false"
            class="parent-select"
          />
        </el-form-item>
        
        <el-form-item label="排序" prop="sort">
          <el-input-number
            v-model="formData.sort"
            :min="0"
            :max="9999"
            placeholder="排序值"
            class="sort-input"
          />
        </el-form-item>
        
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入目录描述（可选）"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
        
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
    </div>
    
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel" :disabled="loading">
          取消
        </el-button>
        <el-button
          type="primary"
          @click="handleSubmit"
          :loading="loading"
        >
          {{ loading ? '保存中...' : '确定' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import {
  getFolderIcon,
  type FavoriteCategoryDto,
  type FavoriteCategoryVo,
  createFavoriteCategory,
  updateFavoriteCategory
} from '../api/favorites'

// Props
interface Props {
  visible: boolean
  isEdit?: boolean
  categoryData?: FavoriteCategoryVo | { parentId: number } | null
  categoryTree?: FavoriteCategoryVo[]
}

const props = withDefaults(defineProps<Props>(), {
  isEdit: false,
  categoryData: null,
  categoryTree: () => []
})

// Emits
const emit = defineEmits<{
  'update:visible': [value: boolean]
  'success': []
}>()

// 响应式数据
const formRef = ref<FormInstance>()
const loading = ref(false)

// 表单数据
const formData = reactive<FavoriteCategoryDto>({
  name: '',
  icon: 'folder',
  parentId: 0,
  sort: 0,
  description: '',
  status: 1
})

// 图标选项
const iconOptions = {
  'folder': '📁',
  'document': '📄',
  'image': '🖼️',
  'video': '🎥',
  'music': '🎵',
  'code': '💻',
  'book': '📚',
  'star': '⭐',
  'heart': '❤️',
  'work': '💼',
  'study': '📖',
  'project': '🚀',
  'tech': '⚙️',
  'article': '📝',
  'link': '🔗',
  'archive': '📦'
}

// 表单验证规则
const formRules: FormRules = {
  name: [
    { required: true, message: '请输入目录名称', trigger: 'blur' },
    { min: 1, max: 50, message: '目录名称长度在 1 到 50 个字符', trigger: 'blur' }
  ],
  icon: [
    { required: true, message: '请选择目录图标', trigger: 'change' }
  ],
  sort: [
    { type: 'number', min: 0, max: 9999, message: '排序值范围为 0-9999', trigger: 'blur' }
  ]
}

// 树形选择器配置
const treeSelectProps = {
  value: 'id',
  label: 'name',
  children: 'children'
}

// 计算属性
const categoryTreeOptions = computed(() => {
  // 构建树形选择器的数据，排除当前编辑的目录及其子目录
  const buildTreeOptions = (categories: FavoriteCategoryVo[]): any[] => {
    return categories
      .filter(category => {
        // 如果是编辑模式，排除当前目录及其子目录
        if (props.isEdit && props.categoryData && isFullCategory(props.categoryData)) {
          return !isDescendantOf(category, props.categoryData.id)
        }
        return true
      })
      .map(category => ({
        id: category.id,
        name: `${getFolderIcon(category.icon || 'folder')} ${category.name}`,
        children: category.children ? buildTreeOptions(category.children) : []
      }))
  }
  
  // 添加根目录选项
  const rootOption = {
    id: 0,
    name: '📁 根目录',
    children: buildTreeOptions(props.categoryTree)
  }
  
  return [rootOption]
})

// 辅助函数：检查是否为某个目录的后代
const isDescendantOf = (category: FavoriteCategoryVo, ancestorId: number): boolean => {
  if (category.id === ancestorId) return true
  
  if (category.children) {
    return category.children.some(child => isDescendantOf(child, ancestorId))
  }
  
  return false
}

// 辅助函数：检查是否为完整的目录对象
const isFullCategory = (data: any): data is FavoriteCategoryVo => {
  return data && typeof data.id === 'number' && typeof data.name === 'string'
}

// 方法
const resetForm = () => {
  Object.assign(formData, {
    name: '',
    icon: 'folder',
    parentId: 0,
    sort: 0,
    description: '',
    status: 1
  })
  
  nextTick(() => {
    formRef.value?.clearValidate()
  })
}

const initFormData = () => {
  if (props.isEdit && props.categoryData && isFullCategory(props.categoryData)) {
    // 编辑模式：填充现有数据
    Object.assign(formData, {
      name: props.categoryData.name || '',
      icon: props.categoryData.icon || 'folder',
      parentId: props.categoryData.parentId || 0,
      sort: props.categoryData.sort || 0,
      description: props.categoryData.description || '',
      status: props.categoryData.status || 1
    })
  } else if (props.categoryData?.parentId !== undefined) {
    // 新建子目录模式：设置父目录ID
    resetForm()
    formData.parentId = props.categoryData.parentId
  } else {
    // 新建模式：重置表单
    resetForm()
  }
}

const handleCancel = () => {
  emit('update:visible', false)
  resetForm()
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    const valid = await formRef.value.validate()
    if (!valid) return
    
    loading.value = true
    
    let result
    if (props.isEdit && props.categoryData && isFullCategory(props.categoryData)) {
      // 编辑目录
      result = await updateFavoriteCategory(props.categoryData.id, formData)
    } else {
      // 新建目录
      result = await createFavoriteCategory(formData)
    }
    
    if (result.success) {
      ElMessage.success(result.message || `目录${props.isEdit ? '更新' : '创建'}成功`)
      emit('success')
      emit('update:visible', false)
      resetForm()
    } else {
      ElMessage.error(result.message || `目录${props.isEdit ? '更新' : '创建'}失败`)
    }
  } catch (error: any) {
    console.error(`目录${props.isEdit ? '更新' : '创建'}失败:`, error)
    ElMessage.error(`目录${props.isEdit ? '更新' : '创建'}失败: ${error.message || error}`)
  } finally {
    loading.value = false
  }
}

// 监听弹窗显示状态
watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      initFormData()
    }
  },
  { immediate: true }
)
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

.category-dialog {
  --el-dialog-bg-color: rgba(30, 30, 30, 0.95);
  --el-dialog-border-color: var(--dashboard-glass-border);
}

.category-dialog :deep(.el-dialog) {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.category-dialog :deep(.el-dialog__header) {
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  padding: 20px 24px 16px;
}

.category-dialog :deep(.el-dialog__title) {
  color: #333333;
  font-size: 18px;
  font-weight: 600;
}

.category-dialog :deep(.el-dialog__body) {
  padding: 24px;
}

.dialog-content {
  color: #333333;
}

.category-form {
  --el-form-label-font-size: 14px;
}

.category-form :deep(.el-form-item__label) {
  color: #333333;
  font-weight: 500;
}

/* 输入框样式 */
.category-form :deep(.el-input__wrapper) {
  background-color: #ffffff;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.category-form :deep(.el-input__wrapper:hover) {
  border-color: rgba(255, 111, 97, 0.4);
}

.category-form :deep(.el-input__wrapper.is-focus) {
  border-color: var(--dashboard-accent-orange);
  box-shadow: 0 0 0 2px rgba(255, 111, 97, 0.2);
}

.category-form :deep(.el-input__inner) {
  color: #333333;
}

.category-form :deep(.el-input__inner::placeholder) {
  color: #999999;
}

/* 文本域样式 */
.category-form :deep(.el-textarea__inner) {
  background-color: #ffffff;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  color: #333333;
  transition: all 0.3s ease;
}

.category-form :deep(.el-textarea__inner:hover) {
  border-color: rgba(255, 111, 97, 0.4);
}

.category-form :deep(.el-textarea__inner:focus) {
  border-color: var(--dashboard-accent-orange);
  box-shadow: 0 0 0 2px rgba(255, 111, 97, 0.2);
}

.category-form :deep(.el-textarea__inner::placeholder) {
  color: #999999;
}

/* 图标选择器样式 */
.icon-select {
  width: 100%;
}

.icon-select :deep(.el-select__wrapper) {
  background: #ffffff;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
}

.icon-select :deep(.el-select__wrapper:hover) {
  border-color: rgba(255, 111, 97, 0.4);
}

.icon-select :deep(.el-select__wrapper.is-focused) {
  border-color: var(--dashboard-accent-orange);
  box-shadow: 0 0 0 2px rgba(255, 111, 97, 0.2);
}

.option-icon {
  margin-right: 8px;
  font-size: 16px;
}

.option-name {
  color: #333333;
}

/* 数字输入框样式 */
.sort-input {
  width: 100%;
}

.sort-input :deep(.el-input-number) {
  width: 100%;
}

.sort-input :deep(.el-input__wrapper) {
  background-color: #ffffff;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
}

/* 单选按钮样式 */
.category-form :deep(.el-radio) {
  color: #333333;
  margin-right: 20px;
}

.category-form :deep(.el-radio__input.is-checked .el-radio__inner) {
  background-color: transparent;
  border-color: #409eff;
}

.category-form :deep(.el-radio__input.is-checked .el-radio__inner::after) {
  background-color: #409eff;
}

.category-form :deep(.el-radio__input.is-checked + .el-radio__label) {
  color: #409eff;
}

.category-form :deep(.el-radio__input.is-checked .el-radio__inner) {
  background-color: var(--dashboard-accent-orange);
  border-color: var(--dashboard-accent-orange);
}

.category-form :deep(.el-radio__input.is-checked + .el-radio__label) {
  color: var(--dashboard-accent-orange);
}

/* 树形选择器样式 */
.parent-select :deep(.el-tree-select) {
  width: 100%;
}

.parent-select :deep(.el-select__wrapper) {
  background-color: #ffffff;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
}

.parent-select :deep(.el-select__wrapper:hover) {
  border-color: rgba(255, 111, 97, 0.4);
}

.parent-select :deep(.el-select__wrapper.is-focused) {
  border-color: var(--dashboard-accent-orange);
  box-shadow: 0 0 0 2px rgba(255, 111, 97, 0.2);
}

/* 底部按钮样式 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px 20px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.dialog-footer :deep(.el-button) {
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 500;
}

.dialog-footer :deep(.el-button--default) {
  background: #ffffff;
  border: 1px solid #d9d9d9;
  color: #333333;
}

.dialog-footer :deep(.el-button--default:hover) {
  background: #f5f5f5;
  border-color: #b3b3b3;
}

.dialog-footer :deep(.el-button--primary) {
  background: #409eff;
  border-color: #409eff;
  color: white;
}

.dialog-footer :deep(.el-button--primary:hover) {
  background: #66b1ff;
  border-color: #66b1ff;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .category-dialog :deep(.el-dialog) {
    width: 90% !important;
    margin: 5vh auto;
  }
}
</style>