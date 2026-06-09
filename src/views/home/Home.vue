<template>
  <BackgroundContainer>
    <div class="home-container">
    <!-- 导航栏 -->
    <Navbar />

    <!-- 首屏视觉区 -->
    <section id="hero-section" class="hero-section">
      <div class="hero-content">
        <div class="hero-visual">
          <h2 class="section-title">项目概述</h2>
          <div class="visual-grid">
            <!-- 左侧：项目架构 -->
            <div class="visual-card glass-card">
              <!-- 详情链接 -->
              <a href="#" class="detail-link-corner" @click.prevent="viewArchitectureDetail">
                详情
                <el-icon class="detail-icon"><ArrowRight /></el-icon>
              </a>
              <h3>AI Agent架构</h3>
              <div class="render-container">
                <PlaceholderImage :width="400" :height="280" label="技术架构图" />
                <p class="architecture-note">技术架构图将从后端动态加载</p>
              </div>
            </div>
            
            <!-- 右侧：检测演示 -->
            <div class="visual-card glass-card">
              <!-- 详情链接 -->
              <a href="#" class="detail-link-corner" @click.prevent="viewDemoDetail">
                详情
                <el-icon class="detail-icon"><ArrowRight /></el-icon>
              </a>
              <h3>核心特性</h3>
              <el-tabs v-model="activeTab" class="demo-tabs">
                <el-tab-pane label="过程" name="original">
                  <div class="video-container">
                    <video 
                      class="demo-video" 
                      controls 
                      poster="/logo.gif"
                      preload="metadata"
                    >
                      <source src="#" type="video/mp4">
                      <div class="video-fallback">
                        <el-icon size="48"><VideoPlay /></el-icon>
                        <p>视频加载中...</p>
                        <p class="video-note">静态演示，后期将从后端加载</p>
                      </div>
                    </video>
                  </div>
                </el-tab-pane>
                <el-tab-pane label="结果" name="detection">
                  <div class="detection-container">
                    <div class="detection-image-wrapper">
                      <div class="detection-placeholder">
                        <div class="detection-icon-group">
                          <div class="main-icon">
                            <el-icon size="32"><Camera /></el-icon>
                          </div>
                          <div class="sub-icons">
                            <el-icon size="16"><DataAnalysis /></el-icon>
                            <el-icon size="16"><View /></el-icon>
                            <el-icon size="16"><Monitor /></el-icon>
                          </div>
                        </div>
                        <div class="detection-placeholder-text">
                          <div class="size-info">350 × 200</div>
                          <div class="label-info">AI检测结果图</div>
                          <div class="loading-hint">
                            <span class="loading-dots">正在加载检测结果</span>
                            <div class="dots-animation">
                              <span></span><span></span><span></span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="detection-info">
                      <h4>描述</h4>
                      <div class="detection-description">
                        <p>• AI检测结果图像展示</p>
                        <p>• 目标框标注和置信度信息</p>
                        <p>• 多种目标类型识别</p>
                        <p>• 精确位置定位分析</p>
                      </div>
                      <p class="detection-note">检测数据将从后端动态获取</p>
                    </div>
                  </div>
                </el-tab-pane>
              </el-tabs>
            </div>
          </div>
        </div>
        
        <!-- 项目创建周期 -->
        <div class="project-timeline-section">
          <h2 class="timeline-title">周期</h2>
          <div class="stats-panel">
            <div class="stat-item">
              <div class="stat-header">
                <h3 class="stat-title lab-highlight">重点实验室</h3>
                <div class="calendar-period">
                  <div class="calendar-icon">
                    <el-icon><Calendar /></el-icon>
                  </div>
                  <div class="date-range">
                    <div class="start-date">
                      <span class="month">2023</span>
                      <span class="day">03</span>
                    </div>
                    <div class="date-separator">~</div>
                    <div class="end-date">
                      <span class="month">2023</span>
                      <span class="day">12</span>
                    </div>
                  </div>
                </div>
              </div>
              <p class="stat-description">接触yolo算法</p>
            </div>
            <div class="stat-item">
              <div class="stat-header">
                <h3 class="stat-title">学习yolo算法、模型训练</h3>
                <div class="calendar-period">
                  <div class="calendar-icon">
                    <el-icon><Calendar /></el-icon>
                  </div>
                  <div class="date-range">
                    <div class="start-date">
                      <span class="month">2023</span>
                      <span class="day">12</span>
                    </div>
                    <div class="date-separator">~</div>
                    <div class="end-date">
                      <span class="month">2024</span>
                      <span class="day">07</span>
                    </div>
                  </div>
                </div>
              </div>
              <p class="stat-description">基于yolov7的茶叶杂物分拣</p>
            </div>
            <div class="stat-item">
              <div class="stat-header">
                <h3 class="stat-title">本地服务搭建、实操</h3>
                <div class="calendar-period">
                  <div class="calendar-icon">
                    <el-icon><Calendar /></el-icon>
                  </div>
                  <div class="date-range">
                    <div class="start-date">
                      <span class="month">2024</span>
                      <span class="day">07</span>
                    </div>
                    <div class="date-separator">~</div>
                    <div class="end-date">
                      <span class="month">2025</span>
                      <span class="day">01</span>
                    </div>
                  </div>
                </div>
              </div>
              <p class="stat-description">基于yolov7的残次咖啡豆分拣</p>
            </div>
            <div class="stat-item">
              <div class="stat-header">
                <h3 class="stat-title">LLM</h3>
                <div class="calendar-period">
                  <div class="calendar-icon">
                    <el-icon><Calendar /></el-icon>
                  </div>
                  <div class="date-range">
                    <div class="start-date">
                      <span class="month">2025</span>
                      <span class="day">01</span>
                    </div>
                    <div class="date-separator">~</div>
                    <div class="end-date current">
                      <span class="month">至今</span>
                      <span class="day"></span>
                    </div>
                  </div>
                </div>
              </div>
              <p class="stat-description">引入Agent</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 核心优势模块 -->
    <section id="advantages-section" class="advantages-section scroll-animate">
      <div class="section-content">
        <h2 class="section-title">开发文档</h2>
        <div class="advantages-grid">
          <div 
            class="advantage-card glass-card" 
            v-for="(advantage, index) in advantages" 
            :key="advantage.id"
            @click="toggleCardGroup(index)"
            :class="{ 'active': activeCardGroup === index }"
          >
            <!-- 前往学习链接 -->
            <a 
              href="#" 
              class="learn-link" 
              @click.stop.prevent="openLearnLink(advantage.learnUrl)"
            >
              Study
              <el-icon class="learn-icon"><ArrowRight /></el-icon>
            </a>
            
            <div class="advantage-icon">
              <img :src="advantage.icon" :alt="advantage.title" class="tech-icon" />
            </div>
            <h3>{{ advantage.title }}</h3>
            <p class="advantage-description">{{ advantage.description }}</p>
            
            <!-- 子卡片容器 -->
            <div class="sub-cards-container">
              <div class="sub-card-wrapper">
                <transition name="slide" mode="out-in">
                  <div 
                    :key="currentSubCardIndex[index]"
                    class="sub-card"
                  >
                    <h4 class="sub-card-title">{{ advantage.details[currentSubCardIndex[index]].title }}</h4>
                    <p class="sub-card-description">{{ advantage.details[currentSubCardIndex[index]].description }}</p>
                  </div>
                </transition>
              </div>
              
              <!-- 手动控制按钮 -->
              <div class="card-controls" v-show="isManualMode[index]">
                <button 
                  class="control-btn prev-btn" 
                  @click.stop="prevSubCard(index)"
                  :disabled="currentSubCardIndex[index] === 0"
                >
                  <el-icon><ArrowLeft /></el-icon>
                </button>
                <div class="card-indicators">
                   <span 
                     v-for="(_, detailIndex) in advantage.details"
                     :key="detailIndex"
                     class="indicator"
                     :class="{ 'active': currentSubCardIndex[index] === detailIndex }"
                     @click.stop="goToSubCard(index, detailIndex)"
                   ></span>
                 </div>
                <button 
                  class="control-btn next-btn" 
                  @click.stop="nextSubCard(index)"
                  :disabled="currentSubCardIndex[index] === advantage.details.length - 1"
                >
                  <el-icon><ArrowRight /></el-icon>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 行业应用案例 -->
    <section id="cases-section" class="cases-section scroll-animate">
      <div class="section-content">
        <h2 class="section-title">工具集成</h2>
        <el-carousel indicator-position="outside" height="400px" class="cases-carousel" :interval="2500">
          <el-carousel-item v-for="(caseItem, index) in cases" :key="index">
            <div class="case-item">
              <div class="case-image">
                <PlaceholderImage :width="400" :height="300" :label="caseItem.title" />
              </div>
              <div class="case-content">
                <h3>{{ caseItem.title }}</h3>
                <p>{{ caseItem.description }}</p>
                <div class="case-tags">
                  <el-tag v-for="tag in caseItem.tags" :key="tag" type="info" size="small" class="case-tag">
                    {{ tag }}
                  </el-tag>
                </div>
                <div class="case-actions">
                  <a href="#" class="detail-link" @click.prevent="viewCaseDetail(caseItem.id)">
                    查看详情
                    <el-icon class="link-icon"><ArrowRight /></el-icon>
                  </a>
                </div>
              </div>
            </div>
          </el-carousel-item>
        </el-carousel>
      </div>
    </section>

    <!-- Agent -->
    <section id="ecosystem-section" class="ecosystem-section scroll-animate">
      <div class="section-content">
        <h2 class="section-title">Agent功能</h2>
        <div class="ecosystem-grid">
          <div class="ecosystem-chart">
            <div id="ec-circle" ref="echartsContainer"></div>
            <!-- AI描述文字移到图表下方 -->
            <div class="ai-description-bottom">
              <div class="ai-description-box">
                <p class="ai-description-text">
                  自<span class="highlight-keyword">2022年</span>起，我们开始接触全球首个<span class="highlight-keyword">大语言模型</span>——<span class="highlight-keyword">ChatGPT</span>！它的诞生不仅是<span class="highlight-keyword">人工智能</span>发展的重要里程碑，更是人类科技史上的重大突破！
                  这一<span class="highlight-keyword">划时代的技术</span>为每一位开发者带来了前所未有的机遇与挑战。
                  它是否能够引领新一轮的<span class="highlight-keyword">智能工业革命</span>？未来值得期待！而我们能做的，就是紧跟时代步伐，把握<span class="highlight-keyword">AI浪潮</span>，不断提升自身在<span class="highlight-keyword">人工智能领域</span>的<span class="highlight-keyword">开发能力</span>与<span class="highlight-keyword">创新能力</span>。
                </p>
              </div>
            </div>
          </div>
          <div class="ai-tech-links">
            <h3><img src="/src/assets/svg/探索.svg" alt="探索" class="explore-icon" />继续探索<img src="/src/assets/svg/手指.svg" alt="向下" class="finger-icon" /></h3>
            <div class="tech-links-container">
              <div 
                v-for="tech in aiTechData" 
                :key="tech.name" 
                class="tech-link-card glass-card"
                @click="openTechLink(tech.url)"
              >
                <div class="tech-icon-wrapper">
                  <img :src="tech.icon" :alt="tech.name" class="tech-svg-icon" />
                  <div class="tech-glow" :style="{ backgroundColor: tech.color }"></div>
                </div>
                <div class="tech-info">
                  <h4 class="tech-name" :style="{ color: tech.color }">{{ tech.name }}</h4>
                  <p class="tech-desc">{{ tech.description }}</p>
                  <div class="tech-stats">
                    <span class="tech-advantage" :style="{ color: tech.color }">
                      <template v-if="tech.name === 'Spring AI'">生态扩展性</template>
                      <template v-else-if="tech.name === 'Langchain4j'">多模型支持和数据集成</template>
                      <template v-else-if="tech.name === 'MCP'">工具调用</template>
                    </span>
                  </div>
                </div>
                <div class="link-arrow">
                  <el-icon><ArrowRight /></el-icon>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 团队 -->
    <section id="community-section" class="community-section scroll-animate">
      <div class="section-content">
        <h2 class="section-title">项目信息</h2>
        <div class="team-layout">
          <!-- 作者信息卡片 -->
          <div class="author-card glass-card">
            <div class="card-header">
              <h3 class="card-title">作者</h3>
            </div>
            
            <div class="author-content">
              <!-- 加载状态 -->
              <div v-if="isLoadingAuthor" class="loading-state">
                <el-icon class="loading-icon"><Loading /></el-icon>
                <span class="loading-text">正在加载作者信息...</span>
              </div>
              
              <!-- 作者信息展示 -->
              <div v-else-if="authorInfo" class="author-display">
                <div class="author-header">
                    <img :src="authorInfo.avatarUrl" :alt="authorInfo.name" class="author-avatar" />
                  <div class="author-basic">
                    <h4 class="author-name">{{ authorInfo.name }}</h4>
                    <p class="author-bio">{{ authorInfo.description }}</p>
                  </div>
                </div>
                
                <div class="author-metrics">
                  <div class="metrics-row">
                    <div class="metric-item">
                      <el-icon class="metric-icon"><User /></el-icon>
                      <div class="metric-data">
                        <span class="metric-value">{{ authorInfo.followers }}</span>
                        <span class="metric-label">粉丝</span>
                      </div>
                    </div>
                    <div class="metric-item">
                      <el-icon class="metric-icon"><UserFilled /></el-icon>
                      <div class="metric-data">
                        <span class="metric-value">{{ authorInfo.following }}</span>
                        <span class="metric-label">关注</span>
                      </div>
                    </div>
                  </div>
                  <div class="metrics-row">
                    <div class="metric-item">
                      <el-icon class="metric-icon"><Star /></el-icon>
                      <div class="metric-data">
                        <span class="metric-value">{{ authorInfo.stared }}</span>
                        <span class="metric-label">星标</span>
                      </div>
                    </div>
                    <div class="metric-item">
                      <el-icon class="metric-icon"><View /></el-icon>
                      <div class="metric-data">
                        <span class="metric-value">{{ authorInfo.watched }}</span>
                        <span class="metric-label">浏览</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- 错误状态 -->
              <div v-else class="error-state">
                <el-icon class="error-icon"><Warning /></el-icon>
                <span class="error-text">加载作者信息失败</span>
                <el-button type="text" @click="fetchAuthorInfo" class="retry-button">重试</el-button>
              </div>
            </div>
          </div>
          
          <!-- 项目历程卡片 -->
          <div class="history-card glass-card">
            <div class="card-header">
              <h3 class="card-title">历程</h3>
              <div class="repo-selector">
                <el-select 
                  v-model="currentRepoIndex" 
                  @change="switchRepo" 
                  placeholder="选择仓库"
                  size="small"
                  class="repo-select"
                >
                  <el-option 
                    v-for="(repo, index) in repoInfos" 
                    :key="repo.id"
                    :label="repo.name"
                    :value="index"
                  />
                </el-select>
              </div>
            </div>
            
            <div class="history-content">
              <!-- 加载状态 -->
              <div v-if="isLoadingCommits" class="loading-state">
                <el-icon class="loading-icon"><Loading /></el-icon>
                <span class="loading-text">正在加载提交记录...</span>
              </div>
              
              <!-- 提交记录表格 -->
              <div v-else class="commits-table">
                <div class="table-header">
                  <div class="header-cell id-col">ID</div>
                  <div class="header-cell author-col">作者</div>
                  <div class="header-cell message-col">提交信息</div>
                  <div class="header-cell date-col">日期</div>
                </div>
                
                <div class="table-body">
                  <div 
                    v-for="(record, index) in getCurrentCommitRecords()" 
                    :key="`${record.id}-${index}`"
                    class="table-row"
                  >
                    <div class="body-cell id-col">
                      <span class="commit-id" :title="record.id">
                        {{ record.id.substring(0, 8) }}
                      </span>
                    </div>
                    <div class="body-cell author-col">
                      <span class="commit-author">{{ record.authorName }}</span>
                    </div>
                    <div class="body-cell message-col">
                      <div class="commit-message">
                        <span class="message-text">{{ record.message }}</span>
                      </div>
                    </div>
                    <div class="body-cell date-col">
                      <span class="commit-date">{{ record.date }}</span>
                    </div>
                  </div>
                  
                  <!-- 空状态 -->
                  <div v-if="getCurrentCommitRecords().length === 0" class="empty-state">
                    <el-icon class="empty-icon"><DataAnalysis /></el-icon>
                    <span class="empty-text">暂无提交记录</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="card-footer">
              <a href="#" class="action-link" @click.prevent="handleProjectShare">
                <span>查看更多</span>
                <el-icon class="action-icon"><ArrowRight /></el-icon>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 底部功能展示区域 -->
    <section class="footer-section">
      <div class="section-content">
        <!-- 主要功能区域 -->
        <div class="footer-main">
          <!-- 订阅动态区域 -->
          <div class="subscription-area">
            <form @submit.prevent="handleSubscribe" class="subscribe-form">
              <div class="input-wrapper">
                <el-input 
                  v-model="email" 
                  placeholder="请输入您的邮箱地址" 
                  class="email-input"
                  size="large"
                >
                  <template #prefix>
                    <el-icon class="input-icon"><Message /></el-icon>
                  </template>
                </el-input>
                <el-button 
                  type="primary" 
                  native-type="submit" 
                  class="subscribe-btn"
                  size="large"
                >
                  <span class="btn-text">立即订阅</span>
                  <el-icon class="btn-icon"><ArrowRight /></el-icon>
                </el-button>
              </div>
            </form>
          </div>
          
          <!-- 联系我们区域 -->
          <div class="contact-area">
            <div class="contact-info">
              <span class="contact-text">联系我们：</span>
              <a href="#" class="email-link" @click.prevent="openEmailClient">
                <el-icon class="email-icon"><Message /></el-icon>
                <span class="email-text">your-email@example.com</span>
              </a>
              <button class="copy-btn" @click="copyEmail">
                <el-icon><Star /></el-icon>
                <span>复制</span>
              </button>
            </div>
          </div>
        </div>
        
        <!-- 底部装饰线 -->
        <div class="footer-decoration">
          <div class="decoration-line"></div>
          <div class="decoration-text">Ming's Object Detection Platform</div>
          <div class="decoration-line"></div>
        </div>
      </div>
    </section>
    
    <!-- ICP备案信息 -->
    <footer class="icp-footer">
      <a href="https://beian.miit.gov.cn" target="_blank" class="icp-link">
        你的ICP备案号
      </a>
    </footer>
    </div>
    
    <!-- AI聊天功能已迁移到登录后的控制台中 -->
  </BackgroundContainer>
</template>

<script setup lang="ts">
import { 
  VideoPlay,
  Star,
  Message,
  ArrowLeft,
  ArrowRight,
  DataAnalysis,
  View,
  Monitor,
  Calendar,
  Camera,
  Loading,
  User,
  UserFilled,
  Warning
} from '@element-plus/icons-vue'
import PlaceholderImage from '../../components/PlaceholderImage.vue'
import BackgroundContainer from '../../components/BackgroundContainer.vue'
import Navbar from '../../components/Navbar.vue'
import { useHome } from './home'

// 使用 composable 函数获取所有逻辑
const {
  // 响应式数据
  activeTab,
  email,
  authorInfo,
  isLoadingAuthor,
  advantages,
  activeCardGroup,
  currentSubCardIndex,
  isManualMode,
  cases,
  echartsContainer,
  aiTechData,
  
  // 提交记录相关数据
  currentRepoIndex,
  isLoadingCommits,
  repoInfos,
  
  // 方法
  handleSubscribe,
  fetchAuthorInfo,
  openTechLink,
  openLearnLink,
  viewCaseDetail,
  viewArchitectureDetail,
  viewDemoDetail,
  handleProjectShare,
  openEmailClient,
  copyEmail,
  toggleCardGroup,
  nextSubCard,
  prevSubCard,
  goToSubCard,
  
  // 提交记录相关方法
  getCurrentCommitRecords,
  switchRepo,
} = useHome()

// AI聊天功能已迁移到登录后的控制台中，相关事件处理已移除
</script>

<style scoped>
@import './style.css';
</style>