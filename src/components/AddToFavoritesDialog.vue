<template>
  <el-dialog
    v-model="dialogVisible"
    title="添加到收藏"
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
          {{ saving ? '保存中...' : '保存' }}
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
        <div class="create-category-footer">
          <button class="create-category-btn-small cancel" @click="createCategoryVisible = false">
            <el-icon><Close /></el-icon>
            取消
          </button>
          <button class="create-category-btn-small save" @click="handleCreateCategory">
            <el-icon><Check /></el-icon>
            创建
          </button>
        </div>
      </template>
    </el-dialog>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import {
  Plus,
  Lock,
  Unlock,
  Close,
  Check,
  Loading
} from '@element-plus/icons-vue'
import {
  addFavorite,
  createFavoriteCategory,
  type FavoriteDto,
  type FavoriteCategoryVo
} from '../api/favorites'

// Props
interface Props {
  visible: boolean
  initialData?: Partial<FavoriteDto>
  categories?: FavoriteCategoryVo[]
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  initialData: () => ({}),
  categories: () => []
})

// Emits
interface Emits {
  'update:visible': [visible: boolean]
  'success': [data: FavoriteDto]
  'cancel': []
  'categoryCreated': [category: FavoriteCategoryVo]
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

watch(() => props.initialData, (initialData) => {
  if (initialData && props.visible) {
    initForm()
  }
}, { deep: true })

// 方法
const initForm = () => {
  // 合并初始数据
  Object.assign(formData, {
    userId: 0,
    title: '',
    description: '',
    categoryId: 0,
    isPublic: 0,
    fileUrl: '',
    ...props.initialData
  })
  
  // 如果没有设置默认分类且有可用分类，选择第一个
  if (!formData.categoryId && props.categories.length > 0) {
    formData.categoryId = props.categories[0].id
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
    
    const response = await addFavorite(formData)
    if (response.success) {
      ElMessage.success('收藏添加成功')
      emit('success', { ...formData })
      dialogVisible.value = false
    } else {
      ElMessage.error(response.message || '添加失败')
    }
  } catch (error) {
    console.error('保存收藏失败:', error)
    ElMessage.error('保存失败，请重试')
  } finally {
    saving.value = false
  }
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
      // 创建新分类对象
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
.add-favorite-dialog {
  .dialog-content {
    padding: 0;
  }

  .favorite-form {
    .category-input-wrapper {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .create-category-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 6px 12px;
      font-size: 12px;
      color: #409eff;
      background: transparent;
      border: 1px solid #409eff;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
      height: 32px;

      &:hover {
        background: #409eff;
        color: white;
      }
    }
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 0;
  }

  .custom-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 6px 12px;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
    outline: none;

    &.cancel-btn {
      background: #f5f7fa;
      color: #606266;
      border: 1px solid #dcdfe6;

      &:hover {
        background: #e6e8eb;
        border-color: #c0c4cc;
      }
    }

    &.save-btn {
      background: #409eff;
      color: white;

      &:hover:not(:disabled) {
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
      }
    }

    .is-loading {
      animation: spin 1s linear infinite;
    }
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.create-category-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.create-category-btn-small {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  outline: none;

  &.cancel {
    background: #f5f7fa;
    color: #606266;
    border: 1px solid #dcdfe6;

    &:hover {
      background: #e6e8eb;
      border-color: #c0c4cc;
    }
  }

  &.save {
    background: #409eff;
    color: white;
    border: 1px solid #409eff;

    &:hover {
      background: #66b1ff;
      border-color: #66b1ff;
    }
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .add-favorite-dialog {
    width: 95% !important;
    margin: 20px;
  }
}
</style>