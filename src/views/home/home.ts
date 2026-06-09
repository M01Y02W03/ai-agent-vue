import { ref, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { api } from '../../api'
import type { CaseItem, Advantage, CommitRecord, AuthorInfo, BackendCommitRecord, RepoInfo } from '../../types'
import { RepoType } from '../../types'

// 使用 composable 函数来组织逻辑
export function useHome() {
  // 路由和认证状态
  const router = useRouter()
  const authStore = useAuthStore()
  
  // 响应式数据
  const activeTab = ref('original')
  const email = ref('')
  
  // 作者信息数据
  const authorInfo = ref<AuthorInfo | null>(null)
  const isLoadingAuthor = ref(false)
  
  // 提交记录相关数据
  const currentRepoIndex = ref(0)
  const isLoadingCommits = ref(false)
  const backendCommitRecords = ref<{ [key: number]: BackendCommitRecord[] }>({})
  
  // 仓库信息
  const repoInfos = ref<RepoInfo[]>([
    { id: RepoType.Vue, name: 'Vue', title: 'Vue前端项目' },
    { id: RepoType.Python, name: 'Python', title: 'Python算法项目' },
    { id: RepoType.Java, name: 'Java', title: 'Java后端项目' }
  ])
  
  // 技术文档数据
  const advantages = ref<Advantage[]>([
    {
      "id": 1,
      "icon": "/src/assets/svg/深度学习-copy-copy.svg",
      "title": "Deep Learning",
      "description": "TensorFlow、PyTorch、Caffe、MXNet、Keras、PaddlePaddle",
      "learnUrl": "https://github.com/ultralytics/yolov8",
      "details": [
        {
          "title": "TensorFlow",
          "description": "Google开发的端到端机器学习平台"
        },
        {
          "title": "PyTorch",
          "description": "动态计算图，研究首选框架"
        },
        {
          "title": "Keras",
          "description": "高层API，快速原型设计"
        },
        {
          "title": "PaddlePaddle",
          "description": "百度开源工业级深度学习框架"
        }
      ]
    },
    {
      id: 2,
      icon: '/src/assets/svg/人工智能.svg',
      title: 'Agent ',
      description: 'Spring AI、Langchain4j、MCP',
      learnUrl: 'https://spring.io/projects/spring-ai',
      details: [
        {
          title: 'Prompt',
          description: '提示词工程'
        },
        {
          title: 'Function Calling',
          description: '函数调用'
        },
        {
          title: 'RAG',
          description: '检索增强'
        },
        {
          title: 'Multimodal',
          description: '多模态'
        }
      ]
    },
    {
      "id": 3,
      "icon": "/src/assets/svg/SpringBoot.svg",
      "title": "Spring",
      "description": "Spring MVC、Spring Boot、Mybatis-Plus",
      "learnUrl": "https://docs.spring.io/spring-boot/docs/current/reference/htmlsingle/",
      "details": [
        {
          "title": "Spring MVC",
          "description": "基于Servlet的Web框架，支持RESTful架构"
        },
        {
          "title": "Spring Boot",
          "description": "自动化配置、快速构建生产级应用"
        },
        {
          "title": "MyBatis-Plus",
          "description": "增强ORM框架，支持Lambda表达式查询"
        },
        {
          "title": "Starter生态",
          "description": "开箱即用的模块化依赖方案"
        }
      ]
    },
    {
      id: 4,
      icon: 'src\\assets\\svg\\Middleware.svg',
      title: '第三方插件',
      description: 'Docker、Redis、VectorStore、Sa-Token',
      learnUrl: 'https://docs.docker.com/',
      details: [
        {
          title: 'Docker',
          description: '镜像打包、容器化部署'
        },
        {
          title: 'Redis',
          description: '高性能缓存、会话存储'
        },
        {
          title: 'VectorStore',
          description: '支持存储、检索向量数据'
        },
        {
          title: 'Sa-Token',
          description: '轻量级Java权限认证框架'
        }
      ]
    }
  ])
  
  // 当前活跃的卡片组和子卡片索引
  const activeCardGroup = ref<number>(-1)
  const currentSubCardIndex = ref<number[]>([0, 0, 0, 0])
  const autoPlayTimers = ref<(NodeJS.Timeout | null)[]>([null, null, null, null])
  const isManualMode = ref<boolean[]>([false, false, false, false])
  
  // 实践案例数据
  const cases = ref<CaseItem[]>([
    {
      id: 1,
      title: '水果、蔬菜种类识别',
      description: '支持图片、视频识别',
      tags: ['水果', '蔬菜', '类别'],
      },
    {
      id: 2,
      title: '残次咖啡豆识别',
      description: '能够识别出咖啡豆的残次品',
      tags: ['农产品', '缺陷识别', '质量检测'],
      },
    {
      id: 3,
      title: '茶叶杂物识别',
      description: '针对茶叶中的细小杂物识别',
      tags: ['质量检测', '缺陷识别', '农产品'],
      }
  ])

  // ECharts容器引用
  const echartsContainer = ref()
  
  // AI技术栈数据
  const aiTechData = ref([
    {
      name: 'Spring AI',
      value: 90, // 生态扩展性优势
      description: '企业级AI应用开发框架，提供完整的AI集成解决方案',
      url: 'https://spring.io/projects/spring-ai',
      color: '#6DB33F',
      icon: '/src/assets/svg/spring.svg'
    },
    {
      name: 'Langchain4j',
      value: 90, // 多模型支持优势
      description: 'Java生态LLM应用开发库，简化大语言模型集成',
      url: 'https://github.com/langchain4j/langchain4j',
      color: '#FF6B35',
      icon: '/src/assets/svg/鹦鹉.svg'
    },
    {
      name: 'MCP',
      value: 90, // 工具调用标准化优势
      description: '模型上下文协议标准，实现AI服务标准化交互',
      url: 'https://modelcontextprotocol.io/',
      color: '#4A90E2',
      icon: '/src/assets/svg/mcp-面.svg'
    }
  ])
  
  // 方法
  const handleSubscribe = () => {
    if (!email.value) {
      ElMessage.warning('请输入邮箱地址')
      return
    }
    ElMessage.success('订阅成功！请注意查收')
    email.value = ''
  }
  
  // 获取作者信息
  const fetchAuthorInfo = async () => {
    try {
      isLoadingAuthor.value = true
      const response = await api.author.getAuthorInfo()
      if (response.success) {
        authorInfo.value = response.data
      } else {
        ElMessage.error(response.error || '获取作者信息失败')
      }
    } catch (error) {
      console.error('获取作者信息失败:', error)
      ElMessage.error('网络连接异常，请稍后重试')
    } finally {
      isLoadingAuthor.value = false
    }
  }
  
  // 获取提交记录
  const fetchCommits = async (repoId: number) => {
    try {
      isLoadingCommits.value = true
      const response = await api.commits.getCommits(repoId)
      if (response.success) {
        backendCommitRecords.value[repoId] = response.data
      } else {
        ElMessage.error(response.error || '获取提交记录失败')
      }
    } catch (error) {
      console.error('获取提交记录失败:', error)
      ElMessage.error('网络连接异常，请稍后重试')
    } finally {
      isLoadingCommits.value = false
    }
  }
  
  // 获取所有仓库的提交记录
  const fetchAllCommits = async () => {
    for (const repo of repoInfos.value) {
      await fetchCommits(repo.id)
    }
  }
  
  // 转换后端提交记录为显示格式
  const convertBackendCommits = (backendCommits: BackendCommitRecord[]): CommitRecord[] => {
    return backendCommits.map((commit) => {
      // 格式化日期
      const date = new Date(commit.author.date).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
      
      // 清理提交消息，移除签名信息
      const cleanMessage = commit.message.split('\n\nSigned-off-by:')[0].trim()
      
      return {
        id: commit.id,
        date,
        authorName: commit.author.name,
        message: cleanMessage
      }
    })
  }
  
  // 获取当前显示的提交记录
  const getCurrentCommitRecords = (): CommitRecord[] => {
    const currentRepoId = repoInfos.value[currentRepoIndex.value]?.id
    if (currentRepoId !== undefined && backendCommitRecords.value[currentRepoId]) {
      return convertBackendCommits(backendCommitRecords.value[currentRepoId])
    }
    return [] // 没有数据时返回空数组
  }
  
  // 切换仓库
  const switchRepo = (index: number) => {
    if (index >= 0 && index < repoInfos.value.length) {
      currentRepoIndex.value = index
      const repoId = repoInfos.value[index].id
      // 确保在切换仓库时重新获取数据以保持UI同步
      if (!backendCommitRecords.value[repoId] || backendCommitRecords.value[repoId].length === 0) {
        fetchCommits(repoId).catch(error => {
          console.error('切换仓库时获取提交记录失败:', error)
        })
      }
    }
  }
  
  // 创建通用的跳转处理函数
  const handleNavigation = (targetPath?: string) => {
    // 检查登录状态
    if (!authStore.isAuthenticated) {
      // 未登录，提示并跳转到登录页
      ElMessage.warning('请先登录后再访问该功能')
      router.push({ name: 'Login', query: { redirect: targetPath || '/dashboard' } })
    } else {
      // 已登录，跳转到控制台
      router.push({ name: 'Dashboard' })
    }
  }

  // 打开技术栈链接
  const openTechLink = (_url: string) => {
    handleNavigation('/dashboard')
  }
  
  // 打开学习链接
  const openLearnLink = (_url?: string) => {
    handleNavigation('/dashboard')
  }
  
  // 打开开发者个人主页
  const openDeveloperProfile = (_profileUrl: string) => {
    handleNavigation('/dashboard')
  }
  
  // 查看案例详情
  const viewCaseDetail = (_caseId: number) => {
    handleNavigation('/dashboard')
  }
  
  // 查看项目架构详情
  const viewArchitectureDetail = () => {
    handleNavigation('/dashboard')
  }
  
  // 查看演示详情
  const viewDemoDetail = () => {
    handleNavigation('/dashboard')
  }
  
  // 处理项目分享点击事件
  const handleProjectShare = () => {
    handleNavigation('/dashboard')
  }
  
  // 打开邮件客户端
  const openEmailClient = () => {
    handleNavigation('/dashboard')
  }
  
  // 复制邮箱地址
  const copyEmail = async () => {
    const emailText = 'your-email@example.com'
    
    // 优先使用现代 Clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(emailText)
        ElMessage.success('邮箱地址已复制到剪贴板')
        return
      } catch (err) {
        console.warn('Clipboard API 失败，尝试降级方案:', err)
      }
    }
    
    // 降级方案：使用 Selection API（推荐替代 execCommand）
    try {
      const textArea = document.createElement('textarea')
      textArea.value = emailText
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      
      textArea.focus()
      textArea.select()
      
      // 使用 Selection API 替代 execCommand
      const selection = window.getSelection()
      if (selection) {
        selection.removeAllRanges()
        const range = document.createRange()
        range.selectNodeContents(textArea)
        selection.addRange(range)
        
        // 最后的降级方案：仍使用 execCommand，但添加类型断言忽略警告
        const success = (document as any).execCommand('copy')
        if (success) {
          ElMessage.success('邮箱地址已复制到剪贴板')
        } else {
          throw new Error('execCommand 复制失败')
        }
      } else {
        throw new Error('无法获取 Selection 对象')
      }
      
      document.body.removeChild(textArea)
    } catch (fallbackErr) {
      console.error('所有复制方法都失败:', fallbackErr)
      ElMessage.error('复制失败，请手动复制邮箱地址：' + emailText)
    }
  }
  
  // 卡片组交互方法
  const toggleCardGroup = (index: number) => {
    if (activeCardGroup.value === index) {
      // 如果点击的是当前活跃卡片，切换回自动模式
      activeCardGroup.value = -1
      isManualMode.value[index] = false
      startAutoPlay(index)
    } else {
      // 停止所有自动播放
      stopAllAutoPlay()
      // 激活新卡片组
      activeCardGroup.value = index
      isManualMode.value[index] = true
    }
  }
  
  const nextSubCard = (cardIndex: number) => {
    const maxIndex = advantages.value[cardIndex].details.length - 1
    if (currentSubCardIndex.value[cardIndex] < maxIndex) {
      currentSubCardIndex.value[cardIndex]++
    }
  }
  
  const prevSubCard = (cardIndex: number) => {
    if (currentSubCardIndex.value[cardIndex] > 0) {
      currentSubCardIndex.value[cardIndex]--
    }
  }
  
  const goToSubCard = (cardIndex: number, subIndex: number) => {
    currentSubCardIndex.value[cardIndex] = subIndex
  }
  
  const startAutoPlay = (cardIndex: number) => {
    if (autoPlayTimers.value[cardIndex]) {
      clearInterval(autoPlayTimers.value[cardIndex]!)
    }
    
    autoPlayTimers.value[cardIndex] = setInterval(() => {
      if (!isManualMode.value[cardIndex]) {
        const maxIndex = advantages.value[cardIndex].details.length - 1
        if (currentSubCardIndex.value[cardIndex] >= maxIndex) {
          currentSubCardIndex.value[cardIndex] = 0
        } else {
          currentSubCardIndex.value[cardIndex]++
        }
      }
    }, 4000) // 4秒轮播间隔
  }
  
  const stopAllAutoPlay = () => {
    autoPlayTimers.value.forEach((timer: NodeJS.Timeout | null, index: number) => {
      if (timer) {
        clearInterval(timer)
        autoPlayTimers.value[index] = null
      }
    })
  }
  
  const initAutoPlay = () => {
    advantages.value.forEach((_: Advantage, index: number) => {
      startAutoPlay(index)
    })
  }
  
  // 初始化ECharts
  const initECharts = () => {
    if (!echartsContainer.value) return
    
    const chart = echarts.init(echartsContainer.value)
    const option = {
      title: {
        text: '能力维度',
        left: 'center',
        top: '3%',
        textStyle: {
          color: '#43bb91',
          fontSize: 20,
          fontWeight: 'bold',
          textShadowColor: 'rgba(0, 0, 0, 0.5)',
          textShadowBlur: 10
        }
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        borderColor: 'rgba(255, 255, 255, 0.3)',
        borderWidth: 1,
        textStyle: {
          color: '#fff',
          fontSize: 13
        },
        extraCssText: 'border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.6);'
      },
      legend: {
        orient: 'horizontal',
        bottom: '2%',
        textStyle: {
          color: '#fff',
          fontSize: 13,
          fontWeight: '500'
        },
        itemGap: 30,
        itemWidth: 16,
        itemHeight: 16
      },
      radar: {
        center: ['50%', '50%'],
        radius: '60%',
        indicator: [
          { name: '工具调用标准化', max: 100, color: '#fff' },
          { name: '上下文管理', max: 100, color: '#fff' },
          { name: '多模型支持', max: 100, color: '#fff' },
          { name: 'RAG', max: 100, color: '#fff' },
          { name: '流程编排', max: 100, color: '#fff' },
          { name: '生态扩展性', max: 100, color: '#fff' }
        ],
        name: {
          textStyle: {
            color: '#fff',
            fontSize: 14,
            fontWeight: '600'
          }
        },
        splitArea: {
          areaStyle: {
            color: [
              'rgba(255, 255, 255, 0.02)',
              'rgba(255, 255, 255, 0.04)',
              'rgba(255, 255, 255, 0.06)',
              'rgba(255, 255, 255, 0.08)',
              'rgba(255, 255, 255, 0.1)'
            ]
          }
        },
        splitLine: {
          lineStyle: {
            color: 'rgba(255, 255, 255, 0.2)',
            width: 1
          }
        },
        axisLine: {
          lineStyle: {
            color: 'rgba(255, 255, 255, 0.3)',
            width: 2
          }
        }
      },
      series: aiTechData.value.map((item, index) => ({
        name: item.name,
        type: 'radar',
        data: [{
          value: [
            // 工具调用标准化、上下文管理、多模型支持、数据集成(RAG)、流程编排、生态扩展性
            item.name === 'Spring AI' ? [30, 50, 70, 60, 40, 90] : 
            item.name === 'Langchain4j' ? [40, 80, 90, 85, 75, 60] : [90, 60, 20, 50, 30, 70]
          ][0],
          name: item.name
        }],
        lineStyle: {
          color: item.color,
          width: 3,
          shadowColor: item.color + '60',
          shadowBlur: 10
        },
        areaStyle: {
          color: {
            type: 'radial',
            x: 0.5,
            y: 0.5,
            r: 0.8,
            colorStops: [
              { offset: 0, color: item.color + '40' },
              { offset: 0.8, color: item.color + '20' },
              { offset: 1, color: item.color + '10' }
            ]
          },
          shadowColor: item.color + '30',
          shadowBlur: 15
        },
        symbol: 'circle',
        symbolSize: 8,
        itemStyle: {
          color: item.color,
          borderColor: '#fff',
          borderWidth: 2,
          shadowColor: item.color,
          shadowBlur: 8
        },
        emphasis: {
          lineStyle: {
            width: 4,
            shadowBlur: 15
          },
          itemStyle: {
            symbolSize: 12,
            shadowBlur: 12
          },
          areaStyle: {
            color: {
              type: 'radial',
              x: 0.5,
              y: 0.5,
              r: 0.8,
              colorStops: [
                { offset: 0, color: item.color + '60' },
                { offset: 0.8, color: item.color + '30' },
                { offset: 1, color: item.color + '15' }
              ]
            }
          }
        },
        animationDelay: index * 300
      })),
      animationDuration: 2000,
      animationEasing: 'cubicOut'
    }
    chart.setOption(option as any)
    
    // 添加交互效果
    chart.on('mouseover', function(params: any) {
      chart.dispatchAction({
        type: 'highlight',
        seriesIndex: params.seriesIndex
      })
    })
    
    chart.on('mouseout', function() {
      chart.dispatchAction({
        type: 'downplay'
      })
    })
    
    // 窗口大小变化时重新渲染
    window.addEventListener('resize', () => {
      chart.resize()
    })
  }
  
  // 滚动动画观察器
  const initScrollAnimation = () => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
          }
        })
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      }
    )
  
    // 观察所有需要动画的元素
    const animateElements = document.querySelectorAll('.scroll-animate')
    animateElements.forEach((el) => observer.observe(el))
  }
  
  // 生命周期
  onMounted(() => {
    initECharts()
    initScrollAnimation()
    initAutoPlay()
    // 异步获取数据，添加错误处理
    fetchAuthorInfo().catch(error => {
      console.error('初始化时获取作者信息失败:', error)
    })
    fetchAllCommits().catch(error => {
      console.error('初始化时获取提交记录失败:', error)
    })
  })
  
  // 组件卸载时清理定时器
  onBeforeUnmount(() => {
    stopAllAutoPlay()
  })
  
  // 返回所有需要在组件中使用的数据和方法
  return {
    // 响应式数据
    activeTab,
    email,
    authorInfo,
    isLoadingAuthor,
    advantages,
    activeCardGroup,
    currentSubCardIndex,
    autoPlayTimers,
    isManualMode,
    cases,
    echartsContainer,
    aiTechData,
    
    // 新增：提交记录相关数据
    currentRepoIndex,
    isLoadingCommits,
    backendCommitRecords,
    repoInfos,
    
    // 方法
    handleSubscribe,
    fetchAuthorInfo,
    openTechLink,
    openLearnLink,
    openDeveloperProfile,
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
    startAutoPlay,
    stopAllAutoPlay,
    initAutoPlay,
    initECharts,
    initScrollAnimation,
    
    // 新增：提交记录相关方法
    fetchCommits,
    fetchAllCommits,
    getCurrentCommitRecords,
    switchRepo
  }
}