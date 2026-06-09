<template>
  <div class="knowledge-base-container">
    <!-- 知识库卡片网格 -->
    <div class="knowledge-grid">
      <!-- 新增知识库卡片 -->
      <div class="knowledge-card add-card" @click="handleAddKnowledge">
        <div class="add-content">
          <el-icon size="48" color="#FF6F61">
            <Plus />
          </el-icon>
          <h3>新增知识库</h3>
          <p>上传文档创建新的知识库</p>
        </div>
      </div>

      <!-- 知识库文档卡片 -->
      <div 
        v-for="doc in documents" 
        :key="doc.id" 
        class="knowledge-card doc-card"
        @mouseenter="handleCardHover(doc.id, true)"
        @mouseleave="handleCardHover(doc.id, false)"
      >
        <!-- 卡片头部 -->
        <div class="card-header">
          <div class="doc-info">
            <div class="doc-icon">
              <el-icon size="24">
                <component :is="getDocTypeIcon(doc.type)" />
              </el-icon>
            </div>
            <div class="doc-title">
              <h4>{{ doc.docName }}</h4>
              <span class="doc-type">{{ doc.type }}</span>
            </div>
          </div>
          <div class="card-actions">
          <el-dropdown @command="(command: 'edit' | 'delete') => handleAction(command, doc)" trigger="click">
            <el-button text class="more-btn">
              <el-icon><MoreFilled /></el-icon>
            </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="edit">
                    <el-icon><Edit /></el-icon>
                    编辑
                  </el-dropdown-item>
                  <el-dropdown-item command="delete" divided>
                    <el-icon><Delete /></el-icon>
                    删除
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>

        <!-- 卡片主内容 -->
        <div class="card-content">
          <div class="doc-details">
            <div class="detail-item">
              <span class="label">文档大小:</span>
              <span class="value">{{ formatFileSize(doc.size) }}</span>
            </div>
            <div class="detail-item">
              <span class="label">片段数量:</span>
              <span class="value">{{ doc.docCount }}</span>
            </div>
            <div class="detail-item">
              <span class="label">使用场景:</span>
              <span class="value">{{ doc.usageScenario }}</span>
            </div>
            <div class="detail-item">
              <span class="label">创建时间:</span>
              <span class="value">{{ formatDate(doc.createTime) }}</span>
            </div>
          </div>
        </div>

        <!-- 悬停时显示的知识库问答区域 -->
        <div 
          v-show="hoveredCard === doc.id" 
          class="knowledge-qa-overlay" 
          @click.stop="handleKnowledgeQA(doc)"
        >
          <div class="qa-content">
            <img src="/知识库问答.svg" alt="知识库问答" class="qa-icon" />
            <span class="qa-text">知识库问答</span>
          </div>
        </div>
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
    <div v-else-if="!loading && documents.length === 0" class="empty-container">
      <el-icon size="64" color="#ccc">
        <Document />
      </el-icon>
      <p>暂无知识库文档</p>
    </div>

    <!-- 新增知识库对话框 -->
    <el-dialog
      v-model="addDialogVisible"
      title="新增知识库"
      width="500px"
      :before-close="handleCloseAddDialog"
    >
      <el-form
        ref="addFormRef"
        :model="addForm"
        :rules="addFormRules"
        label-width="100px"
      >
        <el-form-item label="文档名称" prop="docName">
          <el-input v-model="addForm.docName"
                    placeholder="请输入文档名称"
                    maxlength="15"
                    show-word-limit
          />
        </el-form-item>
        <el-form-item label="使用场景" prop="usageScenario">
          <el-input 
            v-model="addForm.usageScenario" 
            type="textarea" 
            :rows="3"
            placeholder="请描述使用场景"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="选择模型" prop="modelId">
          <el-select v-model="addForm.modelId" placeholder="请选择嵌入模型" style="width: 100%">
            <el-option
              v-for="model in embeddingModels"
              :key="model.id"
              :label="model.modelName"
              :value="model.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="上传文件" prop="file">
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :show-file-list="true"
            :limit="1"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
            accept=".pdf,.doc,.docx,.txt,.md"
          >
            <el-button type="primary">
              <el-icon><Upload /></el-icon>
              选择文件
            </el-button>
            <template #tip>
              <div class="el-upload__tip">
                支持 PDF、Word、Markdown 格式，文件大小不超过 10MB
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleCloseAddDialog">取消</el-button>
          <el-button type="primary" @click="handleSubmitAdd" :loading="uploading">
            {{ uploading ? '上传中...' : '确定' }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 编辑知识库对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      title="编辑知识库"
      width="500px"
      :before-close="handleCloseEditDialog"
    >
      <el-form
        ref="editFormRef"
        :model="editForm"
        :rules="editFormRules"
        label-width="100px"
      >
        <el-form-item label="文档名称" prop="docName">
          <el-input v-model="editForm.docName" placeholder="请输入文档名称" />
        </el-form-item>
        <el-form-item label="使用场景" prop="usageScenario">
          <el-input 
            v-model="editForm.usageScenario" 
            type="textarea" 
            :rows="3"
            placeholder="请描述使用场景"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleCloseEditDialog">取消</el-button>
          <el-button type="primary" @click="handleSubmitEdit" :loading="updating">
            {{ updating ? '更新中...' : '确定' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, ElNotification, type FormInstance, type FormRules, type UploadFile } from 'element-plus'
import {
  Plus,
  MoreFilled,
  Edit,
  Delete,
  Upload,
  Document,
  DocumentAdd,
  Notebook,
  Files,
  Loading
} from '@element-plus/icons-vue'
import {
  getMyDocuments,
  updateDocument,
  uploadKnowledgeDocument,
  deleteKnowledgeDocument,
  type LLMDocManagementVO,
  type DocUpdateParams,
  type DocUploadParams
} from '../../api/dashboard-sidebar'
import { getEmbeddingModelList, type OllamaModelVO } from '../../api/dashboard-header'
import { useAuthStore } from '../../stores/auth'

// Emits定义
const emit = defineEmits<{
  'navigate-to-docqa': [docId: number];
}>()

// 路由和认证
const router = useRouter()
const authStore = useAuthStore()

// 响应式数据
const documents = ref<LLMDocManagementVO[]>([])
const embeddingModels = ref<OllamaModelVO[]>([])
const loading = ref(false)
const uploading = ref(false)
const updating = ref(false)
const hoveredCard = ref<number | null>(null)

// 对话框控制
const addDialogVisible = ref(false)
const editDialogVisible = ref(false)

// 表单引用
const addFormRef = ref<FormInstance>()
const editFormRef = ref<FormInstance>()
const uploadRef = ref()

// 新增表单
const addForm = reactive({
  docName: '',
  usageScenario: '',
  modelId: undefined as number | undefined,
  file: null as File | null
})

// 编辑表单
const editForm = reactive({
  docId: 0,
  docName: '',
  usageScenario: ''
})

// 表单验证规则
const addFormRules: FormRules = {
  docName: [
    { required: true, message: '请输入文档名称', trigger: 'blur' },
    { min: 1, max: 50, message: '文档名称长度在 1 到 50 个字符', trigger: 'blur' }
  ],
  usageScenario: [
    { required: true, message: '请输入使用场景', trigger: 'blur' },
    { min: 1, max: 200, message: '使用场景长度在 1 到 200 个字符', trigger: 'blur' }
  ],
  modelId: [
    { required: true, message: '请选择嵌入模型', trigger: 'change' }
  ],
  file: [
    { required: true, message: '请选择要上传的文件', trigger: 'change' }
  ]
}

const editFormRules: FormRules = {
  docName: [
    { required: true, message: '请输入文档名称', trigger: 'blur' },
    { min: 1, max: 50, message: '文档名称长度在 1 到 50 个字符', trigger: 'blur' }
  ],
  usageScenario: [
    { required: true, message: '请输入使用场景', trigger: 'blur' },
    { min: 1, max: 200, message: '使用场景长度在 1 到 200 个字符', trigger: 'blur' }
  ]
}

// 方法
const fetchDocuments = async () => {
  try {
    loading.value = true
    const result = await getMyDocuments()
    if (result.success) {
      documents.value = result.data || []
    } else {
      ElMessage.warning(result.message || '获取知识库列表失败')
    }
  } catch (error) {
    console.error('获取知识库列表异常:', error)
    ElMessage.error('获取知识库列表异常')
  } finally {
    loading.value = false
  }
}

const fetchEmbeddingModels = async () => {
  try {
    const result = await getEmbeddingModelList()
    if (result.success) {
      embeddingModels.value = result.data || []
    } else {
      ElMessage.error(result.message || '获取嵌入模型列表失败')
    }
  } catch (error) {
    console.error('获取嵌入模型列表异常:', error)
    ElMessage.error('获取嵌入模型列表异常')
  }
}

const handleCardHover = (docId: number, isHover: boolean) => {
  hoveredCard.value = isHover ? docId : null
}

const handleAddKnowledge = () => {
  addDialogVisible.value = true
}

const handleAction = (command: 'edit' | 'delete', doc: LLMDocManagementVO) => {
  switch (command) {
    case 'edit':
      editForm.docId = doc.id
      editForm.docName = doc.docName
      editForm.usageScenario = doc.usageScenario
      editDialogVisible.value = true
      break
    case 'delete':
      handleDeleteDocument(doc)
      break
  }
}

const handleDeleteDocument = async (doc: LLMDocManagementVO) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除知识库 "${doc.docName}" 吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const result = await deleteKnowledgeDocument(doc.id)
    if (result.success) {
      ElMessage.success('删除成功')
      await fetchDocuments()
    } else {
      ElMessage.error(result.message || '删除失败')
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('删除知识库异常:', error)
      ElMessage.error('删除知识库异常')
    }
  }
}

const handleKnowledgeQA = (doc: LLMDocManagementVO) => {
  // 触发父组件的知识库QA跳转事件，传递知识库ID
  emit('navigate-to-docqa', doc.id)
}

const handleFileChange = (file: UploadFile) => {
  if (file.raw) {
    addForm.file = file.raw
  }
}

const handleFileRemove = () => {
  addForm.file = null
}

const handleCloseAddDialog = () => {
  addDialogVisible.value = false
  resetAddForm()
}

const handleCloseEditDialog = () => {
  editDialogVisible.value = false
  resetEditForm()
}

const resetAddForm = () => {
  addForm.docName = ''
  addForm.usageScenario = ''
  addForm.modelId = undefined
  addForm.file = null
  addFormRef.value?.resetFields()
  uploadRef.value?.clearFiles()
}

const resetEditForm = () => {
  editForm.docId = 0
  editForm.docName = ''
  editForm.usageScenario = ''
  editFormRef.value?.resetFields()
}

const handleSubmitAdd = async () => {
  try {
    await addFormRef.value?.validate()
    
    if (!addForm.file) {
      ElMessage.error('请选择要上传的文件')
      return
    }

    uploading.value = true
    
    const params: DocUploadParams = {
      modelId: addForm.modelId!,
      docName: addForm.docName,
      usageScenario: addForm.usageScenario,
      file: addForm.file
    }

    const result = await uploadKnowledgeDocument(params)
    if (result.success) {
      // 显示服务器返回的消息
      const serverMessage = result.message || '上传成功'
      handleCloseAddDialog()
      await fetchDocuments()
      
      // 判断用户角色，显示不同的提示
      const isAdmin = authStore.userProfile?.mainRoleId === 0
      
      // 使用通知组件显示详细信息
      ElNotification({
        title: '上传成功',
        message: serverMessage,
        type: 'success',
        duration: 0, // 不自动关闭
        position: 'bottom-right',
        showClose: true,
        customClass: 'upload-success-notification',
        dangerouslyUseHTMLString: true,
        onClick: () => {
          // 点击通知可以跳转到控制台
          if (!isAdmin) {
            // 普通用户跳转到工作台查看审核状态
            router.push('/dashboard')
          }
        }
      })
    }
  } catch (error) {
    console.error('上传知识库异常:', error)
  } finally {
    uploading.value = false
  }
}

const handleSubmitEdit = async () => {
  try {
    await editFormRef.value?.validate()
    
    updating.value = true
    
    const params: DocUpdateParams = {
      docId: editForm.docId,
      docName: editForm.docName,
      usageScenario: editForm.usageScenario
    }

    const result = await updateDocument(params)
    if (result.success) {
      ElMessage.success('更新成功')
      handleCloseEditDialog()
      await fetchDocuments()
    } else {
      ElMessage.error(result.message || '更新失败')
    }
  } catch (error) {
    console.error('更新知识库异常:', error)
    ElMessage.error('更新知识库异常')
  } finally {
    updating.value = false
  }
}

const getDocTypeIcon = (type: string): any => {
  const iconMap: Record<string, any> = {
    'pdf': Document,
    'doc': Files,
    'docx': Files,
    'md': Notebook
  }
  return iconMap[type.toLowerCase()] || DocumentAdd
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

// 生命周期
onMounted(async () => {
  await Promise.all([
    fetchDocuments(),
    fetchEmbeddingModels()
  ])
})
</script>

<style scoped>
.knowledge-base-container {
  padding: 24px;
  height: 100%;
  overflow-y: auto;
}

.knowledge-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  padding: 10px 0;
}

.knowledge-card {
  height: 220px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.knowledge-card:hover {
  box-shadow: 0 8px 32px rgba(255, 111, 97, 0.3);
  border-color: rgba(255, 111, 97, 0.5);
}

.add-card {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px dashed rgba(255, 111, 97, 0.5);
  background: rgba(255, 111, 97, 0.05);
}

.add-card:hover {
  border-color: #FF6F61;
  background: rgba(255, 111, 97, 0.1);
}

.add-content {
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
}

.add-content h3 {
  margin: 12px 0 8px;
  font-size: 18px;
  color: #FF6F61;
}

.add-content p {
  margin: 0;
  font-size: 14px;
  opacity: 0.7;
}

.doc-card {
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.doc-info {
  display: flex;
  align-items: center;
  flex: 1;
}

.doc-icon {
  width: 32px;
  height: 32px;
  margin-right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.doc-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.doc-title h4 {
  margin: 0 0 4px;
  font-size: 20px;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 600;
  line-height: 1.2;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.doc-type {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  background: rgba(255, 111, 97, 0.2);
  padding: 2px 8px;
  border-radius: 4px;
}

.card-actions {
  flex-shrink: 0;
}

.card-actions .el-button {
  background: transparent !important;
}

.card-actions .el-button:hover {
  background: transparent !important;
}

.more-btn {
  color: rgba(218, 198, 198, 0.6);
  padding: 4px;
}

.more-btn:hover {
  color: #FF6F61;
  background: rgba(255, 111, 97, 0.1);
}

.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.doc-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  font-size: 14px;
}

.detail-item {
  display: flex;
  flex-direction: column;
}

.detail-item .label {
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 2px;
}

.detail-item .value {
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
}

.knowledge-qa-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 25%;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.knowledge-qa-overlay:hover {
  background: rgba(0, 0, 0, 0.9);
}

.qa-content {
  display: flex;
  align-items: center;
  color: white;
}

.qa-icon {
  width: 20px;
  height: 20px;
  margin-right: 8px;
}

.qa-text {
  font-size: 14px;
  font-weight: 500;
}

.dialog-footer {
  text-align: right;
}

.el-upload__tip {
  color: rgba(191, 33, 33, 0.6);
  font-size: 12px;
  margin-top: 8px;
}

/* 上传成功通知样式 */
:deep(.upload-success-notification) {
  background: rgba(0, 0, 0, 0.9) !important;
  border: 1px solid rgba(76, 175, 80, 0.5) !important;
  border-radius: 8px !important;
  backdrop-filter: blur(10px) !important;
}

:deep(.upload-success-notification .el-notification__title) {
  color: #4CAF50 !important;
  font-weight: 600 !important;
}

:deep(.upload-success-notification .el-notification__content) {
  color: rgba(255, 255, 255, 0.9) !important;
}

:deep(.upload-success-notification .el-notification__icon) {
  color: #4CAF50 !important;
}

/* 加载状态和空状态样式 */
.loading-container,
.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: rgba(255, 255, 255, 0.6);
}

.loading-container p,
.empty-container p {
  margin-top: 16px;
  font-size: 16px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .knowledge-grid {
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  }
  
  .knowledge-card {
    width: 350px;
  }
}

@media (max-width: 768px) {
  .knowledge-grid {
    grid-template-columns: 1fr;
  }
  
  .knowledge-card {
    width: 100%;
    max-width: 400px;
    margin: 0 auto;
  }
}
</style>