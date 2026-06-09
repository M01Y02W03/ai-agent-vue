<template>
  <div class="register-container">
    <!-- 背景装饰 -->
    <div class="background-decoration">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
      <div class="circle circle-3"></div>
    </div>

    <div class="register-content">
      <!-- 左侧信息展示区 -->
      <div class="info-section">
        <!-- 只保留背景图片，移除所有文字内容 -->
      </div>

      <!-- 右侧注册表单区 -->
      <div class="form-section">
        <div class="form-container">
          <!-- 返回首页链接 -->
          <div class="back-home-link">
            <router-link to="/" class="home-link" aria-label="返回首页">
              <el-icon class="home-icon"><ArrowLeft /></el-icon>
              <span>返回首页</span>
            </router-link>
          </div>
          
          <!-- 注册标题 -->
          <div class="register-header">
            <h2>创建账户</h2>
          </div>

          <!-- 注册表单 -->
          <el-form 
            ref="registerFormRef" 
            :model="registerForm" 
            :rules="registerRules" 
            class="register-form"
            @submit.prevent="handleRegister"
          >
            <!-- 统一输入区域 -->
            <div class="unified-input-container" mainRoleId="group" aria-label="注册信息输入区域">
              <!-- 用户名输入框 -->
              <div class="input-section">
                <el-input
                   v-model="registerForm.username"
                   placeholder="用户名"
                   size="large"
                   class="unified-input"
                   aria-label="用户名"
                 >
                  <template #prefix>
                    <el-icon><User /></el-icon>
                  </template>
                </el-input>
              </div>
              
              <!-- 分隔线 -->
              <div class="input-divider"></div>
              
              <!-- 邮箱输入框 -->
              <div class="input-section">
                <el-input
                   v-model="registerForm.email"
                   placeholder="邮箱"
                   size="large"
                   class="unified-input"
                   aria-label="邮箱地址"
                 >
                   <template #prefix>
                     <el-icon><Message /></el-icon>
                   </template>
                 </el-input>
               </div>
               
               <!-- 分隔线 -->
               <div class="input-divider"></div>
               
               <!-- 密码输入框 -->
               <div class="input-section">
                 <el-input
                   v-model="registerForm.password"
                   type="password"
                   placeholder="密码"
                   size="large"
                   class="unified-input"
                   show-password
                   aria-label="密码"
                 >
                   <template #prefix>
                     <el-icon><Lock /></el-icon>
                   </template>
                 </el-input>
               </div>
               
               <!-- 分隔线 -->
               <div class="input-divider"></div>
               
               <!-- 确认密码输入框 -->
               <div class="input-section">
                 <el-input
                   v-model="registerForm.confirmPassword"
                   type="password"
                   placeholder="确认密码"
                   size="large"
                   class="unified-input"
                   show-password
                   aria-label="确认密码"
                 >
                  <template #prefix>
                    <el-icon><Lock /></el-icon>
                  </template>
                </el-input>
              </div>
            </div>
            
            <!-- 隐藏验证用的表单项 -->
            <el-form-item prop="username" class="hidden-form-item">
              <el-input v-model="registerForm.username" style="display: none;" />
            </el-form-item>
            <el-form-item prop="email" class="hidden-form-item">
              <el-input v-model="registerForm.email" style="display: none;" />
            </el-form-item>
            <el-form-item prop="password" class="hidden-form-item">
              <el-input v-model="registerForm.password" style="display: none;" />
            </el-form-item>
            <el-form-item prop="confirmPassword" class="hidden-form-item">
              <el-input v-model="registerForm.confirmPassword" style="display: none;" />
            </el-form-item>
            
            <!-- 同意条款 -->
            <el-form-item prop="agree" class="form-item">
              <div class="form-options">
                <el-checkbox v-model="registerForm.agree">
                  我已阅读并同意 <router-link to="/policy?source=register" class="terms-link">用户协议</router-link> 和 <router-link to="/policy?source=register" class="terms-link">隐私政策</router-link>
                </el-checkbox>
              </div>
            </el-form-item>

            <!-- 注册按钮 -->
            <el-form-item>
              <el-button 
                type="primary" 
                size="large" 
                class="register-button"
                :loading="loading"
                @click="handleRegister"
              >
                立即注册
              </el-button>
            </el-form-item>
          </el-form>

          <!-- 表单底部链接 -->
          <div class="form-footer">
            <div class="footer-links">
              <span>已有账号？</span>
              <a href="#" class="link login-link" @click="router.push('/login')">去登录</a>
            </div>
          </div>

          <!-- 其他注册方式 -->
          <div class="social-login">
            <div class="divider">
              <span>其他注册方式</span>
            </div>
            <div class="social-icons">
              <div class="social-icon gitee" title="使用Gitee注册" @click="handleGiteeLogin">
                <img src="/src/assets/svg/gitee.svg" alt="Gitee" class="icon" />
              </div>
              <div class="social-icon github" title="使用GitHub注册" @click="handleGitHubLogin">
                <img src="/src/assets/svg/github.svg" alt="GitHub" class="icon" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import {Message, Lock, User, ArrowLeft} from '@element-plus/icons-vue'
import { doRegister } from './register'
import { initiateGiteeOAuth2Login, initiateGitHubOAuth2Login } from '../login/auth2'

const router = useRouter()
const registerFormRef = ref<FormInstance>()
const loading = ref(false)

// 注册表单数据
const registerForm = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  agree: false
})

// 自定义验证函数
const validateConfirmPassword = (_rule: any, value: any, callback: any) => {
  if (value === '') {
    callback(new Error('请确认密码'))
  } else if (value !== registerForm.password) {
    callback(new Error('两次密码输入不一致'))
  } else {
    callback()
  }
}

const validateAgree = (_rule: any, value: any, callback: any) => {
  if (!value) {
    // 使用警告类型而不是错误类型
    ElMessage.warning('请同意用户协议和隐私政策！')
  } else {
    callback()
  }
}

// 表单验证规则
const registerRules: FormRules = {
  username: [
    { required: true, message: '请填写用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度为2-20个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请填写邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请填写密码', trigger: 'blur' },
    { min: 6, message: '密码至少需要6位字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, validator: validateConfirmPassword, trigger: 'blur' }
  ],
  agree: [
    { required: true, validator: validateAgree, trigger: 'change' }
  ]
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

// 注册处理
const handleRegister = async () => {
  if (!registerFormRef.value) return
  
  try {
    // 表单验证
    await registerFormRef.value.validate()
    
    loading.value = true
    
    try {
      const result = await doRegister(
        registerForm.username,
        registerForm.email,
        registerForm.password
      )
      
      if (result.success) {
        ElMessage.success('注册成功！请前往登录')
        // 跳转到登录页面
        await router.push('/login')
      } else {
        // 优先显示后端返回的错误信息
        ElMessage.error(result.message || '注册失败')
      }
    } catch (registerError: any) {
      console.error('注册请求失败:', registerError)
      // 优先显示后端返回的具体错误信息
      const errorMessage = registerError?.message || '注册失败，请重试'
      ElMessage.error(errorMessage)
    } finally {
      loading.value = false
    }
    
  } catch (validationError: any) {
    // 表单验证失败，不执行注册请求
    console.log('表单验证失败:', validationError)
    
    // 提取并显示验证错误信息
    if (validationError && typeof validationError === 'object') {
      const errorMessages: string[] = []
      
      // 遍历验证错误对象，提取错误信息
      Object.keys(validationError).forEach(field => {
        const fieldErrors = (validationError as Record<string, any>)[field]
        if (Array.isArray(fieldErrors) && fieldErrors.length > 0) {
          // 取第一个错误信息
          const firstError = fieldErrors[0]
          if (firstError && firstError.message) {
            errorMessages.push(firstError.message)
          }
        }
      })
      
      // 显示第一个验证错误信息
      if (errorMessages.length > 0) {
        ElMessage.error(errorMessages[0])
      } else {
        ElMessage.error('请检查输入信息是否正确')
      }
    } else {
      ElMessage.error('请检查输入信息是否正确')
    }
  }
}
</script>

<style scoped>
.register-container {
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
.register-content {
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
  background: url('/sign up.png') center/cover no-repeat;
  padding: 3rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  color: #1a1a1a;
}

/* 移除模糊效果，只展示背景图片 */



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

.register-header {
  text-align: center;
  margin-bottom: 2rem;
}

.register-header h2 {
  font-size: 2rem;
  font-weight: 700;
  color: #2a5298;
  margin-bottom: 0.5rem;
}

.register-header p {
  color: #666;
  font-size: 14px;
}

.register-form {
  margin-bottom: 2rem;
}



/* 统一输入容器样式 - 与登录页面保持一致 */
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

.unified-input {
  border: none !important;
  width: 100%;
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

.input-section {
  padding: 0;
}

/* 隐藏验证用的表单项 */
.hidden-form-item {
  margin-bottom: 0 !important;
  height: 0;
  overflow: hidden;
}

.form-options {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding-left: 4px;
}

.register-button {
  width: 100%;
  height: 50px;
  background: linear-gradient(135deg, #2a5298 0%, #1e3c72 100%);
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.register-button:hover {
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
  width: 100%;
}

.footer-links span {
  color: #666;
  font-size: 14px;
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

.login-link {
  color: #2a5298;
  font-weight: 500;
}

.terms-link {
  color: #2a5298;
  text-decoration: none;
}

.terms-link:hover {
  text-decoration: underline;
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

/* 响应式设计 */
@media (max-width: 768px) {
  .register-content {
    grid-template-columns: 1fr;
    margin: 1rem;
    max-width: 500px;
  }
  
  .info-section {
    padding: 2rem;
    text-align: center;
  }
  
  .form-section {
    padding: 2rem;
  }
  
  .register-header h2 {
    font-size: 1.5rem;
  }
  
  .unified-input-container {
    margin-bottom: 1.2rem;
  }
  
  .input-divider {
    margin: 0 20px;
  }
  
  .input-divider::before {
    width: 3px;
    height: 3px;
  }
}

@media (max-width: 480px) {
  .register-content {
    margin: 0.5rem;
  }
  
  .info-section,
  .form-section {
    padding: 1.5rem;
  }
  
  .register-header h2 {
    font-size: 1.3rem;
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
</style>