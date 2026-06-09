<template>
  <div class="model-management">
    <div v-if="loading" class="loading-container">
      <div class="loading-content">
        <el-icon class="is-loading" size="32" color="var(--model-accent-orange)">
          <Loading />
        </el-icon>
        <p>加载模型数据中...</p>
      </div>
    </div>

    <div v-else-if="error" class="empty-state">
      <el-icon size="64" color="rgba(255, 255, 255, 0.5)"><Warning /></el-icon>
      <h3>模型加载失败</h3>
      <p>{{ error }}😔</p>
      <el-button type="primary" @click="fetchModels" round>重试</el-button>
    </div>

    <div v-else-if="models.length > 0" class="models-grid">
      <div
          v-for="model in models"
          :key="model.id"
          class="model-card glass-card"
          :class="{ 'disabled': model.status === 1 }"
      >
        <div class="model-status">
          <el-tag
              :type="model.status === 0 ? 'success' : 'danger'"
              size="small"
              effect="dark"
              round
          >
            {{ model.status === 0 ? '已启用' : '已禁用' }}
          </el-tag>
          <el-tag
              v-if="model.isMultimodal === 1"
              type="warning"
              size="small"
              effect="dark"
              class="multimodal-tag"
              round
          >
            多模态模型
          </el-tag>
        </div>

        <div class="model-icon-wrapper">
          <div class="model-icon">
            <!-- 模型logo -->
            <img
                v-if="model.logoUrl"
                :src="model.logoUrl"
                :alt="model.modelName"
                class="model-logo"
            />
            <el-icon
                v-else
                size="36"
                :color="getModelIconColor(model.type)"
            >
              <component :is="getModelIcon(model.type)" />
            </el-icon>
          </div>
        </div>

        <div class="model-info">
          <div class="model-info-row">
            <div class="model-text-content">
              <h3 class="model-name">{{ model.modelName }}</h3>
              <p class="model-description">{{ model.description }}</p>
            </div>
            <div class="model-meta">
              <span class="model-type">{{ model.type }}</span>
              <span class="model-version">v{{ model.version }}</span>
            </div>
          </div>
        </div>

        <div class="model-details">
          <div class="detail-row">
            <span class="detail-label">提供商:</span>
            <span class="detail-value">{{ model.provider }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">大小:</span>
            <span class="detail-value">{{ model.size }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">参数:</span>
            <span class="detail-value">{{ model.parameters }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">上下文:</span>
            <span class="detail-value">{{ model.contextLength.toLocaleString() }} tokens</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">许可证:</span>
            <span class="detail-value">{{ model.license }}</span>
          </div>
        </div>

        <div class="model-actions">
          <el-button
              type="danger"
              @click="handleDeleteModel(model)"
          >
            <el-icon><Delete /></el-icon>
            删除
          </el-button>
          <el-button
              type="primary"
              @click="handleEditModel(model)"
          >
            <el-icon><Edit /></el-icon>
            编辑
          </el-button>
        </div>

        <div class="model-footer">
          <div class="creator-info">
            <el-icon size="14"><User /></el-icon>
            <span>{{ model.creator }}</span>
          </div>
          <div class="time-info">
            <el-icon size="14"><Clock /></el-icon>
            <span>{{ formatTime(model.createTime) }}</span>
          </div>
        </div>
      </div>

      <!-- 添加模型卡片 -->
      <div class="model-card glass-card add-model-card" @click="handleAddModel">
        <div class="add-model-content">
          <div class="add-model-icon">
            <el-icon size="48" color="rgba(255, 255, 255, 0.6)">
              <Plus />
            </el-icon>
          </div>
          <h3 class="add-model-title">添加新模型</h3>
        </div>
      </div>
    </div>

    <div v-else class="empty-state glass-card">
      <el-icon size="64" color="rgba(255, 255, 255, 0.5)"><Box /></el-icon>
      <h3>未找到模型</h3>
    </div>

    <!-- 编辑模型弹窗 -->
    <el-dialog
        v-model="editDialogVisible"
        title="编辑模型"
        width="600px"
        :before-close="handleEditCancel"
        class="edit-model-dialog"
    >
      <el-form :model="editForm" label-width="120px" class="edit-form">
        <el-form-item label="模型类型" required>
          <el-select v-model="editForm.type" placeholder="选择模型类型" style="width: 100%">
            <el-option label="多模态模型" value="multimodal" />
            <el-option label="嵌入模型" value="embedding" />
            <el-option label="文本模型" value="rag" />
          </el-select>
        </el-form-item>

        <el-form-item label="模型名称" required>
          <el-input v-model="editForm.modelName" placeholder="输入模型名称" />
        </el-form-item>

        <el-form-item label="模型描述">
          <el-input v-model="editForm.description" type="textarea" :rows="3" placeholder="输入模型描述" />
        </el-form-item>

        <el-form-item label="模型大小">
          <el-input v-model="editForm.size" placeholder="如：4.1GB" />
        </el-form-item>

        <el-form-item label="模型版本">
          <el-input v-model="editForm.version" placeholder="如：1.0" />
        </el-form-item>

        <el-form-item label="提供商">
          <el-input v-model="editForm.provider" placeholder="如：Meta" />
        </el-form-item>

        <el-form-item label="上下文长度">
          <el-input v-model="editForm.contextLength" type="number" placeholder="如：8192" />
        </el-form-item>

        <el-form-item label="参数量">
          <el-input v-model="editForm.parameters" placeholder="如：7B" />
        </el-form-item>

        <el-form-item label="多模态支持">
          <el-select v-model="editForm.isMultimodal" placeholder="选择多模态支持" style="width: 100%">
            <el-option label="支持" :value="1" />
            <el-option label="不支持" :value="0" />
          </el-select>
        </el-form-item>

        <el-form-item label="许可证">
          <el-input v-model="editForm.license" placeholder="如：Apache 2.0" />
        </el-form-item>

        <el-form-item label="状态">
          <el-select v-model="editForm.status" placeholder="选择状态" style="width: 100%">
            <el-option label="启用" :value="0" />
            <el-option label="禁用" :value="1" />
          </el-select>
        </el-form-item>

        <el-form-item label="模型Logo">
          <div class="logo-upload-container">
            <input 
              ref="logoFileInput" 
              type="file" 
              @change="handleLogoChange" 
              accept="image/*" 
              class="logo-upload-hidden" 
            />
            <div 
              class="logo-upload-area" 
              @click="triggerFileUpload"
            >
              <img 
                v-if="editForm.logoUrl" 
                :src="editForm.logoUrl" 
                alt="当前Logo" 
                class="logo-preview" 
              />
              <div v-else class="logo-placeholder">
                <el-icon size="24" color="rgba(255, 255, 255, 0.5)">
                  <Picture />
                </el-icon>
                <span>点击上传Logo</span>
              </div>
              <div v-if="addForm.logoUrl" class="logo-upload-overlay">
                <el-icon size="20" color="white">
                  <Upload />
                </el-icon>
                <span>上传</span>
              </div>
            </div>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleEditCancel">取消</el-button>
          <el-button type="primary" @click="handleEditSubmit" :loading="editLoading">
            保存
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 添加模型弹窗 -->
    <el-dialog
        v-model="addDialogVisible"
        title="添加模型"
        width="600px"
        :before-close="handleAddCancel"
        class="add-model-dialog"
    >
      <el-form :model="addForm" label-width="120px" class="add-form">
        <el-form-item label="模型类型" required>
          <el-select v-model="addForm.type" placeholder="选择模型类型" style="width: 100%">
            <el-option label="多模态模型" value="multimodal" />
            <el-option label="嵌入模型" value="embedding" />
            <el-option label="文本模型" value="rag" />
          </el-select>
        </el-form-item>

        <el-form-item label="模型名称" required>
          <el-input v-model="addForm.modelName" placeholder="输入模型名称" />
        </el-form-item>

        <el-form-item label="模型描述">
          <el-input v-model="addForm.description" type="textarea" :rows="3" placeholder="输入模型描述" />
        </el-form-item>

        <el-form-item label="模型大小">
          <el-input v-model="addForm.size" placeholder="如：4.1GB" />
        </el-form-item>

        <el-form-item label="模型版本">
          <el-input v-model="addForm.version" placeholder="如：1.0" />
        </el-form-item>

        <el-form-item label="提供商">
          <el-input v-model="addForm.provider" placeholder="如：Meta" />
        </el-form-item>

        <el-form-item label="上下文长度">
          <el-input v-model="addForm.contextLength" type="number" placeholder="如：8192" />
        </el-form-item>

        <el-form-item label="参数量">
          <el-input v-model="addForm.parameters" placeholder="如：7B" />
        </el-form-item>

        <el-form-item label="多模态支持">
          <el-select v-model="addForm.isMultimodal" placeholder="选择多模态支持" style="width: 100%">
            <el-option label="支持" :value="1" />
            <el-option label="不支持" :value="0" />
          </el-select>
        </el-form-item>

        <el-form-item label="许可证">
          <el-input v-model="addForm.license" placeholder="如：Apache 2.0" />
        </el-form-item>

        <el-form-item label="状态">
          <el-select v-model="addForm.status" placeholder="选择状态" style="width: 100%">
            <el-option label="启用" :value="0" />
            <el-option label="禁用" :value="1" />
          </el-select>
        </el-form-item>

        <el-form-item label="模型Logo">
          <div class="logo-upload-container">
            <input 
              ref="addLogoFileInput" 
              type="file" 
              @change="handleAddLogoChange" 
              accept="image/*" 
              class="logo-upload-hidden" 
            />
            <div 
              class="logo-upload-area" 
              @click="triggerAddFileUpload"
            >
              <img 
                v-if="addForm.logoUrl" 
                :src="addForm.logoUrl" 
                alt="当前Logo" 
                class="logo-preview" 
              />
              <div v-else class="logo-placeholder">
                <el-icon size="24" color="rgba(255, 255, 255, 0.5)">
                  <Picture />
                </el-icon>
                <span>点击上传Logo</span>
              </div>
              <div v-if="editForm.logoUrl" class="logo-upload-overlay">
                <el-icon size="20" color="white">
                  <Upload />
                </el-icon>
                <span>上传</span>
              </div>
            </div>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleAddCancel">取消</el-button>
          <el-button type="primary" @click="handleAddSubmit" :loading="addLoading">
            添加
          </el-button>
        </div>
      </template>
    </el-dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { ElMessage, ElIcon, ElButton, ElTag, ElForm, ElFormItem, ElSelect, ElOption, ElInput, ElMessageBox, ElDialog } from 'element-plus';
import { Warning, User, Clock, Box, Delete, Edit, Upload, Picture, Plus, Loading } from '@element-plus/icons-vue';
import type { OllamaModelManagement, PageQueryParams, ModelQueryParams, OllamaModelDTO } from '../../../api/dashboard-header.ts';
import { getModelListByPage, queryModelList, deleteModel, editModel, uploadModelLogo, addModel } from '../../../api/dashboard-header.ts';

// Props定义
interface Props {
  queryForm?: ModelQueryParams;
  pageSize?: number;
  isQueryMode?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  queryForm: () => ({
    type: undefined,
    modelName: undefined,
    isMultimodal: undefined
  }),
  pageSize: 12,
  isQueryMode: false
});

// Emits定义
const emit = defineEmits<{
  'update-loading': [loading: boolean];
}>();

// --- State Management ---
const loading = ref(true);
const error = ref('');
const models = ref<OllamaModelManagement[]>([]);
const total = ref(0);
const currentPage = ref(1);

// 使用props中的数据，不再维护本地状态
// const pageSize = ref(12); // 现在从props获取
// const isQueryMode = ref(false); // 现在从props获取
// const queryForm = ref<ModelQueryParams>({ ... }); // 现在从props获取

// 编辑模型相关状态
const editDialogVisible = ref(false);
const editForm = ref<OllamaModelDTO>({
  type: '',
  modelName: ''
});
const editLoading = ref(false);
const logoFile = ref<File | null>(null);
const logoFileInput = ref<HTMLInputElement | null>(null);

// 添加模型相关状态
const addDialogVisible = ref(false);
const addForm = ref<OllamaModelDTO>({
  type: '',
  modelName: ''
});
const addLoading = ref(false);
const addLogoFile = ref<File | null>(null);
const addLogoFileInput = ref<HTMLInputElement | null>(null);

/**
 * @description Gets the appropriate icon component name based on model type.
 * @param {string} type - The model type (e.g., 'embedding', 'multimodal', 'rag').
 * @returns {string} The name of the Vue component for the icon.
 */
const getModelIcon = (type: string): string => {
  const typeLower = type.toLowerCase();
  const iconMap: { [key: string]: string } = {
    embedding: 'Document',
    multimodal: 'Picture',
    rag: 'DataAnalysis',
  };
  return iconMap[typeLower] || 'Setting';
};

/**
 * @description Gets the icon color based on model type.
 * @param {string} type - The model type.
 * @returns {string} The hex color code.
 */
const getModelIconColor = (type: string): string => {
  const typeLower = type.toLowerCase();
  const colorMap: { [key: string]: string } = {
    embedding: 'var(--model-accent-green)',
    multimodal: 'var(--model-accent-orange)',
    rag: 'var(--model-accent-purple)',
  };
  return colorMap[typeLower] || 'var(--model-accent-yellow)';
};


/**
 * @description Formats a date string into a readable format.
 * @param {string} timeStr - The ISO date string.
 * @returns {string} Formatted date string (e.g., "2025年8月27日").
 */
const formatTime = (timeStr: string): string => {
  if (!timeStr) return 'N/A';
  return new Date(timeStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * @description 处理删除模型
 * @param {OllamaModelManagement} model - 模型对象
 */
const handleDeleteModel = async (model: OllamaModelManagement) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除模型 "${model.modelName}" 吗？此操作不可撤销。`,
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );

    const result = await deleteModel(model.id);
    if (result.success) {
      ElMessage.success('删除成功！');
      await fetchModels(); // 重新加载模型列表
    } else {
      ElMessage.error(result.message || '删除失败');
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败，请重试');
    }
  }
};

/**
 * @description 处理编辑模型
 * @param {OllamaModelManagement} model - 模型对象
 */
const handleEditModel = (model: OllamaModelManagement) => {
  editForm.value = {
    id: model.id,
    type: model.type,
    modelName: model.modelName,
    logoUrl: model.logoUrl,
    description: model.description,
    size: model.size,
    version: model.version,
    provider: model.provider,
    contextLength: model.contextLength,
    parameters: model.parameters,
    isMultimodal: model.isMultimodal,
    license: model.license,
    creator: model.creator,
    status: model.status
  };
  editDialogVisible.value = true;
};

/**
 * @description 处理添加模型
 */
const handleAddModel = () => {
  // 重置添加表单
  addForm.value = {
    type: '',
    modelName: '',
    logoUrl: '',
    description: '',
    size: '',
    version: '',
    provider: '',
    contextLength: 0,
    parameters: '',
    isMultimodal: 0,
    license: '',
    creator: '',
    status: 0
  };
  addLogoFile.value = null;
  addDialogVisible.value = true;
};

/**
 * @description 触发文件上传
 */
const triggerFileUpload = () => {
  logoFileInput.value?.click();
};

/**
 * @description 处理logo文件选择
 * @param {Event} event - 文件选择事件
 */
const handleLogoChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    logoFile.value = target.files[0];
    // 预览新选择的图片
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        editForm.value.logoUrl = e.target.result as string;
      }
    };
    reader.readAsDataURL(target.files[0]);
  }
};

/**
 * @description 提交编辑表单
 */
const handleEditSubmit = async () => {
  editLoading.value = true;
  try {
    let logoUrl = editForm.value.logoUrl;
    
    // 如果有新的logo文件，先上传
    if (logoFile.value) {
      const uploadResult = await uploadModelLogo(logoFile.value);
      if (uploadResult.success) {
        logoUrl = uploadResult.data;
      } else {
        ElMessage.error('Logo上传失败：' + uploadResult.message);
        return;
      }
    }
    
    // 更新编辑表单中的logo URL
    const modelData = {
      ...editForm.value,
      logoUrl: logoUrl
    };
    
    const result = await editModel(modelData);
    if (result.success) {
      ElMessage.success('编辑成功！');
      editDialogVisible.value = false;
      logoFile.value = null;
      await fetchModels(); // 重新加载模型列表
    } else {
      ElMessage.error(result.message || '编辑失败');
    }
  } catch (error: any) {
    ElMessage.error('编辑失败，请重试');
  } finally {
    editLoading.value = false;
  }
};

/**
 * @description 取消编辑
 */
const handleEditCancel = () => {
  editDialogVisible.value = false;
  logoFile.value = null;
  // 重置文件输入框
  if (logoFileInput.value) {
    logoFileInput.value.value = '';
  }
};

/**
 * @description 触发添加模型文件上传
 */
const triggerAddFileUpload = () => {
  addLogoFileInput.value?.click();
};

/**
 * @description 处理添加模型logo文件选择
 * @param {Event} event - 文件选择事件
 */
const handleAddLogoChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    addLogoFile.value = target.files[0];
    // 预览新选择的图片
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        addForm.value.logoUrl = e.target.result as string;
      }
    };
    reader.readAsDataURL(target.files[0]);
  }
};

/**
 * @description 提交添加模型表单
 */
const handleAddSubmit = async () => {
  addLoading.value = true;
  try {
    let logoUrl = '';
    
    // 如果有logo文件，先上传
    if (addLogoFile.value) {
      const uploadResult = await uploadModelLogo(addLogoFile.value);
      if (uploadResult.success) {
        logoUrl = uploadResult.data;
      } else {
        ElMessage.error('Logo上传失败：' + uploadResult.message);
        return;
      }
    }
    
    // 准备添加模型的数据，确保不包含id字段，只包含必要的字段
    const modelData = {
      type: addForm.value.type,
      modelName: addForm.value.modelName,
      description: addForm.value.description || '',
      size: addForm.value.size || '',
      version: addForm.value.version || '',
      provider: addForm.value.provider || '',
      contextLength: addForm.value.contextLength || 0,
      parameters: addForm.value.parameters || '',
      isMultimodal: addForm.value.isMultimodal || 0,
      license: addForm.value.license || '',
      status: addForm.value.status || 0,
      logoUrl: logoUrl
    };
    
    const result = await addModel(modelData);
    if (result.success) {
      ElMessage.success('添加成功！');
      addDialogVisible.value = false;
      addLogoFile.value = null;
      await fetchModels(); // 重新加载模型列表
    } else {
      ElMessage.error(result.message || '添加失败');
    }
  } catch (error: any) {
    ElMessage.error('添加失败，请重试');
  } finally {
    addLoading.value = false;
  }
};

/**
 * @description 取消添加模型
 */
const handleAddCancel = () => {
  addDialogVisible.value = false;
  addLogoFile.value = null;
  // 重置文件输入框
  if (addLogoFileInput.value) {
    addLogoFileInput.value.value = '';
  }
};

/**
 * @description 分页获取模型列表
 */
const fetchModelsByPage = async () => {
  loading.value = true;
  emit('update-loading', true);
  error.value = '';
  try {
    const params: PageQueryParams = {
      page: currentPage.value,
      size: props.pageSize
    };
    const result = await getModelListByPage(params);
    if (result.success) {
      models.value = result.data?.records || [];
      total.value = result.data?.total || 0;
    } else {
      error.value = result.message || '获取模型列表失败。';
    }
  } catch (err: any) {
    console.error('Error fetching model list by page:', err);
    error.value = err.message || '网络错误，请重试。';
  } finally {
    loading.value = false;
    emit('update-loading', false);
  }
};

/**
 * @description 条件查询模型列表
 */
const fetchModelsByQuery = async () => {
  loading.value = true;
  emit('update-loading', true);
  error.value = '';
  try {
    const result = await queryModelList(props.queryForm);
    if (result.success) {
      models.value = result.data || [];
      total.value = models.value.length;
      currentPage.value = 1; // 重置到第一页
    } else {
      error.value = result.message || '查询模型列表失败。';
    }
  } catch (err: any) {
    console.error('Error querying model list:', err);
    error.value = err.message || '网络错误，请重试。';
  } finally {
    loading.value = false;
    emit('update-loading', false);
  }
};

/**
 * @description 获取模型列表（根据当前模式）
 */
const fetchModels = async () => {
  if (props.isQueryMode) {
    await fetchModelsByQuery();
  } else {
    await fetchModelsByPage();
  }
};

// 监听props变化
watch(
  () => [props.isQueryMode, props.queryForm, props.pageSize],
  async () => {
    await fetchModels();
  },
  { deep: true }
);

// --- Lifecycle Hooks ---
onMounted(() => {
  fetchModelsByPage();
});
</script>

<style scoped>
/* --- Global Variables & Base --- */
:root {
  --model-accent-orange: #FF6F61;
  --model-accent-purple: #7D00FF;
  --model-accent-green: #00D4AA;
  --model-accent-yellow: #FFB800;
  --model-text-primary: rgba(255, 255, 255, 0.95);
  --model-text-secondary: rgba(255, 255, 255, 0.7);
  --model-glass-bg: rgba(255, 255, 255, 0.1);
  --model-glass-border: rgba(255, 255, 255, 0.2);
  --model-shadow-color: rgba(0, 0, 0, 0.3);
}

.model-management {
  padding: 16px;
  height: 100%;
  background: transparent;
  overflow: hidden;
}

/* --- Page Header --- */
.page-header {
  margin-bottom: 40px;
  text-align: center;
}

.page-title {
  font-size: 36px;
  font-weight: 700;
  color: var(--model-text-primary);
  margin: 0 0 8px 0;
  background: linear-gradient(135deg, var(--model-accent-orange), var(--model-accent-purple));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 4px 16px var(--model-shadow-color);
}

/* 查询条件栏样式已移除，现在在Dashboard.vue中 */

/* --- 添加模型卡片样式 --- */
.add-model-card {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px dashed rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.05);
}

.add-model-card:hover {
  border-color: var(--model-accent-orange);
  background: rgba(255, 111, 97, 0.1);
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(255, 111, 97, 0.2);
}

.add-model-content {
  text-align: center;
  padding: 20px;
}

.add-model-icon {
  margin-bottom: 16px;
}

.add-model-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--model-text-primary);
  margin: 0 0 8px 0;
}

.add-model-description {
  font-size: 14px;
  color: var(--model-text-secondary);
  margin: 0;
}

/* 查询表单样式已移除，现在在Dashboard.vue中 */

.status-text strong {
  color: var(--model-text-primary);
  font-weight: 600;
}


/* --- Base Card & Layout --- */
.glass-card {
  background: var(--model-glass-bg);
  backdrop-filter: blur(25px);
  -webkit-backdrop-filter: blur(25px);
  border: 1px solid var(--model-glass-border);
  border-radius: 20px;
  box-shadow: 0 8px 32px var(--model-shadow-color);
  transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
}

.glass-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.4);
  border-color: rgba(255, 255, 255, 0.35);
}

/* --- Loading, Error, Empty States --- */
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  padding: 40px;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;
}

.loading-content p {
  font-size: 16px;
  color: var(--model-text-secondary);
  margin: 0;
}
.error-container {
  text-align: center;
  padding: 80px 40px;
  min-height: 400px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin: 0;
  border-radius: 20px;
  background: var(--model-glass-bg);
  backdrop-filter: blur(25px);
  -webkit-backdrop-filter: blur(25px);
  border: 1px solid var(--model-glass-border);
  box-shadow: 0 8px 32px var(--model-shadow-color);
}

.empty-state {
  text-align: center;
  padding: 80px 40px;
  min-height: 400px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin: 0;
  border-radius: 20px;
  background: var(--model-glass-bg);
  backdrop-filter: blur(25px);
  -webkit-backdrop-filter: blur(25px);
  border: 1px solid var(--model-glass-border);
  box-shadow: 0 8px 32px var(--model-shadow-color);
}
.error-container h3 {
  font-size: 28px;
  font-weight: 600;
  color: var(--model-text-primary);
  margin: 24px 0 16px 0;
}

.error-container p {
  font-size: 16px;
  color: var(--model-text-secondary);
  margin: 0 0 32px 0;
  line-height: 1.6;
  max-width: 500px;
}

.error-container .el-icon {
  margin-bottom: 8px;
  opacity: 0.9;
}

.error-container .el-button {
  margin-top: 8px;
  padding: 12px 32px;
  font-size: 16px;
  font-weight: 600;
}

.empty-state h3 {
  font-size: 28px;
  font-weight: 600;
  color: var(--model-text-primary);
  margin: 24px 0 16px 0;
}

.empty-state p {
  font-size: 16px;
  color: var(--model-text-secondary);
  margin: 0;
  line-height: 1.6;
  max-width: 400px;
}

.empty-state .el-icon {
  margin-bottom: 8px;
  opacity: 0.8;
}

/* --- 编辑模型弹窗样式 --- */
.edit-model-dialog :deep(.el-dialog) {
  background: rgba(0, 0, 0, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  backdrop-filter: blur(25px);
  -webkit-backdrop-filter: blur(25px);
}

.edit-model-dialog :deep(.el-dialog__header) {
  background: linear-gradient(135deg, var(--model-accent-orange), var(--model-accent-purple));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 20px 24px;
}

.edit-model-dialog :deep(.el-dialog__title) {
  color: var(--model-text-primary);
  font-size: 20px;
  font-weight: 600;
}

.edit-model-dialog :deep(.el-dialog__body) {
  padding: 24px;
}

.edit-form :deep(.el-form-item__label) {
  color: var(--model-text-primary) !important;
  font-weight: 500;
}

.edit-form :deep(.el-input__wrapper) {
  background-color: rgba(255, 255, 255, 0.1) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  border-radius: 8px;
  backdrop-filter: blur(10px);
}

.edit-form :deep(.el-input__wrapper:hover) {
  background-color: rgba(255, 255, 255, 0.15) !important;
  border-color: rgba(255, 255, 255, 0.3) !important;
}

.edit-form :deep(.el-input__wrapper.is-focus) {
  background-color: rgba(255, 255, 255, 0.2) !important;
  border-color: var(--model-accent-orange) !important;
  box-shadow: 0 0 0 2px rgba(255, 111, 97, 0.2) !important;
}

.edit-form :deep(.el-input__inner) {
  color: var(--model-text-primary) !important;
  background-color: transparent !important;
}

.edit-form :deep(.el-textarea__inner) {
  color: var(--model-text-primary) !important;
  background-color: rgba(255, 255, 255, 0.1) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  border-radius: 8px;
}

.edit-form :deep(.el-select .el-input__wrapper) {
  background-color: rgba(255, 255, 255, 0.1) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
}

.edit-form :deep(.el-select-dropdown) {
  background-color: rgba(0, 0, 0, 0.9) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  border-radius: 12px;
  backdrop-filter: blur(25px);
}

.edit-form :deep(.el-select-dropdown__item) {
  color: var(--model-text-primary) !important;
  background-color: transparent !important;
}

.edit-form :deep(.el-select-dropdown__item:hover) {
  background-color: rgba(255, 255, 255, 0.1) !important;
  color: var(--model-accent-orange) !important;
}

/* Logo上传容器样式 */
.logo-upload-container {
  display: flex;
  justify-content: center;
}

.logo-upload-hidden {
  display: none;
}

.logo-upload-area {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 12px;
  border: 2px dashed rgba(255, 255, 255, 0.3);
  background-color: rgba(255, 255, 255, 0.05);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.logo-upload-area:hover {
  border-color: var(--model-accent-orange);
  background-color: rgba(255, 255, 255, 0.1);
  transform: scale(1.02);
}

.logo-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 10px;
}

.logo-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-align: center;
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
}

.logo-upload-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.3));
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  opacity: 0.8;
  transition: opacity 0.3s ease;
  border-radius: 10px;
  color: white;
  font-size: 12px;
  font-weight: 500;
}

.logo-upload-area:hover .logo-upload-overlay {
  opacity: 1;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.5));
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.dialog-footer .el-button {
  border-radius: 8px;
  font-weight: 500;
}

.dialog-footer .el-button--primary {
  color: #515559 !important;
  background: linear-gradient(135deg, var(--model-accent-orange), var(--model-accent-purple));
  box-shadow: 0 4px 15px rgba(255, 111, 97, 0.3);
}

.dialog-footer .el-button--default {
  background-color: rgba(255, 255, 255, 0.1) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  color: var(--model-text-primary) !important;
}

/* --- Model Grid & Card --- */
.models-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
  justify-content: start;
  max-height: calc(100% - 120px); /* 减去页面标题和间距 */
  overflow-y: auto;
}

.model-card {
  padding: 20px;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  aspect-ratio: 1;
  min-height: 350px;
}

.model-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--model-accent-orange), var(--model-accent-purple), var(--model-accent-green));
  opacity: 0;
  transform: scaleX(0);
  transition: opacity 0.4s ease, transform 0.4s ease;
  transform-origin: center;
}

.model-card:hover::before {
  opacity: 1;
  transform: scaleX(1);
}

.model-card.disabled {
  opacity: 0.5;
  filter: grayscale(50%);
  /* 已禁用的模型仍可进行删除和编辑操作 */
}

/* --- Card Content --- */
.model-status {
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  gap: 8px;
  z-index: 2;
}

.multimodal-tag {
  background: linear-gradient(135deg, var(--model-accent-orange), var(--model-accent-yellow)) !important;
  border-color: transparent !important;
}

.model-icon-wrapper {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}

.model-icon {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;
  width: 60px;
  height: 60px;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
  border-radius: 18px;
  border: 1px solid var(--model-glass-border);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
}

.model-logo {
  width: 36px;
  height: 36px;
  object-fit: contain;
  border-radius: 6px;
  transition: transform 0.3s ease;
}

.model-card:hover .model-logo {
  transform: scale(1.1);
}

.model-card:hover .model-icon {
  transform: scale(1.05) rotate(-5deg);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
}

.model-info {
  margin-bottom: 12px;
}
.model-info-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}
.model-text-content {
  flex: 1;
  text-align: left;
}
.model-name {
  font-size: 16px;
  font-weight: 700;
  color: var(--model-text-primary);
  margin: 0 0 2px 0;
  word-break: break-word;
  line-height: 1.2;
}
.model-description {
  font-size: 11px;
  color: var(--model-text-secondary);
  line-height: 1.3;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.model-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex-shrink: 0;
}
.model-type, .model-version {
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 16px;
  font-size: 11px;
  font-weight: 500;
  color: var(--model-text-secondary);
}

.model-details {
  margin-bottom: 10px;
  padding: 8px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}
.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 4px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  transition: background-color 0.2s ease;
}
.detail-row:hover {
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
}
.detail-row:last-child { border-bottom: none; }
.detail-label {
  font-size: 10px;
  color: var(--model-text-secondary);
  font-weight: 500;
}
.detail-value {
  font-size: 10px;
  color: var(--model-text-primary);
  font-weight: 600;
}

/* --- Custom Button Overrides --- */
.model-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: auto; /* Pushes buttons to the bottom */
  margin-bottom: 8px;
}
.model-actions .el-button {
  width: 100%;
  height: 30px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 12px;
  border: none;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.model-actions .el-button--primary {
  color: white;
  background: linear-gradient(135deg, var(--model-accent-orange), var(--model-accent-purple));
  box-shadow: 0 4px 15px rgba(255, 111, 97, 0.3);
}
.model-actions .el-button--primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 7px 20px rgba(255, 111, 97, 0.4);
}
.model-actions .el-button--primary:active {
  transform: translateY(0);
  box-shadow: 0 2px 10px rgba(255, 111, 97, 0.3);
}
.model-actions .el-button--info {
  color: var(--model-text-primary);
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}


/* --- Card Footer --- */
.model-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 6px;
  border-top: 1px solid var(--model-glass-border);
  font-size: 9px;
  color: var(--model-text-secondary);
}
.creator-info, .time-info {
  display: flex;
  align-items: center;
  gap: 6px;
}
</style>