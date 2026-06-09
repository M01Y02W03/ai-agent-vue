import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { ElMessage } from 'element-plus'
import Home from '../views/home/Home.vue'
import Login from '../views/login/Login.vue'
import Register from '../views/register/Register.vue'
import Dashboard from '../views/dashboard/Dashboard.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/register',
    name: 'Register',
    component: Register
  },
  {
    path: '/oauth2/callback',
    name: 'OAuth2Callback',
    component: () => import('../views/auth/OAuth2Callback.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/oauth2/callback/github',
    name: 'GitHubOAuth2Callback',
    component: () => import('../views/auth/OAuth2Callback.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/oauth2/callback/gitee',
    name: 'GiteeOAuth2Callback',
    component: () => import('../views/auth/OAuth2Callback.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    meta: {
      title: '智识控制台',
      description: 'AI驱动的目标检测平台控制台',
      requiresAuth: true
    }
  },
  {
    path: '/policy',
    name: 'PolicyTerms',
    component: () => import('../views/policy/PolicyTerms.vue'),
    meta: {
      title: '用户协议与隐私政策',
      description: '查看服务条款和隐私政策',
      requiresAuth: false
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()
  
  // 检查是否需要认证
  if (to.meta.requiresAuth) {
    // 检查是否有token
    const token = localStorage.getItem('token')
    if (!token || !authStore.isAuthenticated) {
      // 未登录，显示提示信息并重定向到登录页
      ElMessage.warning('请先登录后再访问该页面')
      next({ name: 'Login', query: { redirect: to.fullPath } })
      return
    }
    
    // 如果有token但没有用户信息，尝试获取用户信息来验证token有效性
    if (!authStore.user || !authStore.userProfile) {
      try {
        const result = await authStore.fetchUserProfile()
        if (!result.success) {
          // 获取用户信息失败，可能token已失效
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          localStorage.removeItem('userProfile')
          authStore.logout()
          ElMessage.warning('登录状态已过期，请重新登录')
          next({ name: 'Login', query: { redirect: to.fullPath } })
          return
        }
      } catch (error) {
        // 网络错误或其他错误，清除登录状态
        console.error('验证登录状态失败:', error)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        localStorage.removeItem('userProfile')
        authStore.logout()
        ElMessage.warning('验证登录状态失败，请重新登录')
        next({ name: 'Login', query: { redirect: to.fullPath } })
        return
      }
    }
  }
  
  if (to.name === 'Login' && authStore.isAuthenticated) {
    // 已登录用户访问登录页，重定向到控制台
    next({ name: 'Dashboard' })
  } else if (to.name === 'Home' && authStore.isAuthenticated) {
    // 已登录用户访问首页，重定向到控制台
    next({ name: 'Dashboard' })
  } else {
    next()
  }
})

export default router