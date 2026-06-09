<template>
  <div class="document-management">
    <div class="document-grid">
      <!-- 新增知识库卡片 -->
      <div class="document-card add-card" @click="handleAddDocument">
        <div class="add-content">
          <el-icon size="48" color="#FF6F61">
            <Plus />
          </el-icon>
          <h3>新增知识库</h3>
          <p>点击添加新的知识库文档</p>
        </div>
      </div>

      <!-- 文档卡片列表 -->
      <div 
        v-for="doc in documentList" 
        :key="doc.id" 
        class="document-card"
        :class="{ 'deleting': deleteLoading && deletingDocId === doc.id, 'show-qa': hoveredCardId === doc.id }"
        @mouseenter="handleCardMouseEnter($event, doc.id)"
        @mouseleave="handleCardMouseLeave(doc.id)"
        @mousemove="handleCardMouseMove($event, doc.id)"
      >
        <!-- 悬停时显示的知识库问答区域 -->
        <div class="knowledge-qa-overlay" @click.stop="handleKnowledgeQA(doc)">
          <div class="qa-content">
            <img src="/知识库问答.svg" alt="知识库问答" class="qa-icon" />
            <span class="qa-text">知识库问答</span>
          </div>
        </div>
        <!-- 卡片头部 -->
        <div class="card-header">
          <div class="doc-info">
            <el-icon size="24" :color="getDocTypeColor(doc.type)">
              <component :is="getDocTypeIcon(doc.type)" />
            </el-icon>
            <span class="doc-name">{{ doc.docName }}</span>
          </div>
          <el-dropdown @command="(command: 'edit' | 'delete') => handleCommand(command, doc)" trigger="click" :disabled="deleteLoading && deletingDocId === doc.id">
            <el-icon class="more-icon" size="30" :color="deleteLoading && deletingDocId === doc.id ? '#ccc' : '#666'">
              <MoreFilled v-if="!(deleteLoading && deletingDocId === doc.id)" />
              <Loading v-else class="is-loading" />
            </el-icon>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="edit" disabled>
                  <el-icon><Edit /></el-icon>
                  编辑
                </el-dropdown-item>
                <el-dropdown-item command="delete" :disabled="deleteLoading && deletingDocId === doc.id">
                  <el-icon v-if="!(deleteLoading && deletingDocId === doc.id)"><Delete /></el-icon>
                  <el-icon v-else class="is-loading"><Loading /></el-icon>
                  {{ deleteLoading && deletingDocId === doc.id ? '删除中...' : '删除' }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>

        <!-- 详情按钮 -->
        <div class="detail-button-container">
          <el-button 
            type="text" 
            size="small" 
            class="detail-btn"
            @click.stop="showDocumentDetail(doc)"
          >
            <el-icon><InfoFilled /></el-icon>
            详情
          </el-button>
        </div>

        <!-- 卡片主内容 -->
        <div class="card-content">
          <div class="doc-detail">
            <div class="detail-item">
              <span class="label">文档类型:</span>
              <span class="value">{{ doc.type.toUpperCase() }}</span>
            </div>
            <div class="detail-item">
              <span class="label">文件大小:</span>
              <span class="value">{{ formatFileSize(doc.size) }}</span>
            </div>
            <div class="detail-item">
              <span class="label">文档片段:</span>
              <span class="value">{{ doc.docCount }} 个</span>
            </div>
            <div class="detail-item">
              <span class="label">使用场景:</span>
              <span class="value">{{ doc.usageScenario }}</span>
            </div>
            <div class="detail-item">
              <span class="label">创建时间:</span>
              <span class="value">{{ formatDate(doc.createTime) }}</span>
            </div>
            <div class="detail-item">
              <span class="label">更新时间:</span>
              <span class="value">{{ formatDate(doc.updateTime) }}</span>
            </div>
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
    <div v-else-if="!loading && documentList.length === 0" class="empty-container">
      <el-icon size="64" color="#ccc">
        <Document />
      </el-icon>
      <p>暂无知识库文档</p>
    </div>

    <!-- 文档详情弹窗 -->
    <el-dialog
      v-model="detailDialogVisible"
      :title="selectedDocument?.docName || '文档详情'"
      width="700px"
      :before-close="closeDetailDialog"
      class="document-detail-dialog"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :style="{ maxHeight: '80vh' }"
      center
    >
      <div v-if="selectedDocument" class="document-detail-content">
        <!-- 文档头部信息 -->
        <div class="detail-header">
          <div class="doc-icon-section">
            <div class="doc-icon-wrapper" :style="{ backgroundColor: getDocTypeColor(selectedDocument.type) + '20' }">
              <el-icon size="48" :color="getDocTypeColor(selectedDocument.type)">
                <component :is="getDocTypeIcon(selectedDocument.type)" />
              </el-icon>
            </div>
            <div class="doc-basic-info">
              <h2 class="doc-title">{{ selectedDocument.docName }}</h2>
              <div class="doc-type-badge" :style="{ backgroundColor: getDocTypeColor(selectedDocument.type) }">
                {{ selectedDocument.type.toUpperCase() }}
              </div>
            </div>
          </div>
        </div>

        <!-- 统计信息卡片 -->
        <div class="stats-cards">
          <div class="stat-card size-card">
            <div class="stat-icon">
              <el-icon size="24" color="#00D4AA">
                <DataLine />
              </el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ formatFileSize(selectedDocument.size) }}</div>
              <div class="stat-label">文件大小</div>
            </div>
          </div>
          
          <div class="stat-card fragments-card">
            <div class="stat-icon">
              <el-icon size="24" color="#7D00FF">
                <FolderOpened />
              </el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ selectedDocument.docCount }}</div>
              <div class="stat-label">文档片段</div>
            </div>
          </div>
          
          <div class="stat-card scenario-card">
            <div class="stat-icon">
              <el-icon size="24" color="#FFB800">
                <Connection />
              </el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ selectedDocument.usageScenario }}</div>
              <div class="stat-label">使用场景</div>
            </div>
          </div>
        </div>

        <!-- 时间轴信息 -->
        <div class="timeline-section">
          <h3 class="section-title">
            <el-icon><Clock /></el-icon>
            时间轴
          </h3>
          <div class="timeline">
            <div class="timeline-item">
              <div class="timeline-dot create"></div>
              <div class="timeline-content">
                <div class="timeline-title">文档创建</div>
                <div class="timeline-time">{{ formatDate(selectedDocument.createTime) }}</div>
              </div>
            </div>
            <div class="timeline-item">
              <div class="timeline-dot update"></div>
              <div class="timeline-content">
                <div class="timeline-title">最后更新</div>
                <div class="timeline-time">{{ formatDate(selectedDocument.updateTime) }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 文档链接信息 -->
        <div class="doc-url-section">
          <h3 class="section-title">
            <el-icon><Link /></el-icon>
            文档链接
          </h3>
          <div class="doc-url-card">
            <div class="url-content">
              <el-icon class="url-icon" size="20" color="#00D4AA"><Document /></el-icon>
              <span class="url-text">{{ selectedDocument.docUrl || '暂无链接' }}</span>
              <el-button 
                v-if="selectedDocument.docUrl" 
                type="primary" 
                size="small" 
                @click="openDocUrl(selectedDocument.docUrl)"
                class="open-btn"
              >
                下载
              </el-button>
            </div>
          </div>
        </div>

        <!-- 技术信息 -->
        <div class="tech-info-section">
          <h3 class="section-title">
            <el-icon><InfoFilled /></el-icon>
            其它
          </h3>
          <div class="tech-info-grid">
            <div class="tech-info-item">
              <span class="tech-label">创建人ID</span>
              <span class="tech-value">#{{ selectedDocument.userId }}</span>
            </div>
            <div class="tech-info-item">
              <span class="tech-label">文档ID</span>
              <span class="tech-value">#{{ selectedDocument.id }}</span>
            </div>
            <div class="tech-info-item">
              <span class="tech-label">向量化集合ID</span>
              <span class="tech-value">{{ selectedDocument.collectionId }}</span>
            </div>
            <div class="tech-info-item">
              <span class="tech-label">向量模型ID</span>
              <span class="tech-value">#{{ selectedDocument.modelId }}</span>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 上传知识库弹窗 -->
    <el-dialog
      v-model="uploadDialogVisible"
      title="上传知识库文档"
      width="600px"
      :before-close="closeUploadDialog"
      class="upload-dialog"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <div class="upload-form-container">
        <el-form :model="uploadForm" label-width="100px" class="upload-form">
          <!-- 嵌入模型选择 -->
          <el-form-item label="嵌入模型" required>
            <el-select
              v-model="uploadForm.modelId"
              placeholder="请选择嵌入模型"
              style="width: 100%"
              :loading="embeddingModels.length === 0"
            >
              <el-option
                v-for="model in embeddingModels"
                :key="model.id"
                :label="`${model.modelName} (${model.parameters})`"
                :value="model.id"
              >
                <div class="model-option">
                  <div class="model-name">{{ model.modelName }}</div>
                  <div class="model-desc">{{ model.description || '暂无描述' }}</div>
                </div>
              </el-option>
            </el-select>
          </el-form-item>

          <!-- 文档名称 -->
          <el-form-item label="文档名称" required>
            <el-input
              v-model="uploadForm.docName"
              placeholder="请输入文档名称"
              maxlength="15"
              show-word-limit
            />
          </el-form-item>

          <!-- 使用场景 -->
          <el-form-item label="使用场景" required>
            <el-input
              v-model="uploadForm.usageScenario"
              type="textarea"
              placeholder="请描述该知识库的使用场景，如：技术文档、使用手册、FAQ等"
              :rows="3"
              maxlength="100"
              show-word-limit
            />
          </el-form-item>

          <!-- 文件上传 -->
          <el-form-item label="选择文件" required>
            <el-upload
              class="upload-area"
              drag
              :before-upload="handleFileChange"
              :show-file-list="false"
              accept=".pdf,.doc,.docx,.md"
            >
              <div class="upload-content">
                <el-icon v-if="!uploadForm.file" class="upload-icon" size="48" color="#FF6F61">
                  <Plus />
                </el-icon>
                <el-icon v-else class="upload-icon" size="48" color="#00D4AA">
                  <Document />
                </el-icon>
                <div class="upload-text">
                  <p v-if="!uploadForm.file" class="upload-title">点击或拖拽文件到此处上传</p>
                  <p v-else class="upload-title">{{ uploadForm.file.name }}</p>
                  <p class="upload-hint">仅支持 PDF、DOC、DOCX、MD 格式</p>
                </div>
              </div>
            </el-upload>
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="closeUploadDialog" :disabled="uploadLoading">
            取消
          </el-button>
          <el-button 
            @click="handleUploadSubmit"
            :loading="uploadLoading"
          >
            {{ uploadLoading ? '处理中...' : '确认上传' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  MoreFilled,
  Edit,
  Delete,
  Loading,
  Document,
  DocumentCopy,
  Files,
  Notebook,
  InfoFilled,
  Clock,
  FolderOpened,
  DataLine,
  Connection,
  Link
} from '@element-plus/icons-vue'
import { 
  getDocumentList, 
  deleteDocument, 
  getEmbeddingModelList,
  uploadDocument,
  type LLMDocManagement,
  type OllamaModelVO,
  type DocumentUploadParams
} from '../../../api/dashboard-header.ts'

// Emits定义
const emit = defineEmits<{
  'navigate-to-docqa': [docId: number];
}>()

// 响应式数据
const documentList = ref<LLMDocManagement[]>([])
const loading = ref(false)
const detailDialogVisible = ref(false)
const selectedDocument = ref<LLMDocManagement | null>(null)

// 上传弹窗相关
const uploadDialogVisible = ref(false)
const uploadLoading = ref(false)
const embeddingModels = ref<OllamaModelVO[]>([])

// 删除相关
const deleteLoading = ref(false)
const deletingDocId = ref<number | null>(null)
const uploadForm = ref({
  modelId: '',
  docName: '',
  usageScenario: '',
  file: null as File | null
})

// 悬停状态管理
const hoveredCardId = ref<number | null>(null)

// 获取文档列表
const fetchDocumentList = async () => {
  loading.value = true
  try {
    const result = await getDocumentList()
    if (result.success) {
      documentList.value = result.data || []
    } else {
      // 如果后端返回"暂无知识库文档"的错误信息，说明列表为空，这是正常情况
      if (result.message && result.message.includes('暂无知识库文档')) {
        documentList.value = []
      } else {
        ElMessage.error(result.message || '获取文档列表失败')
      }
    }
  } catch (error) {
    console.error('获取文档列表异常:', error)
    ElMessage.error('获取文档列表失败')
  } finally {
    loading.value = false
  }
}

// 处理新增文档
const handleAddDocument = async () => {
  await fetchEmbeddingModels()
  uploadDialogVisible.value = true
}

// 处理下拉菜单命令
const handleCommand = async (command: 'edit' | 'delete', doc: LLMDocManagement) => {
  switch (command) {
    case 'edit':
      ElMessage.info('编辑功能开发中')
      break
    case 'delete':
      await handleDeleteDocument(doc)
      break
  }
}

// 处理删除文档
const handleDeleteDocument = async (doc: LLMDocManagement) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除知识库文档 "${doc.docName}" 吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
      }
    )

    deleteLoading.value = true
    deletingDocId.value = doc.id
    const loadingMessage = ElMessage({
      message: '正在删除文档和向量数据，请稍候...',
      type: 'info',
      duration: 0
    })

    try {
      const result = await deleteDocument(doc.userId, doc.id)
      loadingMessage.close()
      
      // 只有在接收到删除请求响应后才显示删除结果提示信息
      if (result.success) {
        ElMessage.success(result.message)
        // 删除成功后自动刷新当前页面
        await fetchDocumentList()
      } else {
        ElMessage.error(result.message)
      }
    } catch (deleteError: any) {
      loadingMessage.close()
      console.error('删除文档异常:', deleteError)
      // 只有在接收到删除请求响应后才显示删除失败提示信息
      ElMessage.error('删除失败')
    } finally {
      // 无论删除成功还是失败，都要重置删除状态
      deleteLoading.value = false
      deletingDocId.value = null
    }
  } catch (error: any) {
    // 用户取消删除操作，不需要重置状态（内层finally会处理）
    if (error !== 'cancel') {
      console.error('删除文档异常:', error)
    }
  }
}

// 获取文档类型图标
const getDocTypeIcon = (type: string) => {
  const iconMap: Record<string, any> = {
    'md': Notebook,
    'docx': DocumentCopy,
    'pdf': Document,
    'txt': Files
  }
  return iconMap[type.toLowerCase()] || Document
}

// 获取文档类型颜色
const getDocTypeColor = (type: string) => {
  const colorMap: Record<string, string> = {
    'md': '#7D00FF',
    'docx': '#00D4AA',
    'pdf': '#FF6F61',
    'txt': '#FFB800'
  }
  return colorMap[type.toLowerCase()] || '#666'
}

// 格式化文件大小
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 格式化日期
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 显示文档详情
const showDocumentDetail = (doc: LLMDocManagement) => {
  selectedDocument.value = doc
  detailDialogVisible.value = true
}

// 关闭详情弹窗
const closeDetailDialog = () => {
  detailDialogVisible.value = false
  selectedDocument.value = null
}

// 获取嵌入模型列表
const fetchEmbeddingModels = async () => {
  try {
    const result = await getEmbeddingModelList()
    if (result.success) {
      embeddingModels.value = result.data || []
    } else {
      ElMessage.error(result.message || '获取模型列表失败')
    }
  } catch (error) {
    console.error('获取模型列表异常:', error)
    ElMessage.error('获取模型列表失败')
  }
}

// 处理文件选择
const handleFileChange = (file: File) => {
  uploadForm.value.file = file
  // 如果文档名称为空，使用文件名（去掉扩展名）
  if (!uploadForm.value.docName) {
    const fileName = file.name
    const lastDotIndex = fileName.lastIndexOf('.')
    uploadForm.value.docName = lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName
  }
  return false // 阻止自动上传
}

// 提交上传表单
const handleUploadSubmit = async () => {
  // 表单验证
  if (!uploadForm.value.modelId) {
    ElMessage.warning('请选择嵌入模型')
    return
  }
  if (!uploadForm.value.docName.trim()) {
    ElMessage.warning('请输入文档名称')
    return
  }
  if (!uploadForm.value.usageScenario.trim()) {
    ElMessage.warning('请输入使用场景')
    return
  }
  if (!uploadForm.value.file) {
    ElMessage.warning('请选择要上传的文件')
    return
  }

  uploadLoading.value = true
  const loadingMessage = ElMessage({
    message: '正在上传文档...',
    type: 'info',
    duration: 0
  })

  try {
    const params: DocumentUploadParams = {
      modelId: Number(uploadForm.value.modelId),
      docName: uploadForm.value.docName.trim(),
      usageScenario: uploadForm.value.usageScenario.trim(),
      file: uploadForm.value.file
    }

    const result = await uploadDocument(params)
    loadingMessage.close()
    
    if (result.success) {
      ElMessage.success(result.message || '文档上传成功！')
      uploadDialogVisible.value = false
      resetUploadForm()
      // 重新获取文档列表
      await fetchDocumentList()
    } else {
      ElMessage.error(result.message || '文档上传失败')
    }
  } catch (error: any) {
    loadingMessage.close()
    console.error('上传文档异常:', error)
    ElMessage.error('文档上传失败')
  } finally {
    uploadLoading.value = false
  }
}

// 重置上传表单
const resetUploadForm = () => {
  uploadForm.value = {
    modelId: '',
    docName: '',
    usageScenario: '',
    file: null
  }
}

// 关闭上传弹窗
const closeUploadDialog = () => {
  uploadDialogVisible.value = false
  resetUploadForm()
}

// 打开文档链接
const openDocUrl = (url: string) => {
  if (url) {
    window.open(url, '_blank')
  }
}

// 处理知识库问答
const handleKnowledgeQA = (doc: LLMDocManagement) => {
  // 触发父组件的知识库QA跳转事件，传递知识库ID
  emit('navigate-to-docqa', doc.id)
}

// 处理卡片鼠标进入事件
const handleCardMouseEnter = (event: MouseEvent, cardId: number) => {
  const target = event.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const mouseY = event.clientY - rect.top
  const cardHeight = rect.height
  
  // 只有当鼠标在底部3/4区域时才显示悬停效果
  if (mouseY > cardHeight * 0.25) {
    hoveredCardId.value = cardId
  }
}

// 处理卡片鼠标移动事件
const handleCardMouseMove = (event: MouseEvent, cardId: number) => {
  const target = event.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const mouseY = event.clientY - rect.top
  const cardHeight = rect.height
  
  // 根据鼠标位置决定是否显示悬停效果
  if (mouseY > cardHeight * 0.25) {
    hoveredCardId.value = cardId
  } else {
    hoveredCardId.value = null
  }
}

// 处理卡片鼠标离开事件
const handleCardMouseLeave = (_cardId: number) => {
  hoveredCardId.value = null
}

// 生命周期
onMounted(() => {
  fetchDocumentList()
})
</script>

<style scoped>
.document-management {
  padding: 24px;
  background: transparent;
}

.document-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  padding: 0;
}

.document-card {
  height: 235px;  /*调整文档卡片的高度*/
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.document-card:hover {
  border-color: rgba(255, 111, 97, 0.5);
}

/* 当卡片处于show-qa状态时显示知识库问答悬停效果 */
.document-card.show-qa .knowledge-qa-overlay {
  opacity: 1;
  visibility: visible;
}

/* 知识库问答悬停区域样式 */
.knowledge-qa-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 25%; /* 底部1/4区域 */
  background: linear-gradient(to top, rgba(0, 0, 0, 0.95), rgba(0, 0, 0, 0.7));
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
  border-radius: 0 0 12px 12px;
  cursor: pointer;
  z-index: 10;
}

.knowledge-qa-overlay:hover {
  background: linear-gradient(to top, rgba(44, 77, 98, 0.95), rgba(64, 92, 112, 0.7));
}

.qa-content {
  display: flex;
  align-items: center;
  gap: 8px;
  color: white;
  font-weight: 600;
  font-size: 16px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.qa-text {
  user-select: none;
}

.document-card.deleting {
  opacity: 0.6;
  pointer-events: none;
  position: relative;
}

.document-card.deleting::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  z-index: 1;
}

.add-card {
  border: 2px dashed rgba(255, 111, 97, 0.5);
  background: rgba(255, 111, 97, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
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
  margin: 12px 0 8px 0;
  color: #FF6F61;
  font-size: 18px;
  font-weight: 600;
}

.add-content p {
  margin: 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.doc-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.doc-name {
  font-size: 16px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.more-icon {
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.more-icon:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.card-content {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.detail-button-container {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 8px;
}

.detail-btn {
  color: rgba(255, 255, 255, 0.7) !important;
  font-size: 15px;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.detail-btn:hover {
  color: #FF6F61 !important;
  background-color: rgba(255, 111, 97, 0.1);
}

.doc-detail {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  height: 100%;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.label {
  font-size: 14px; /*调整文档卡片中的字体大小*/
  color: rgba(255, 255, 255, 0.6);
  font-weight: 500;
}

.value {
  font-size: 15px; /*同步调整文档卡片中的字体大小*/
  color: rgba(255, 255, 255, 0.8);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

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

/* 详情弹窗样式 */
.document-detail-dialog {
  --el-dialog-bg-color: #f5f5f5;
  --el-dialog-border-radius: 16px;
}

.document-detail-dialog .el-dialog {
  margin: 0 auto;
  display: flex;
  flex-direction: column;
}

.document-detail-dialog .el-dialog__wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1vh 0;
  min-height: 100vh;
}

.document-detail-dialog .el-dialog__header {
  background: linear-gradient(135deg, #FF6F61, #7D00FF);
  color: white;
  border-radius: 16px 16px 0 0;
  padding: 20px 24px;
}

.document-detail-dialog .el-dialog__title {
  color: white;
  font-weight: 600;
  font-size: 18px;
}

.document-detail-dialog .el-dialog__body {
  padding: 0;
  background: #f5f5f5;
  border-radius: 0 0 16px 16px;
  overflow: visible;
}

.document-detail-content {
  padding: 20px;
  color: #333333;
  max-height: 60vh;
  overflow-y: auto;
}

/* 文档头部 */
.detail-header {
  margin-bottom: 16px;
}

.doc-icon-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.doc-icon-wrapper {
  width: 80px;
  height: 80px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
}

.doc-basic-info {
  flex: 1;
}

.doc-title {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 700;
  color: #333333;
}

.doc-type-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  color: white;
  text-transform: uppercase;
}

/* 统计卡片 */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 0.9);
  border-color: rgba(0, 0, 0, 0.2);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: #333333;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.6);
}

/* 时间轴 */
.timeline-section {
  margin-bottom: 20px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #333333;
  margin-bottom: 12px;
}

.timeline {
  position: relative;
  padding-left: 32px;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 12px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(to bottom, #FF6F61, #7D00FF);
}

.timeline-item {
  position: relative;
  margin-bottom: 24px;
}

.timeline-item:last-child {
  margin-bottom: 0;
}

.timeline-dot {
  position: absolute;
  left: -26px;
  top: 4px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid #f5f5f5;
}

.timeline-dot.create {
  background: #00D4AA;
}

.timeline-dot.update {
  background: #FFB800;
}

.timeline-content {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  padding: 16px;
}

.timeline-title {
  font-size: 16px;
  font-weight: 600;
  color: #333333;
  margin-bottom: 4px;
}

.timeline-time {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.6);
}

/* 文档链接部分 */
.doc-url-section {
  margin-bottom: 20px;
}

.doc-url-card {
  background: rgba(0, 212, 170, 0.05);
  border: 1px solid rgba(0, 212, 170, 0.2);
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s ease;
}

.doc-url-card:hover {
  background: rgba(0, 212, 170, 0.08);
  border-color: rgba(0, 212, 170, 0.3);
}

.url-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.url-icon {
  flex-shrink: 0;
}

.url-text {
  flex: 1;
  color: rgba(0, 0, 0, 0.8);
  font-size: 14px;
  word-break: break-all;
  line-height: 1.4;
  min-width: 0;
}

.open-btn {
  flex-shrink: 0;
  background: linear-gradient(135deg, #00D4AA, #00B894);
  border: none;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.open-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 212, 170, 0.3);
}

/* 技术信息 */
.tech-info-section {
  margin-bottom: 8px;
}

.tech-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.tech-info-item {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tech-label {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.6);
  font-weight: 500;
}

.tech-value {
  font-size: 13px;
  color: #333333;
  font-weight: 600;
  font-family: 'Courier New', monospace;
}

/* 上传弹窗样式 */
.upload-dialog {
  --el-dialog-bg-color: rgba(30, 30, 30, 0.95);
  --el-dialog-border-radius: 16px;
}

.upload-dialog .el-dialog {
  background: rgba(30, 30, 30, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
}

.upload-dialog .el-dialog__header {
  background: linear-gradient(135deg, rgba(255, 111, 97, 0.1), rgba(125, 0, 255, 0.1));
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 20px 24px;
  border-radius: 16px 16px 0 0;
}

.upload-dialog .el-dialog__title {
  color: rgba(255, 255, 255, 0.9);
  font-size: 18px;
  font-weight: 600;
}

.upload-dialog .el-dialog__body {
  padding: 24px;
  color: rgba(255, 255, 255, 0.8);
}

.upload-form-container {
  max-height: 60vh;
  overflow-y: auto;
}

.upload-form .el-form-item__label {
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
}

.upload-form .el-input__wrapper {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  box-shadow: none;
}

.upload-form .el-input__wrapper:hover {
  border-color: rgba(255, 111, 97, 0.5);
}

.upload-form .el-input__wrapper.is-focus {
  border-color: #FF6F61;
  box-shadow: 0 0 0 2px rgba(255, 111, 97, 0.2);
}

.upload-form .el-input__inner {
  color: rgba(255, 255, 255, 0.9);
}

.upload-form .el-input__inner::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.upload-form .el-textarea__inner {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.9);
  resize: none;
}

.upload-form .el-textarea__inner:hover {
  border-color: rgba(255, 111, 97, 0.5);
}

.upload-form .el-textarea__inner:focus {
  border-color: #FF6F61;
  box-shadow: 0 0 0 2px rgba(255, 111, 97, 0.2);
}

.upload-form .el-textarea__inner::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

/* 下拉选择器样式 */
.upload-form .el-select .el-input__wrapper {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.model-option {
  padding: 4px 0;
}

.model-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.model-desc {
  font-size: 12px;
  color: #666;
  margin-top: 2px;
}

/* 文件上传区域样式 */
.upload-area {
  width: 100%;
}

.upload-area .el-upload {
  width: 100%;
}

.upload-area .el-upload-dragger {
  width: 60%;
  height: 80px;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.03);
  border: 2px dashed rgba(255, 111, 97, 0.3);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.upload-area .el-upload-dragger:hover {
  border-color: #FF6F61;
  background: rgba(255, 111, 97, 0.05);
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 8px;
}

.upload-icon {
  margin-bottom: 4px;
}

.upload-text {
  text-align: center;
}

.upload-title {
  margin: 0 0 2px 0;
  font-size: 18px;
  font-weight: 500;
  color: rgba(77, 72, 72, 0.8);
}

.upload-hint {
  margin: 0;
  font-size: 13px;
  color: rgba(255, 0, 0, 0.5);
}

/* 弹窗底部按钮样式 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  background: rgba(255, 255, 255, 0.02);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0 0 16px 16px;
  margin: 0 -24px -24px -24px;
}

.dialog-footer .el-button {
  border-radius: 8px;
  font-weight: 500;
  padding: 10px 20px;
}

.dialog-footer .el-button--default {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
}

.dialog-footer .el-button--default:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
}

.dialog-footer .el-button--primary {
  background: linear-gradient(135deg, #FF6F61, #FF8A80);
  border: none;
  color: white;
}

.dialog-footer .el-button--primary:hover {
  background: linear-gradient(135deg, #FF8A80, #FF6F61);
}

/* 字数统计样式 */
.upload-form .el-input__count {
  color: rgba(255, 255, 255, 0.5);
  background: transparent;
}

.upload-form .el-textarea__count {
  color: rgba(255, 255, 255, 0.5);
  background: transparent;
}

/* 知识库问答图标样式 */
.qa-icon {
  width: 28px;
  height: 28px;
  object-fit: contain;
}

/* 自定义弹窗按钮样式 */
:deep(.el-message-box) {
  background: rgba(30, 30, 30, 0.95) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 16px !important;
  backdrop-filter: blur(20px) !important;
}

:deep(.el-message-box__header) {
  background: transparent !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
  padding: 20px 24px 16px !important;
}

:deep(.el-message-box__title) {
  color: rgba(255, 255, 255, 0.9) !important;
  font-weight: 600 !important;
  font-size: 18px !important;
}

:deep(.el-message-box__content) {
  padding: 16px 24px !important;
  color: rgba(255, 255, 255, 0.8) !important;
}

:deep(.el-message-box__btns) {
  padding: 16px 24px 20px !important;
  background: transparent !important;
  border-top: 1px solid rgba(255, 255, 255, 0.1) !important;
}

:deep(.el-message-box__btns .el-button) {
  border-radius: 8px !important;
  font-weight: 500 !important;
  padding: 10px 20px !important;
  border: none !important;
  transition: all 0.3s ease !important;
}

:deep(.el-message-box__btns .el-button--default) {
  background: rgba(255, 255, 255, 0.08) !important;
  color: rgba(255, 255, 255, 0.8) !important;
  border: 1px solid rgba(255, 255, 255, 0.15) !important;
}

:deep(.el-message-box__btns .el-button--default:hover) {
  background: rgba(255, 255, 255, 0.12) !important;
  border-color: rgba(255, 255, 255, 0.25) !important;
  transform: translateY(-1px) !important;
}

:deep(.el-message-box__btns .el-button--primary) {
  background: rgba(255, 255, 255, 0.08) !important;
  color: rgba(255, 255, 255, 0.8) !important;
  border: 1px solid rgba(255, 255, 255, 0.15) !important;
}

:deep(.el-message-box__btns .el-button--primary:hover) {
  background: rgba(255, 255, 255, 0.12) !important;
  border-color: rgba(255, 255, 255, 0.25) !important;
  transform: translateY(-1px) !important;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .document-grid {
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  }
  
  .document-card {
    width: 350px;
  }
}

@media (max-width: 768px) {
  .document-grid {
    grid-template-columns: 1fr;
  }
  
  .document-card {
    width: 100%;
    max-width: 390px;
    margin: 0 auto;
  }
  
  .document-management {
    padding: 16px;
  }
  
  .document-detail-dialog {
    width: 95% !important;
  }
  
  .stats-cards {
    grid-template-columns: 1fr;
  }
  
  .tech-info-grid {
    grid-template-columns: 1fr;
  }
  
  .doc-icon-section {
    flex-direction: column;
    text-align: center;
  }
}
</style>