<template>
  <nav class="navbar">
    <div class="nav-content">
      <!-- 左侧LOGO -->
      <div class="logo-section">
        <img src="/logo.gif" alt="YOLO" class="logo-image" />
      </div>
      
      <!-- 中间菜单 -->
      <div class="nav-menu">
        <a href="#" :class="['nav-link', { active: activeSection === 'project-overview-section' }]" @click.prevent="scrollToSection('project-overview-section')">项目概览</a>
        <a href="#" :class="['nav-link', { active: activeSection === 'documentation-section' }]" @click.prevent="scrollToSection('documentation-section')">开发文档</a>
        <a href="#" :class="['nav-link', { active: activeSection === 'tools-integration-section' }]" @click.prevent="scrollToSection('tools-integration-section')">工具集成</a>
        <a href="#" :class="['nav-link', { active: activeSection === 'agent-features-section' }]" @click.prevent="scrollToSection('agent-features-section')">Agent功能</a>
        <a href="#" :class="['nav-link', { active: activeSection === 'project-info-section' }]" @click.prevent="scrollToSection('project-info-section')">项目信息</a>
      </div>
      
      <!-- 右侧用户区 -->
      <div class="user-section">
        <button class="simple-btn login-btn" @click="router.push('/login')" aria-label="登录">
          Log in
        </button>
        <button class="simple-btn signup-btn" @click="router.push('/register')" aria-label="注册">
          Sign up
        </button>
        <el-button type="primary" round class="demo-btn">立即体验</el-button>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const activeSection = ref('')

// 平滑滚动到指定区域
const scrollToSection = (sectionId: string) => {
  activeSection.value = sectionId
  const element = document.getElementById(sectionId)
  if (element) {
    const navbarHeight = 100 // 导航栏高度 + 额外间距
    const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
    const offsetPosition = elementPosition - navbarHeight
    
    // 使用requestAnimationFrame确保更流畅的滚动
    requestAnimationFrame(() => {
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    })
  }
}
</script>

<style scoped>
/* 全局变量定义 */
:root {
  --home-accent-orange: #FF6F61;
  --home-accent-purple: #7D00FF;
  --home-text-primary: #ffffff;
  --home-glass-bg: rgba(255, 255, 255, 0.1);
  --home-glass-border: rgba(255, 255, 255, 0.2);
  --accent-color: var(--home-accent-orange);
}

/* 全局平滑滚动 */
html {
  scroll-behavior: smooth;
}

/* 导航栏样式 */
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: var(--home-glass-bg);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--home-glass-border);
  z-index: 1000;
  padding: 1rem 0;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.nav-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
}

.logo-section {
  display: flex;
  align-items: center;
}

.logo-image {
  height: 2.5rem;
  width: auto;
  filter: drop-shadow(0 0 10px rgba(255, 111, 97, 0.3));
  transition: transform 0.3s ease;
}

.logo-image:hover {
  transform: scale(1.05);
}

.nav-menu {
  display: flex;
  gap: 2rem;
}

.nav-link {
  color: var(--home-text-primary);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease;
  position: relative;
  padding-bottom: 4px;
}

.nav-link:hover {
  color: var(--home-accent-orange);
}

.nav-link.active {
  color: #007bff;
  font-weight: 700;
}

.nav-link.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: #007bff;
  border-radius: 1px;
}



.user-section {
  display: flex;
  gap: 1rem;
  align-items: center;
}

/* 简洁按钮样式 */
.simple-btn {
  background: transparent;
  border: none;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  color: var(--home-text-primary);
  transition: all 0.3s ease;
  text-decoration: none;
  position: relative;
}

.simple-btn:hover {
  background: linear-gradient(135deg, #FF6B6B, #4ECDC4, #45B7D1, #96CEB4, #FFEAA7, #DDA0DD);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  background-size: 200% 200%;
  animation: rainbow-flow 2s ease-in-out infinite;
}

.signup-btn:hover {
  background: linear-gradient(135deg, #FF9A9E, #FECFEF, #FECFEF, #A8E6CF, #FFD3A5, #FD9853);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  background-size: 200% 200%;
  animation: rainbow-flow 2s ease-in-out infinite;
}

@keyframes rainbow-flow {
  0% {
    background-position: 0 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0 50%;
  }
}

.demo-btn {
  background: linear-gradient(135deg, var(--accent-color), #4b5edb) !important;
  border: none !important;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .nav-content {
    padding: 0 1rem;
  }
  
  .nav-menu {
    display: none;
  }
  
  .user-section {
    gap: 0.5rem;
  }
  
  .simple-btn {
    padding: 6px 12px;
    font-size: 14px;
  }
}
</style>