<template>
  <el-dialog
    v-model="dialogVisible"
    :title="isEdit ? '编辑收藏' : '添加收藏'"
    width="600px"
    :before-close="handleClose"
    class="add-favorite-dialog"
    append-to-body
  >
    <div class="dialog-content">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="80px"
        class="favorite-form"
      >
        <!-- 收藏标题 -->
        <el-form-item label="标题" prop="title">
          <el-input
            v-model="formData.title"
            placeholder="请输入收藏标题"
            maxlength="100"
            show-word-limit
            clearable
          />
        </el-form-item>

        <!-- 文件URL -->
        <el-form-item label="文件URL" prop="fileUrl">
          <el-input
            v-model="formData.fileUrl"
            placeholder="请输入文件URL"
            readonly
            @blur="handleUrlBlur"
          >
            <template #prepend>
              <el-icon><Link /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <!-- 收藏分类 -->
        <el-form-item label="所属目录" prop="categoryId">
          <div class="category-input-wrapper">
            <el-select
              v-model="formData.categoryId"
              placeholder="请选择收藏分类"
              style="flex: 1"
              filterable
              clearable
            >
              <el-option
                v-for="category in categoryOptions"
                :key="category.id"
                :label="category.name"
                :value="category.id"
              >
                <span>{{ category.name }}</span>
              </el-option>
            </el-select>
            <button type="button" class="custom-btn create-category-btn" @click="showCreateCategory">
              <el-icon><Plus /></el-icon>
              新建分类
            </button>
          </div>
        </el-form-item>

        <!-- 描述 -->
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入收藏描述（可选）"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>

        <!-- 公开设置 -->
        <el-form-item label="公开设置">
          <el-radio-group v-model="formData.isPublic">
            <el-radio :label="0">
              <el-icon><Lock /></el-icon>
              私有（仅自己可见）
            </el-radio>
            <el-radio :label="1">
              <el-icon><Unlock /></el-icon>
              公开（所有人可见）
            </el-radio>
          </el-radio-group>
        </el-form-item>


      </el-form>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <button class="custom-btn cancel-btn" @click="handleClose">
          <el-icon><Close /></el-icon>
          取消
        </button>
        <button class="custom-btn save-btn" @click="handleSave" :disabled="saving">
          <el-icon v-if="saving" class="is-loading"><Loading /></el-icon>
          <el-icon v-else><Check /></el-icon>
          {{ saving ? '保存中...' : (isEdit ? '更新' : '保存') }}
        </button>
      </div>
    </template>

    <!-- 创建分类对话框 -->
    <el-dialog
      v-model="createCategoryVisible"
      title="创建新分类"
      width="400px"
      append-to-body
    >
      <el-form :model="categoryForm" label-width="60px">
        <el-form-item label="名称">
          <el-input v-model="categoryForm.name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="图标">
          <el-input v-model="categoryForm.icon" placeholder="请输入图标（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <button class="custom-btn cancel-btn" @click="createCategoryVisible = false">
          取消
        </button>
        <button class="custom-btn save-btn" @click="handleCreateCategory">
          创建
        </button>
      </template>
    </el-dialog>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import {
  Link,
  Plus,
  Lock,
  Unlock,
  Close,
  Check,
  Loading
} from '@element-plus/icons-vue'
import {type FavoriteDto, type FavoriteVo, type FavoriteCategoryVo, createFavoriteCategory} from '../api/favorites'
import { addFavorite, updateFavorite } from '../api/favorites'

// Props
interface Props {
  visible: boolean
  favorite?: FavoriteVo | null
  categories: FavoriteCategoryVo[]
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  favorite: null,
  categories: () => []
})

// Emits
interface Emits {
  'update:visible': [visible: boolean]
  success: [favorite: FavoriteVo]
  categoryCreated: [category: FavoriteCategoryVo]
}

const emit = defineEmits<Emits>()

// 响应式数据
const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const formRef = ref<FormInstance>()
const saving = ref(false)
const createCategoryVisible = ref(false)

// 表单数据
const formData = reactive<FavoriteDto>({
  userId: 0,
  title: '',
  description: '',
  categoryId: 0,
  isPublic: 0,
  fileUrl: ''
})

// 分类表单
const categoryForm = reactive({
  name: '',
  icon: ''
})



// 计算属性
const isEdit = computed(() => !!props.favorite)

const categoryOptions = computed(() => {
  return props.categories.map(cat => ({
    id: cat.id,
    name: cat.name,
    icon: cat.icon
  }))
})

// 表单验证规则
const formRules: FormRules = {
  title: [
    { required: true, message: '请输入收藏标题', trigger: 'blur' },
    { min: 1, max: 100, message: '标题长度应在1-100个字符之间', trigger: 'blur' }
  ],
  categoryId: [
    { required: true, message: '请选择收藏分类', trigger: 'change' }
  ],
  fileUrl: [
    { required: true, message: '请输入文件URL', trigger: 'blur' }
  ]
}

// 监听props变化
watch(() => props.visible, (visible) => {
  if (visible) {
    initForm()
  } else {
    resetForm()
  }
})

watch(() => props.favorite, (favorite) => {
  if (favorite && props.visible) {
    initForm()
  }
})

// 方法
const initForm = () => {
  if (props.favorite) {
    // 编辑模式
    Object.assign(formData, {
      userId: props.favorite.userId,
      title: props.favorite.title,
      description: props.favorite.description || '',
      categoryId: props.favorite.categoryId,
      isPublic: props.favorite.isPublic,
      fileUrl: props.favorite.url
    })
    

  } else {
    // 新增模式
    resetFormData()
  }
}

const resetForm = () => {
  formRef.value?.resetFields()
  resetFormData()
}

const resetFormData = () => {
  Object.assign(formData, {
    userId: 0,
    title: '',
    description: '',
    categoryId: 0,
    isPublic: 0,
    fileUrl: ''
  })
}

const handleClose = () => {
  dialogVisible.value = false
}

const handleSave = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    saving.value = true
    
    if (isEdit.value && props.favorite) {
      // 更新收藏
      await updateFavorite(props.favorite.id, formData)
      ElMessage.success('收藏更新成功')
    } else {
      // 添加收藏
      await addFavorite(formData)
      ElMessage.success('收藏添加成功')
    }
    
    emit('success', props.favorite || ({} as FavoriteVo))
    dialogVisible.value = false
  } catch (error) {
    console.error('保存收藏失败:', error)
    ElMessage.error('保存失败，请重试')
  } finally {
    saving.value = false
  }
}

const handleUrlBlur = () => {
  // URL输入失焦处理
}





const showCreateCategory = () => {
  categoryForm.name = ''
  categoryForm.icon = ''
  createCategoryVisible.value = true
}

const handleCreateCategory = async () => {
  if (!categoryForm.name.trim()) {
    ElMessage.warning('请输入分类名称')
    return
  }
  
  try {
    const response = await createFavoriteCategory({
      name: categoryForm.name,
      parentId: undefined,
      description: '',
      icon: categoryForm.icon || 'folder'
    })
    
    if (response.success) {
      ElMessage.success('分类创建成功')
      // 添加到本地分类列表
      const newCategory: FavoriteCategoryVo = {
        id: Date.now(),
        name: categoryForm.name,
        icon: categoryForm.icon || 'folder',
        parentId: 0,
        userId: 0,
        level: 1,
        sort: 0,
        description: '',
        status: 1,
        createTime: new Date().toISOString(),
        updateTime: new Date().toISOString(),
        children: [],
        favoriteCount: 0
      }
      
      emit('categoryCreated', newCategory)
      formData.categoryId = newCategory.id
      createCategoryVisible.value = false
    } else {
      ElMessage.error(response.message || '分类创建失败')
    }
  } catch (error) {
    console.error('创建分类失败:', error)
    ElMessage.error('创建分类失败')
  }
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

/* 对话框样式 */
:deep(.add-favorite-dialog .el-dialog) {
  background: rgba(30, 30, 30, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid var(--dashboard-glass-border);
  border-radius: 12px;
}

:deep(.add-favorite-dialog .el-dialog__header) {
  background: transparent;
  border-bottom: 1px solid var(--dashboard-glass-border);
  padding: 20px 24px 16px;
}

:deep(.add-favorite-dialog .el-dialog__title) {
  color: var(--dashboard-text-primary);
  font-size: 18px;
  font-weight: 600;
}

:deep(.add-favorite-dialog .el-dialog__body) {
  padding: 24px;
}

:deep(.add-favorite-dialog .el-dialog__footer) {
  padding: 16px 24px 24px;
  border-top: 1px solid var(--dashboard-glass-border);
}

/* 表单样式 */
.dialog-content {
  max-height: 70vh;
  overflow-y: auto;
}

.favorite-form {
  color: #000000;
}

:deep(.favorite-form .el-form-item__label) {
  color: #000000;
  font-weight: 500;
}

:deep(.favorite-form .el-input__wrapper) {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  box-shadow: none;
}



:deep(.favorite-form .el-input__inner) {
  color: #000000;
  background: transparent;
}

:deep(.favorite-form .el-input__inner::placeholder) {
  color: rgba(0, 0, 0, 0.5);
}

:deep(.favorite-form .el-textarea__inner) {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  color: #000000;
}

:deep(.favorite-form .el-textarea__inner::placeholder) {
  color: rgba(0, 0, 0, 0.5);
}





/* 分类选择 */
:deep(.el-select .el-input__wrapper) {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(0, 0, 0, 0.2);
}



.category-input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 单选按钮组 */
:deep(.el-radio-group .el-radio) {
  color: #000000;
  margin-right: 24px;
}

:deep(.el-radio-group .el-radio__input.is-checked .el-radio__inner) {
  background-color: #409eff;
  border-color: #409eff;
}

:deep(.el-radio-group .el-radio__input.is-checked + .el-radio__label) {
  color: #409eff;
}



/* 自定义按钮 */
.custom-btn {
  background: transparent;
  border: 1px solid var(--dashboard-glass-border);
  color: #000000;
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
  background: rgba(0, 0, 0, 0.1);
  border-color: rgba(0, 0, 0, 0.3);
  color: #000000;
}

.custom-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.custom-btn .el-icon {
  font-size: 16px;
}

.create-category-btn {
  background: rgba(125, 0, 255, 0.1);
  border-color: rgba(125, 0, 255, 0.3);
  color: var(--dashboard-accent-purple);
  font-size: 12px;
  padding: 6px 12px;
  white-space: nowrap;
  height: 32px;
}

.create-category-btn:hover {
  background: rgba(125, 0, 255, 0.2);
  border-color: rgba(125, 0, 255, 0.5);
}

.save-btn {
  background: rgba(255, 111, 97, 0.1);
  border-color: rgba(255, 111, 97, 0.3);
  color: #000000;
}

.save-btn:hover {
  background: rgba(255, 111, 97, 0.2);
  border-color: rgba(255, 111, 97, 0.5);
}

.remove-btn {
  background: rgba(255, 0, 0, 0.1);
  border-color: rgba(255, 0, 0, 0.3);
  color: #ff4757;
  padding: 4px 8px;
}

.remove-btn:hover {
  background: rgba(255, 0, 0, 0.2);
  border-color: rgba(255, 0, 0, 0.5);
}

/* 对话框底部 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 下拉菜单样式 */
:deep(.el-select-dropdown) {
  background: rgba(30, 30, 30, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

:deep(.el-select-dropdown .el-select-dropdown__item) {
  color: #000000;
}

:deep(.el-select-dropdown .el-select-dropdown__item:hover) {
  background: rgba(0, 0, 0, 0.1);
}

:deep(.el-select-dropdown .el-select-dropdown__item.selected) {
  background: rgba(255, 111, 97, 0.2);
  color: var(--dashboard-accent-orange);
}

/* 响应式设计 */
@media (max-width: 768px) {
  :deep(.add-favorite-dialog .el-dialog) {
    width: 95% !important;
    margin: 5vh auto;
  }

  .dialog-footer {
    flex-direction: column;
  }
  
  .custom-btn {
    justify-content: center;
  }
}
</style>