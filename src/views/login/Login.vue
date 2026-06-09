<template>
  <div class="login-container">
    <!-- 背景装饰 -->
    <div class="background-decoration">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
      <div class="circle circle-3"></div>
    </div>

    <div class="login-content">
      <!-- 左侧信息展示区 -->
      <div class="info-section">
        <!-- 项目Logo -->
        <div class="logo-section">
          <div class="logo-icon">
            <img src="/logo.gif" alt="YOLO" class="detection-logo" />
          </div>
          <h1 class="project-name">QA</h1>
        </div>

        <!-- 主标题 -->
        <div class="main-title">
          <h2>MCP多工具协同QA系统</h2>
        </div>

        <!-- 特性列表 -->
        <div class="features-list">
          <div class="feature-item">
            <div class="check-icon">
              <el-icon color="#52c41a"><Check /></el-icon>
            </div>
            <span>只需一步极速注册登录</span>
          </div>
          <div class="feature-item">
            <div class="check-icon">
              <el-icon color="#52c41a"><Check /></el-icon>
            </div>
            <span>只需自然语言交互即可完成任务</span>
          </div>
          <div class="feature-item">
            <div class="check-icon">
              <el-icon color="#52c41a"><Check /></el-icon>
            </div>
            <span>多模态、多模型、多工具加持</span>
          </div>
          <div class="feature-item">
            <div class="check-icon">
              <el-icon color="#52c41a"><Check /></el-icon>
            </div>
            <span>免费开启在线QA服务</span>
          </div>
        </div>

        <!-- 底部装饰图案 -->
        <div class="decoration-pattern">
          <div class="dot" v-for="i in 20" :key="i"></div>
        </div>
      </div>

      <!-- 右侧登录表单区 -->
      <div class="form-section">
        <div class="form-container">
          <!-- 返回首页链接 -->
          <div class="back-home-link">
            <router-link to="/" class="home-link" aria-label="返回首页">
              <el-icon class="home-icon"><ArrowLeft /></el-icon>
              <span>返回首页</span>
            </router-link>
          </div>
          
          <!-- 登录方式选项卡 -->
          <div class="login-tabs">
            <div 
              class="tab-item" 
              :class="{ 'active': activeTab === 'password' }" 
              @click="switchTab('password')"
              tabindex="-1"
              mainRoleId="button"
              :aria-pressed="activeTab === 'password'"
              aria-label="切换到密码登录"
            >
              <span class="tab-text">密码登录</span>
            </div>
            <div 
              class="tab-item" 
              :class="{ 'active': activeTab === 'code' }" 
              @click="switchTab('code')"
              tabindex="-1"
              mainRoleId="button"
              :aria-pressed="activeTab === 'code'"
              aria-label="切换到验证码登录"
            >
              <span class="tab-text">验证码登录</span>
            </div>
          </div>

          <!-- 统一输入区域 -->
          <div class="unified-input-container" :class="{ 'transitioning': isTransitioning }">
            <!-- 邮箱输入框 (两种登录方式都使用邮箱) -->
            <div class="input-section email-section">
              <!-- 密码登录时显示邮箱输入 -->
              <transition name="fade" mode="out-in">
                <el-input
                  v-if="activeTab === 'password'"
                  key="password-email"
                  v-model="loginForm.email"
                  placeholder="邮箱"
                  size="large"
                  class="unified-input"
                  autocomplete="off"
                  name="email-password"
                  type="text"
                >
                  <template #prefix>
                    <el-icon><Message /></el-icon>
                  </template>
                </el-input>
                
                <!-- 验证码登录时也显示邮箱输入 -->
                <el-input
                  v-else
                  key="code-email"
                  v-model="codeForm.email"
                  placeholder="邮箱"
                  size="large"
                  class="unified-input"
                  autocomplete="off"
                  name="email-code"
                  type="text"
                >
                  <template #prefix>
                    <el-icon><Message /></el-icon>
                  </template>
                </el-input>
              </transition>
            </div>
            
            <!-- 分隔线 -->
            <div class="input-divider"></div>
            
            <!-- 密码/验证码输入框 -->
            <div class="input-section password-section">
              <transition name="fade" mode="out-in">
                <!-- 密码输入 -->
                <el-input
                  v-if="activeTab === 'password'"
                  key="password-input"
                  v-model="loginForm.password"
                  type="password"
                  placeholder="密码"
                  size="large"
                  class="unified-input"
                  show-password
                  autocomplete="new-password"
                  name="password"
                >
                  <template #prefix>
                    <el-icon><Lock /></el-icon>
                  </template>
                </el-input>
                
                <!-- 验证码输入 -->
                <div v-else key="code-input" class="code-input-wrapper">
                  <el-input
                    v-model="codeForm.code"
                    placeholder="验证码"
                    size="large"
                    class="unified-input code-input"
                    autocomplete="one-time-code"
                    name="verification-code"
                  >
                    <template #prefix>
                      <el-icon><Key /></el-icon>
                    </template>
                  </el-input>
                  <el-button 
                    class="code-button"
                    :disabled="codeCountdown > 0"
                    @click="sendCode"
                  >
                    {{ codeCountdown > 0 ? `${codeCountdown}s后重新获取` : '获取验证码' }}
                  </el-button>
                </div>
              </transition>
            </div>
          </div>

          <!-- 密码登录表单 -->
          <el-form 
            v-if="activeTab === 'password'"
            ref="loginFormRef" 
            :model="loginForm" 
            :rules="loginRules" 
            class="login-form"
            @submit.prevent="handleLogin"
          >
            <el-form-item prop="email" class="hidden-form-item">
              <el-input v-model="loginForm.email" style="display: none;" />
            </el-form-item>
            <el-form-item prop="password" class="hidden-form-item">
              <el-input v-model="loginForm.password" style="display: none;" />
            </el-form-item>
            
            <el-form-item>
              <div class="form-options">
                <el-checkbox v-model="loginForm.remember">记住我</el-checkbox>
              </div>
            </el-form-item>

            <el-form-item>
              <el-button 
                type="primary" 
                size="large" 
                class="login-button"
                :loading="authStore.loading"
                @click="handleLogin"
              >
                登录
              </el-button>
            </el-form-item>
          </el-form>

          <!-- 验证码登录表单 -->
          <el-form 
            v-if="activeTab === 'code'"
            ref="codeFormRef" 
            :model="codeForm" 
            :rules="codeRules" 
            class="login-form"
            @submit.prevent="handleCodeLogin"
          >
            <el-form-item prop="email" class="hidden-form-item">
              <el-input v-model="codeForm.email" style="display: none;" />
            </el-form-item>
            <el-form-item prop="code" class="hidden-form-item">
              <el-input v-model="codeForm.code" style="display: none;" />
            </el-form-item>
            
            <el-form-item>
              <div class="form-options">
                <el-checkbox v-model="codeForm.remember">记住我</el-checkbox>
              </div>
            </el-form-item>

            <el-form-item>
              <el-button 
                type="primary" 
                size="large" 
                class="login-button"
                :loading="authStore.loading"
                @click="handleCodeLogin"
              >
                登录
              </el-button>
            </el-form-item>
          </el-form>

          <!-- 表单底部链接 -->
          <div class="form-footer">
            <div class="footer-links">
              <a href="#" class="link" @click="handleForgotPassword">忘记密码？</a>
              <a href="#" class="link register-link" @click="router.push('/register')">去注册</a>
            </div>
          </div>

          <!-- 其他登录方式 -->
          <div class="social-login">
            <div class="divider">
              <span>其他登录方式</span>
            </div>
            <div class="social-icons">
              <div class="social-icon gitee" title="使用Gitee登录" @click="handleGiteeLogin">
                <img src="/src/assets/svg/gitee.svg" alt="Gitee" class="icon" />
              </div>
              <div class="social-icon github" title="使用GitHub登录" @click="handleGitHubLogin">
                <img src="/src/assets/svg/github.svg" alt="GitHub" class="icon" />
              </div>
            </div>
          </div>

          <!-- 底部提示 -->
          <div class="terms">
            <p>登录即同意 <router-link to="/policy?source=login" class="terms-link">用户协议</router-link>、<router-link to="/policy?source=login" class="terms-link">隐私政策</router-link></p>
          </div>
        </div>
      </div>
    </div>
    

    
    <!-- 密码重置弹窗组件 -->
    <PasswordResetDialog 
      v-model="showPasswordReset"
      title="忘记密码"
    />
    
    <!-- 人机验证组件 -->
    <CaptchaVerification 
      v-model="showCaptcha"
      @success="handleCaptchaSuccess"
      @cancel="handleCaptchaCancel"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Check, Message, Lock, Key, ArrowLeft } from '@element-plus/icons-vue'
import { useAuthStore } from '../../stores/auth'
import { doLogin } from './login-mutex'
import { sendEmailCode, doCodeLogin } from './login-code'
import { initiateGiteeOAuth2Login, initiateGitHubOAuth2Login } from './auth2'
import PasswordResetDialog from '../../components/PasswordResetDialog.vue'
import CaptchaVerification from '../verificat/CaptchaVerification.vue'

const router = useRouter()
const authStore = useAuthStore()
const loginFormRef = ref<FormInstance>()
const codeFormRef = ref<FormInstance>()

// 当前激活的选项卡
const activeTab = ref('password')
// 切换动画状态
const isTransitioning = ref(false)

// 验证码倒计时
const codeCountdown = ref(0)



// 密码重置相关
const showPasswordReset = ref(false)

// 人机验证相关
const showCaptcha = ref(false)
const pendingLoginAction = ref<(() => Promise<void>) | null>(null)

// 登录表单数据
const loginForm = reactive({
  email: '',
  password: '',
  remember: false
})

// 验证码登录表单数据
const codeForm = reactive({
  email: '',
  code: '',
  remember: false
})

// 表单验证规则
const loginRules: FormRules = {
  email: [
    { required: true, message: '请填写邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请填写密码', trigger: 'blur' },
    { min: 6, message: '密码至少需要6位字符', trigger: 'blur' }
  ]
}

// 验证码登录验证规则
const codeRules: FormRules = {
  email: [
    { required: true, message: '请填写邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请填写验证码', trigger: 'blur' },
    { len: 6, message: '验证码必须为6位数字', trigger: 'blur' }
  ]
}

// 实际登录处理
const performLogin = async () => {
  if (!loginFormRef.value) return
  
  try {
    await loginFormRef.value.validate()
    
    // 使用新的同端互斥登录
    const result = await doLogin(loginForm.email, loginForm.password, loginForm.remember)
    
    if (result.success) {
        // 更新auth store状态
        authStore.setUser(result.data.user)
        
        ElMessage.success('登录成功！')
        
        // 显示加载状态
        const loadingMessage = ElMessage({
          message: '正在获取用户信息...',
          type: 'info',
          duration: 0,
          showClose: false
        })
        
        try {
          // 获取用户资料信息
          const profileResult = await authStore.fetchUserProfile()
          
          loadingMessage.close()
          
          if (profileResult.success) {
            // 直接跳转到控制台，不再判断是否为新用户
            const redirect = router.currentRoute.value.query.redirect as string
            await router.push(redirect || '/dashboard')
          } else {
            // 获取用户资料失败，但登录成功，直接跳转到控制台
            ElMessage.warning('获取用户信息失败，但登录成功')
            const redirect = router.currentRoute.value.query.redirect as string
            await router.push(redirect || '/dashboard')
          }
        } catch (profileError) {
          loadingMessage.close()
          console.error('获取用户资料失败:', profileError)
          ElMessage.warning('获取用户信息失败，但登录成功')
          const redirect = router.currentRoute.value.query.redirect as string
          await router.push(redirect || '/dashboard')
        }
      } else {
        ElMessage.error(result.error || '登录失败')
      }
    
  } catch (error) {
    console.error('登录失败:', error)
    ElMessage.error('登录失败，请检查输入信息')
  }
}

// 登录处理 - 先进行人机验证
const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  try {
    // 先验证表单
    await loginFormRef.value.validate()
    
    // 设置待执行的登录操作
    pendingLoginAction.value = performLogin
    
    // 显示人机验证
    showCaptcha.value = true
    
  } catch (error) {
    console.error('表单验证失败:', error)
    ElMessage.error('请检查输入信息是否正确')
  }
}

// 实际验证码登录处理
const performCodeLogin = async () => {
  if (!codeFormRef.value) return
  
  try {
    await codeFormRef.value.validate()
    
    // 使用验证码登录
    const result = await doCodeLogin(codeForm.email, codeForm.code)
    
    if (result.success) {
      // 更新auth store状态
      authStore.setUser(result.data.user)
      
      ElMessage.success('登录成功！')
      
      // 显示加载状态
      const loadingMessage = ElMessage({
        message: '正在获取用户信息...',
        type: 'info',
        duration: 0,
        showClose: false
      })
      
      try {
        // 获取用户资料信息
        const profileResult = await authStore.fetchUserProfile()
        
        loadingMessage.close()
        
        if (profileResult.success) {
          // 直接跳转到控制台，不再判断是否为新用户
          const redirect = router.currentRoute.value.query.redirect as string
          await router.push(redirect || '/dashboard')
        } else {
          // 获取用户资料失败，但登录成功，直接跳转到控制台
          ElMessage.warning('获取用户信息失败，但登录成功')
          const redirect = router.currentRoute.value.query.redirect as string
          await router.push(redirect || '/dashboard')
        }
      } catch (profileError) {
        loadingMessage.close()
        console.error('获取用户资料失败:', profileError)
        ElMessage.warning('获取用户信息失败，但登录成功')
        const redirect = router.currentRoute.value.query.redirect as string
        await router.push(redirect || '/dashboard')
      }
    } else {
      ElMessage.error(result.error || '验证码登录失败')
    }
    
  } catch (error) {
    console.error('验证码登录失败:', error)
    ElMessage.error('验证码登录失败，请重试')
  }
}

// 验证码登录处理
const handleCodeLogin = async () => {
  if (!codeFormRef.value) return
  
  try {
    // 先验证表单
    await codeFormRef.value.validate()
    
    // 设置待执行的验证码登录操作
    pendingLoginAction.value = performCodeLogin
    
    // 显示人机验证
    showCaptcha.value = true
    
  } catch (error) {
    console.error('表单验证失败:', error)
    ElMessage.error('请检查输入信息是否正确')
  }
}

// 切换登录方式
const switchTab = (tabType: 'password' | 'code') => {
  // 防止重复切换
  if (activeTab.value === tabType || isTransitioning.value) {
    return
  }
  
  // 开始切换动画
  isTransitioning.value = true
  
  // 强制清除所有表单数据，防止email残留
  if (tabType === 'password') {
    loginForm.email = ''
    loginForm.password = ''
    loginForm.remember = false
    setTimeout(() => {
      if (loginFormRef.value) {
        loginFormRef.value.clearValidate()
      }
    }, 0)
  } else {
    codeForm.email = ''
    codeForm.code = ''
    codeForm.remember = false
    setTimeout(() => {
      if (codeFormRef.value) {
        codeFormRef.value.clearValidate()
      }
    }, 0)
  }
  
  // 平滑切换
  setTimeout(() => {
    activeTab.value = tabType
    
    // 切换完成后重置动画状态
    setTimeout(() => {
      isTransitioning.value = false
    }, 150)
  }, 75)
}

// 发送验证码
const sendCode = async () => {
  if (!codeForm.email) {
    ElMessage.warning('请先填写邮箱')
    return
  }
  
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(codeForm.email)) {
    ElMessage.error('邮箱格式不正确')
    return
  }
  
  try {
    // 调用发送验证码API
    const result = await sendEmailCode(codeForm.email)
    
    if (result.success) {
      ElMessage.success('验证码已发送，请注意查收')
      
      // 开始倒计时
      codeCountdown.value = 60
      const timer = setInterval(() => {
        codeCountdown.value--
        if (codeCountdown.value <= 0) {
          clearInterval(timer)
        }
      }, 1000)
    } else {
      ElMessage.error(result.error || '发送验证码失败')
    }
    
  } catch (error) {
    console.error('发送验证码失败:', error)
    ElMessage.error('发送验证码失败，请检查网络连接')
  }
}



// 处理Gitee第三方登录
const handleGiteeLogin = () => {
  try {
    initiateGiteeOAuth2Login()
  } catch (error: any) {
    console.error('Gitee登录失败:', error)
    ElMessage.error('Gitee登录失败，请重试')
  }
}

// 处理GitHub第三方登录
const handleGitHubLogin = () => {
  try {
    initiateGitHubOAuth2Login()
  } catch (error: any) {
    console.error('GitHub登录失败:', error)
    ElMessage.error('GitHub登录失败，请重试')
  }
}

// 人机验证成功处理
const handleCaptchaSuccess = async () => {
  showCaptcha.value = false
  
  if (pendingLoginAction.value) {
    try {
      await pendingLoginAction.value()
    } catch (error) {
      console.error('登录操作失败:', error)
    } finally {
      pendingLoginAction.value = null
    }
  }
}

// 人机验证取消处理
const handleCaptchaCancel = () => {
  showCaptcha.value = false
  pendingLoginAction.value = null
  ElMessage.info('已取消登录')
}

// 处理忘记密码
const handleForgotPassword = () => {
  showPasswordReset.value = true
}

// 组件挂载时检查登录状态并初始化表单
onMounted(() => {
  // 强制清除所有表单数据，防止email残留和浏览器自动填充
  // 使用setTimeout延迟执行，确保在浏览器自动填充之后执行
  setTimeout(() => {
    loginForm.email = ''
    loginForm.password = ''
    loginForm.remember = false
    codeForm.email = ''
    codeForm.code = ''
    codeForm.remember = false
    
    // 强制清除浏览器可能的自动填充
    const emailInputs = document.querySelectorAll('input[type="text"]')
    const passwordInputs = document.querySelectorAll('input[type="password"]')
    const codeInputs = document.querySelectorAll('input[name="verification-code"]')
    
    emailInputs.forEach(input => {
      const emailInput = input as HTMLInputElement
      emailInput.value = ''
      emailInput.defaultValue = ''
    })
    passwordInputs.forEach(input => {
      const passwordInput = input as HTMLInputElement
      passwordInput.value = ''
      passwordInput.defaultValue = ''
    })
    codeInputs.forEach(input => {
      const codeInput = input as HTMLInputElement
      codeInput.value = ''
      codeInput.defaultValue = ''
    })
    
    // 清除验证状态
    if (loginFormRef.value) {
      loginFormRef.value.clearValidate()
    }
    if (codeFormRef.value) {
      codeFormRef.value.clearValidate()
    }
  }, 100)
  
  // 检查是否已经登录
  const token = localStorage.getItem('token')
  const isLoggedIn = localStorage.getItem('isLoggedIn')
  
  if (token && isLoggedIn === 'true') {
    // 如果已经登录，尝试验证token有效性
    authStore.fetchUserProfile().then((result) => {
      if (result.success) {
        // token有效，直接跳转到dashboard
        ElMessage.success('您已登录，正在跳转...')
        const redirect = router.currentRoute.value.query.redirect as string
        router.push(redirect || '/dashboard')
      } else {
        // token无效，清除本地存储
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        localStorage.removeItem('userProfile')
        localStorage.removeItem('isLoggedIn')
        authStore.logout()
      }
    }).catch((error) => {
      console.error('验证登录状态失败:', error)
      // token验证失败，清除本地存储
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('userProfile')
      localStorage.removeItem('isLoggedIn')
      authStore.logout()
    })
  }
})
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #1e3c72 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

/* 背景装饰 - 简化版本 */
.background-decoration {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
  animation: none;
}

.circle-1 {
  width: 150px;
  height: 150px;
  top: 15%;
  left: 15%;
}

.circle-2 {
  width: 100px;
  height: 100px;
  top: 65%;
  right: 20%;
}

.circle-3 {
  width: 80px;
  height: 80px;
  bottom: 25%;
  left: 25%;
}

/* 主要内容区域 */
.login-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  max-width: 1200px;
  width: 100%;
  height: 700px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  position: relative;
  z-index: 2;
  margin: 2rem;
}

/* 左侧信息展示区 */
.info-section {
  background: url('/log in.png') center/cover no-repeat;
  padding: 3rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  color: white;
}

.logo-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 2rem;
}

.logo-icon {
  width: 60px;
  height: 60px;
}

.detection-logo {
  width: 100%;
  height: 100%;
}

.project-name {
  font-size: 3.5rem;
  font-weight: 400;
  font-family: 'KaiTi', '楷体', '行楷', serif;
  color: #E6F7FF;
  margin: 0;
  letter-spacing: 3px;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.5);
  position: relative;
}

.main-title {
  margin-bottom: 3rem;
}

.main-title h2 {
  font-size: 2.8rem;
  font-weight: 700;
  color: #FFFFFF;
  margin: 0;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  letter-spacing: 1px;
  position: relative;
}

.features-list {
  margin-bottom: 3rem;
}

.feature-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.2rem;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    transition: all 0.3s ease;
    position: relative;
    font-size: 1.1rem;
    font-weight: 500;
    color: #FFFFFF;
    letter-spacing: 0.3px;
  }

.feature-item:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.check-icon {
  width: 28px;
  height: 28px;
  background: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  border: none;
  position: relative;
}

.feature-item:hover .check-icon {
  background: none;
  border: none;
  transform: scale(1.05);
}

.decoration-pattern {
  position: absolute;
  bottom: 2rem;
  right: 2rem;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.5rem;
  opacity: 0.3;
}

.dot {
  width: 8px;
  height: 8px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 50%;
}

/* 右侧表单区 */
.form-section {
  padding: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
}

.form-container {
  width: 100%;
  max-width: 400px;
}

/* 返回首页链接样式 */
.back-home-link {
  margin-bottom: 1.5rem;
  text-align: left;
}

.home-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: #666;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  padding: 0.5rem 0;
}

.home-link:hover {
  color: #2a5298;
  transform: translateX(-2px);
}

.home-icon {
  font-size: 16px;
  transition: transform 0.3s ease;
}

.home-link:hover .home-icon {
  transform: translateX(-2px);
}

/* 登录选项卡样式 */
.login-tabs {
  display: flex;
  margin-bottom: 2rem;
  position: relative;
  background: transparent;
  border-radius: 8px;
  padding: 4px;
  box-shadow: none;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 0;
  position: relative;
  z-index: 1;
  border-radius: 6px;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  background: transparent;
  outline: none;
  user-select: none;
}

.tab-item:first-child {
  position: relative;
}

.tab-item:first-child::after {
  content: '';
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  height: 60%;
  width: 1px;
  background: #bdbdbd;
  z-index: 2;
  opacity: 0.6;
  transition: opacity 0.25s ease;
}

.tab-text {
  display: block;
  padding: 12px 20px;
  cursor: pointer;
  font-weight: 500;
  color: #666;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 6px;
  position: relative;
  z-index: 3;
}

.tab-item.active {
  background: transparent;
  box-shadow: none;
}

.tab-item.active .tab-text {
  color: #2a5298;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(42, 82, 152, 0.1);
}

.tab-item.active:first-child::after {
  opacity: 1;
}

.login-form {
  margin-bottom: 1.5rem;
}

/* 统一输入容器样式 */
.unified-input-container {
  background: #ffffff;
  border: 2px solid #e4e7ed;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 1.5rem;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  position: relative;
}

.unified-input-container:hover {
  border-color: #c0c4cc;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.unified-input-container:focus-within {
  border-color: #c0c4cc;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.unified-input-container.transitioning {
  pointer-events: none;
}

.input-section {
  padding: 0;
}

.email-section {
  padding-bottom: 2px;
}

.password-section {
  padding-top: 2px;
}

.unified-input {
  border: none !important;
}

/* 分隔线样式 - 黄金比例优化 */
.input-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent 10%, #e4e7ed 50%, transparent 90%);
  margin: 0 24px;
  opacity: 0.5;
  position: relative;
}

.input-divider::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 4px;
  height: 4px;
  background: #e4e7ed;
  border-radius: 50%;
  opacity: 0.3;
}

/* 验证码输入组样式 */
.code-input-wrapper {
  display: flex;
  align-items: stretch;
  gap: 0;
  min-height: 48px;
}

.code-input {
  flex: 1;
  border-right: 1px solid #e4e7ed !important;
}

.code-button {
  height: 48px;
  padding: 0 18px;
  border: none;
  background: #f5f5f5;
  color: #666;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  transition: all 0.25s ease;
  cursor: pointer;
  border-radius: 0;
  min-width: 95px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.code-button:hover:not(:disabled) {
  background: #e8e8e8;
  color: #333;
}

.code-button:disabled {
  background: #f0f0f0;
  color: #c0c4cc;
  cursor: not-allowed;
  transition: none;
}

.form-options {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-left: 4px;
}

/* 隐藏验证用的表单项 */
.hidden-form-item {
  margin-bottom: 0 !important;
  height: 0;
  overflow: hidden;
}

.login-button {
  width: 100%;
  height: 50px;
  background: linear-gradient(135deg, #2a5298 0%, #1e3c72 100%);
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.login-button:hover {
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  box-shadow: 0 4px 12px rgba(42, 82, 152, 0.2);
}

.form-footer {
  margin-bottom: 2rem;
}

.footer-links {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.link {
  color: #666;
  text-decoration: none;
  font-size: 14px;
  transition: color 0.3s ease;
}

.link:hover {
  color: #2a5298;
}

.register-link {
  color: #2a5298;
  font-weight: 500;
}

.social-login {
  margin-bottom: 2rem;
}

.divider {
  text-align: center;
  margin-bottom: 1rem;
  position: relative;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: #e8e8e8;
  z-index: 1;
}

.divider span {
  background: white;
  padding: 0 1rem;
  color: #999;
  font-size: 14px;
  position: relative;
  z-index: 2;
}

.social-icons {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.social-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid #e8e8e8;
}

.social-icon:hover {
  border-color: #c0c4cc;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.social-icon .icon {
  width: 20px;
  height: 20px;
}

.gitee {
  border-color: #C71D23;
}

.github {
  border-color: #24292e;
}

.terms {
  text-align: center;
}

.terms p {
  color: #999;
  font-size: 12px;
  margin: 0;
}

.terms-link {
  color: #2a5298;
  text-decoration: none;
}

.terms-link:hover {
  text-decoration: underline;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .login-content {
    grid-template-columns: 1fr;
    margin: 1rem;
    max-width: 500px;
  }
  
  .info-section {
    padding: 2rem;
    text-align: center;
  }
  
  .main-title h2 {
    font-size: 1.8rem;
  }
  
  .project-name {
    font-size: 2rem;
  }
  
  .form-section {
    padding: 2rem;
  }
  
  .decoration-pattern {
    display: none;
  }
  
  .login-tabs {
    margin-bottom: 1.5rem;
    padding: 3px;
  }
  
  .tab-text {
    padding: 10px 16px;
    font-size: 14px;
  }
  
  .unified-input-container {
    margin-bottom: 1.2rem;
  }
  
  .input-divider {
    margin: 0 16px;
  }
  
  /* 移动端返回首页链接样式 */
  .back-home-link {
    margin-bottom: 1.2rem;
  }
  
  .home-link {
    font-size: 13px;
    padding: 0.6rem 0;
  }
  
  .home-icon {
    font-size: 15px;
  }
}
  
  .input-divider::before {
    width: 3px;
    height: 3px;
  }
  
  .code-input-wrapper {
    min-height: 44px;
  }
  
  .code-button {
    height: 44px;
    padding: 0 14px;
    min-width: 85px;
    font-size: 13px;
    background: #f5f5f5;
    color: #666;
    transition: all 0.25s ease;
  }
  
  .code-button:hover:not(:disabled) {
    background: #e8e8e8;
    color: #333;
  }
  
  .code-button:disabled {
    background: #f0f0f0;
    color: #c0c4cc;
    transition: none;
  }

@media (max-width: 480px) {
  .login-content {
    margin: 0.5rem;
  }
  
  .info-section,
  .form-section {
    padding: 1.5rem;
  }
  
  .main-title h2 {
    font-size: 1.5rem;
  }
  
  .project-name {
    font-size: 1.8rem;
  }
  
  .login-tabs {
    margin-bottom: 1.2rem;
    padding: 2px;
  }
  
  .tab-text {
    padding: 8px 12px;
    font-size: 13px;
  }
  
  .tab-item:first-child::after {
    height: 50%;
  }
  
  .code-input-wrapper {
    min-height: 40px;
  }
  
  .code-button {
    height: 40px;
    padding: 0 12px;
    min-width: 75px;
    font-size: 12px;
    background: #f5f5f5;
    color: #666;
    transition: all 0.25s ease;
  }
  
  .code-button:hover:not(:disabled) {
    background: #e8e8e8;
    color: #333;
  }
  
  .code-button:disabled {
    background: #f0f0f0;
    color: #c0c4cc;
    transition: none;
  }
  
  .input-divider {
    margin: 0 16px;
  }
}
</style>