<template>
  <!-- 自定义AI生成头像弹窗 -->
  <div v-if="visible" class="custom-ai-dialog-overlay" @click="handleCancel">
    <div class="custom-ai-dialog" @click.stop>
      <!-- 弹窗头部 -->
      <div class="custom-dialog-header">
        <h3 class="dialog-title">
          <el-icon class="title-icon"><MagicStick /></el-icon>
          AI生成
        </h3>
        <button class="close-btn" @click="handleCancel">
          <el-icon><Close /></el-icon>
        </button>
      </div>

      <!-- 弹窗内容 -->
      <div class="custom-dialog-body">
        <!-- 左侧内容区域 -->
        <div class="left-content">
          <!-- 标签选择区域 -->
          <div class="tags-section">
            <div class="tag-category" v-for="category in avatarTags" :key="category.categoryName">
              <h4 class="category-title">{{ category.categoryName }}</h4>
              <div class="tag-list">
                <div
                    v-for="(tag, _index) in category.tagNameList"
                    :key="tag"
                    :class="{ 'selected': selectedTags.includes(tag) }"
                    @click="toggleTag(tag)"
                    class="custom-tag-item"
                >
                  {{ tag }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧预览区域 -->
        <div class="right-preview">
          <div class="preview-header">
            <h4 class="preview-title">预览</h4>
            <!-- 收藏按钮移到右上角 -->
            <button 
                v-if="generatedAvatar"
                @click="handleAddToFavorites" 
                title="添加到我的收藏"
                class="favorite-btn-corner"
            >
              <el-icon><Star /></el-icon>
            </button>
          </div>
          <div class="preview-content" v-if="generatedAvatar">
            <div class="avatar-container">
              <img :src="generatedAvatar" alt="AI生成头像" class="generated-avatar" />
            </div>
            <div class="avatar-info">
              <span class="avatar-size">1024×1024</span>
            </div>
            <div class="avatar-actions">
              <button 
                  @click="handleUseAvatar" 
                  :disabled="isUsingAvatar"
                  class="custom-use-btn"
              >
                <el-icon v-if="isUsingAvatar" class="loading-icon"><Loading /></el-icon>
                <el-icon v-else><Check /></el-icon>
                {{ isUsingAvatar ? '设置中' : '使用此头像' }}
              </button>
              <button @click="handleRegenerateAvatar" class="custom-regenerate-btn">
                <el-icon><Refresh /></el-icon>
                重新生成
              </button>
            </div>
          </div>
          <div class="preview-placeholder" v-else>
            <el-icon class="placeholder-icon"><MagicStick /></el-icon>
            <p class="placeholder-text" v-if="!isLoadingLastAvatar">选择标签并生成头像后，预览将在此显示</p>
            <div v-if="isLoadingLastAvatar" class="loading-section">
              <el-icon class="loading-icon"><Loading /></el-icon>
              <span class="loading-text">正在加载历史头像...</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 弹窗底部按钮 -->
      <div class="custom-dialog-footer">
        <div class="bottom-actions">
          <button
              @click="handleGenerateAvatar"
              :disabled="selectedTags.length === 0 || isGenerating"
              class="custom-generate-btn-bottom"
          >
            <el-icon v-if="isGenerating" class="loading-icon"><Loading /></el-icon>
            <el-icon v-else><MagicStick /></el-icon>
            {{ isGenerating ? '创作中...' : '创作头像' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 收藏配置弹窗 -->
    <AddToFavoritesDialog
      v-model:visible="showFavoriteDialog"
      :initial-data="getFavoriteInitialData()"
      :categories="categoryTree"
      @success="handleFavoriteSuccess"
      @cancel="handleFavoriteCancel"
      @category-created="handleCategoryCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { ElMessage, ElLoading } from 'element-plus'
import { getAvatarTags, generateAvatar, updateUserAvatarByUrl, getLastGeneratedAvatar, type TagQueryVO } from '../../api/user'
import { getFavoriteCategoryTree, type FavoriteCategoryVo } from '../../api/favorites'
import { useAuthStore } from '../../stores/auth'
import {
  MagicStick,
  Close,
  Check,
  Loading,
  Refresh,
  Star,
} from '@element-plus/icons-vue'
import AddToFavoritesDialog from '../../components/AddToFavoritesDialog.vue'

// Props
interface Props {
  visible: boolean
}

const props = defineProps<Props>()

// Emits
interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'avatar-updated'): void
}

const emit = defineEmits<Emits>()

// 认证store
const authStore = useAuthStore()

// AI生成头像相关
const isGenerating = ref(false)
const isUsingAvatar = ref(false)
const isLoadingLastAvatar = ref(false)
const avatarTags = ref<TagQueryVO[]>([])

// 收藏分类相关
const categoryTree = ref<FavoriteCategoryVo[]>([])
const selectedTags = ref<string[]>([])
const generatedAvatar = ref<string>('')

// 收藏弹窗相关
const showFavoriteDialog = ref(false)

// 方法
const loadAvatarTags = async () => {
  try {
    const response = await getAvatarTags()
    if (response.success) {
      avatarTags.value = response.data
    } else {
      ElMessage.error(response.message || '获取标签失败')
    }
  } catch (error) {
    console.error('加载AI头像标签失败:', error)
    ElMessage.error('加载标签失败，请稍后重试')
  }
}

const loadCategoryTree = async () => {
  try {
    const response = await getFavoriteCategoryTree()
    if (response.success) {
      categoryTree.value = response.data || []
    } else {
      console.error('获取分类失败:', response.message)
    }
  } catch (error) {
    console.error('加载分类树失败:', error)
  }
}

const toggleTag = (tag: string) => {
  // 找到当前标签所属的类别
  let currentCategory = ''
  avatarTags.value.forEach(category => {
    if (category.tagNameList.includes(tag)) {
      currentCategory = category.categoryName
    }
  })
  
  // 移除同类别中已选中的其他标签
  if (currentCategory) {
    const categoryTags = avatarTags.value.find(cat => cat.categoryName === currentCategory)?.tagNameList || []
    selectedTags.value = selectedTags.value.filter(selectedTag => !categoryTags.includes(selectedTag))
  }
  
  // 如果当前标签未选中，则选中它
  const index = selectedTags.value.indexOf(tag)
  if (index === -1) {
    selectedTags.value.push(tag)
  }
}

const handleGenerateAvatar = async () => {
  if (selectedTags.value.length === 0) {
    ElMessage.error('请至少选择一个标签')
    return
  }

  isGenerating.value = true
  const loadingInstance = ElLoading.service({
    text: '正在创作...',
    background: 'rgba(0, 0, 0, 0.7)'
  })

  try {
    // 根据选中的标签名称找到对应的description并组合成提示词
    const descriptions: string[] = []
    selectedTags.value.forEach(selectedTag => {
      avatarTags.value.forEach(category => {
        const tagIndex = category.tagNameList.indexOf(selectedTag)
        if (tagIndex !== -1 && category.descriptionList[tagIndex]) {
          descriptions.push(category.descriptionList[tagIndex])
        }
      })
    })
    
    const prompt = descriptions.length > 0 ? descriptions.join(', ') : selectedTags.value.join(', ')
    
    const response = await generateAvatar(prompt)

    if (response.success) {
      generatedAvatar.value = response.data.trim()
      ElMessage.success('AI头像生成成功！')
    } else {
      ElMessage.error(response.message || 'AI头像生成失败')
    }
  } catch (error) {
    console.error('AI头像生成错误:', error)
    ElMessage.error('AI头像生成失败，请稍后重试')
  } finally {
    isGenerating.value = false
    loadingInstance.close()
  }
}

const handleUseAvatar = async () => {
  if (!generatedAvatar.value) {
    ElMessage.error('没有可用的头像')
    return
  }

  isUsingAvatar.value = true
  const loadingInstance = ElLoading.service({
    text: '正在设置头像...',
    background: 'rgba(0, 0, 0, 0.7)'
  })

  try {
    const response = await updateUserAvatarByUrl(generatedAvatar.value)

    if (response.success) {
      ElMessage.success('头像设置成功！')
      // 刷新用户信息
      await authStore.fetchUserProfile()
      // 通知父组件头像已更新
      emit('avatar-updated')
      // 关闭弹窗
      handleCancel()
    } else {
      ElMessage.error(response.message || '头像设置失败')
    }
  } catch (error) {
    console.error('设置头像错误:', error)
    ElMessage.error('头像设置失败，请稍后重试')
  } finally {
    isUsingAvatar.value = false
    loadingInstance.close()
  }
}

const handleRegenerateAvatar = () => {
  generatedAvatar.value = ''
  handleGenerateAvatar()
}

const handleAddToFavorites = () => {
  if (!generatedAvatar.value) {
    ElMessage.error('没有可收藏的头像')
    return
  }

  // 显示收藏配置弹窗
  showFavoriteDialog.value = true
}

// 收藏成功回调
const handleFavoriteSuccess = () => {
  showFavoriteDialog.value = false
}

// 取消收藏回调
const handleFavoriteCancel = () => {
  showFavoriteDialog.value = false
}

// 分类创建成功回调
const handleCategoryCreated = () => {
  // 重新加载分类树
  loadCategoryTree()
}

// 获取初始收藏数据
const getFavoriteInitialData = () => {
  return {
    title: '我的AI头像',
    description: '通过AI生成的个性化头像',
    fileUrl: generatedAvatar.value
  }
}

const handleCancel = () => {
  emit('update:visible', false)
  // 状态重置在watch中处理
}

// 加载上次生成的头像
const handleLoadLastAvatar = async () => {
  isLoadingLastAvatar.value = true
  
  try {
    const response = await getLastGeneratedAvatar()
    
    if (response.success && response.data) {
      generatedAvatar.value = response.data.trim()
      // 只在有历史头像时显示成功消息
      console.log('历史头像加载成功')
    } else {
      // 没有历史头像时不显示任何消息
      console.log('暂无历史头像')
    }
  } catch (error) {
    console.error('加载上次生成头像错误:', error)
    // 加载失败时也不显示错误消息，保持静默
  } finally {
    isLoadingLastAvatar.value = false
  }
}

// 组件挂载时加载标签和分类
onMounted(() => {
  loadAvatarTags()
  loadCategoryTree()
})

// 监听弹窗显示状态，当打开时自动加载历史头像
watch(
  () => props.visible,
  (newVisible) => {
    if (newVisible) {
      // 弹窗打开时自动加载历史头像
      handleLoadLastAvatar()
    } else {
      // 弹窗关闭时重置状态
      selectedTags.value = []
      generatedAvatar.value = ''
      isGenerating.value = false
      isUsingAvatar.value = false
      isLoadingLastAvatar.value = false
      showFavoriteDialog.value = false
    }
  }
)
</script>

<style scoped>
/* 自定义AI生成头像弹窗样式 */
.custom-ai-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: fadeIn 0.3s ease;
}

.custom-ai-dialog {
  background: linear-gradient(135deg, 
    rgba(255, 248, 220, 0.85) 0%,
    rgba(255, 239, 213, 0.8) 30%,
    rgba(245, 222, 179, 0.85) 70%,
    rgba(222, 184, 135, 0.9) 100%);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 20px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2),
              0 0 0 1px rgba(255, 255, 255, 0.3) inset;
  animation: slideUp 0.4s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 弹窗头部 */
.custom-dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 32px;
  background: rgba(255, 255, 255, 0.1);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.dialog-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 20px;
  font-weight: 600;
  color: rgba(101, 67, 33, 0.9);
  margin: 0;
}

.title-icon {
  font-size: 24px;
  color: rgba(160, 82, 45, 0.8);
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  color: rgba(101, 67, 33, 0.7);
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  color: rgba(101, 67, 33, 0.9);
}

/* 弹窗内容 */
.custom-dialog-body {
  padding: 32px;
  overflow: visible;
  display: flex;
  gap: 32px;
  height: 400px;
}

/* 左侧内容区域 */
.left-content {
  flex: 1;
  min-width: 0;
}

/* 右侧预览区域 */
.right-preview {
  flex: 0 0 300px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 20px;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.preview-header {
  margin-bottom: 20px;
  text-align: center;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.preview-title {
  font-size: 18px;
  font-weight: 600;
  color: rgba(101, 67, 33, 0.9);
  margin: 0;
}

.preview-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  justify-content: flex-start;
}

.preview-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: rgba(101, 67, 33, 0.6);
  text-align: center;
  padding: 40px 20px;
}

.placeholder-icon {
  font-size: 48px;
  opacity: 0.5;
}

.placeholder-text {
  font-size: 14px;
  margin: 0;
  line-height: 1.5;
}

/* 加载历史头像样式 */
.loading-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-top: 20px;
}

.loading-text {
  font-size: 14px;
  color: rgba(101, 67, 33, 0.8);
  font-weight: 500;
}

.tags-section {
  height: 100%;
  overflow-y: auto;
  padding-right: 8px;
}

/* 自定义滚动条样式 */
.tags-section::-webkit-scrollbar {
  width: 8px;
}

.tags-section::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.tags-section::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, 
    rgba(160, 82, 45, 0.6) 0%,
    rgba(205, 133, 63, 0.6) 100%);
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.tags-section::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, 
    rgba(160, 82, 45, 0.8) 0%,
    rgba(205, 133, 63, 0.8) 100%);
}

.tag-category {
  margin-bottom: 16px;
}

.category-title {
  font-size: 14px;
  font-weight: 600;
  color: rgba(101, 67, 33, 0.9);
  margin: 0 0 8px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid rgba(160, 82, 45, 0.3);
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.custom-tag-item {
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.3s ease;
  border: 2px solid rgba(139, 69, 19, 0.4);
  background: rgba(255, 255, 255, 0.3);
  color: rgba(101, 67, 33, 0.9);
  user-select: none;
}

.custom-tag-item:hover {
  background: rgba(255, 255, 255, 0.5);
  border-color: rgba(160, 82, 45, 0.7);
  box-shadow: 0 4px 12px rgba(139, 69, 19, 0.2);
}

.custom-tag-item.selected {
  background: linear-gradient(135deg, rgba(160, 82, 45, 0.8), rgba(205, 133, 63, 0.8));
  border-color: rgba(160, 82, 45, 0.9);
  color: white;
  box-shadow: 0 6px 16px rgba(160, 82, 45, 0.4);
}

.loading-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.avatar-container {
  position: relative;
  width: 140px;
  height: 140px;
  border-radius: 50%;
  overflow: hidden;
  margin: 0 auto;
}

.generated-avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  transition: all 0.3s ease;
  display: block;
}

.avatar-actions {
  display: flex;
  flex-direction: row;
  gap: 10px;
  justify-content: center;
  margin-top: 8px;
}

.avatar-info {
  text-align: center;
  margin: 6px 0 4px 0;
}

.avatar-size {
  font-size: 12px;
  color: rgba(25, 25, 112, 0.6);
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 8px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.custom-use-btn {
  background: linear-gradient(135deg, 
    rgba(70, 70, 70, 0.9) 0%,
    rgba(90, 90, 90, 0.9) 100%);
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 10px 20px;
  font-size: 13px;
  font-weight: 500;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: 120px;
  height: 44px;
}

.custom-use-btn:hover:not(:disabled) {
  box-shadow: 0 6px 16px rgba(70, 70, 70, 0.4);
  background: linear-gradient(135deg, 
    rgba(80, 80, 80, 0.9) 0%,
    rgba(100, 100, 100, 0.9) 100%);
}

.custom-use-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.custom-regenerate-btn {
  background: linear-gradient(135deg, 
    rgba(100, 100, 100, 0.9) 0%,
    rgba(120, 120, 120, 0.9) 100%);
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 10px 20px;
  font-size: 13px;
  font-weight: 500;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: 120px;
  height: 44px;
}

.custom-regenerate-btn:hover {
  box-shadow: 0 6px 16px rgba(100, 100, 100, 0.4);
  background: linear-gradient(135deg, 
    rgba(110, 110, 110, 0.9) 0%,
    rgba(130, 130, 130, 0.9) 100%);
}

/* 右上角收藏按钮样式 */
.favorite-btn-corner {
  position: absolute;
  top: 0;
  right: 0;
  background: linear-gradient(135deg, 
    rgba(255, 193, 7, 0.9) 0%,
    rgba(255, 235, 59, 0.9) 100%);
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: rgba(101, 67, 33, 0.9);
  padding: 8px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  box-shadow: 0 4px 12px rgba(255, 193, 7, 0.3);
}

.favorite-btn-corner:hover:not(:disabled) {
  box-shadow: 0 6px 16px rgba(255, 193, 7, 0.4);
  background: linear-gradient(135deg, 
    rgba(255, 183, 0, 0.9) 0%,
    rgba(255, 245, 49, 0.9) 100%);
  transform: translateY(-1px);
}

.favorite-btn-corner:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.favorite-btn-corner .el-icon {
  font-size: 18px;
}

/* 弹窗底部 */
.custom-dialog-footer {
  padding: 8px 32px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.05);
}

.bottom-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 16px;
}

.custom-generate-btn-bottom {
  background: linear-gradient(135deg, 
    rgba(100, 100, 100, 0.9) 0%,
    rgba(120, 120, 120, 0.9) 100%);
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 10px 24px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 6px 20px rgba(100, 100, 100, 0.3);
}

.custom-generate-btn-bottom:hover:not(:disabled) {
  box-shadow: 0 8px 24px rgba(100, 100, 100, 0.4);
  background: linear-gradient(135deg, 
    rgba(110, 110, 110, 0.9) 0%,
    rgba(130, 130, 130, 0.9) 100%);
}

.custom-generate-btn-bottom:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>