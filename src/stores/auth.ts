import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getUserProfile, isNewUser, type UserProfile, type UserApiResponse } from '../api/user'

export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  mainRoleId?: number
}

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const user = ref<User | null>(null)
  const userProfile = ref<UserProfile | null>(null)
  const isLoggedIn = ref(false)
  const loading = ref(false)
  const profileLoading = ref(false)
  const profileError = ref<string | null>(null)

  // 计算属性
  const isAuthenticated = computed(() => isLoggedIn.value && user.value !== null)
  const isAdmin = computed(() => userProfile.value?.mainRoleId === 0)
  const isNewUserFlag = computed(() => {
    if (!userProfile.value) return false
    return isNewUser(userProfile.value.registerTime, userProfile.value.lastLoginTime)
  })

  // 设置用户信息（由外部登录方法调用）
  const setUser = (userData: User) => {
    user.value = userData
    isLoggedIn.value = true
    // 持久化用户状态
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem('isLoggedIn', 'true')
  }

  // 设置用户资料信息
  const setUserProfile = (profileData: UserProfile) => {
    userProfile.value = profileData
    
    // 更新基础用户信息
    if (user.value) {
      user.value = {
        ...user.value,
        id: profileData.id.toString(),
        email: profileData.email,
        name: profileData.username,
        avatar: profileData.avatar,
        mainRoleId: profileData.mainRoleId
      }
      localStorage.setItem('user', JSON.stringify(user.value))
    }
    
    // 持久化用户资料
    localStorage.setItem('userProfile', JSON.stringify(profileData))
  }

  // 获取用户资料信息
  const fetchUserProfile = async (): Promise<{ success: boolean; isNewUser: boolean; message?: string }> => {
    profileLoading.value = true
    profileError.value = null

    try {
      const response: UserApiResponse<UserProfile> = await getUserProfile()
      
      if (response.success && response.data) {
        userProfile.value = response.data
        
        // 更新基础用户信息
        if (user.value) {
          user.value = {
            ...user.value,
            id: response.data.id.toString(),
            email: response.data.email,
            name: response.data.username,
            avatar: response.data.avatar,
            mainRoleId: response.data.mainRoleId
          }
          localStorage.setItem('user', JSON.stringify(user.value))
        }
        
        // 判断是否为新用户
        const isNew = isNewUser(response.data.registerTime, response.data.lastLoginTime)
        
        // 持久化用户资料
        localStorage.setItem('userProfile', JSON.stringify(response.data))
        
        return {
          success: true,
          isNewUser: isNew
        }
      } else {
        profileError.value = response.message || '获取用户信息失败'
        return {
          success: false,
          isNewUser: false,
          message: response.message
        }
      }
    } catch (error: any) {
      profileError.value = error.message || '网络错误'
      return {
        success: false,
        isNewUser: false,
        message: error.message
      }
    } finally {
      profileLoading.value = false
    }
  }

  // 登出方法
  const logout = () => {
    user.value = null
    userProfile.value = null
    isLoggedIn.value = false
    profileError.value = null
    localStorage.removeItem('user')
    localStorage.removeItem('userProfile')
    localStorage.removeItem('isLoggedIn')
    localStorage.removeItem('token')
  }

  // 初始化用户状态
  const initAuth = () => {
    const savedUser = localStorage.getItem('user')
    const savedUserProfile = localStorage.getItem('userProfile')
    const savedLoginStatus = localStorage.getItem('isLoggedIn')
    
    if (savedUser && savedLoginStatus === 'true') {
      user.value = JSON.parse(savedUser)
      isLoggedIn.value = true
      
      if (savedUserProfile) {
        userProfile.value = JSON.parse(savedUserProfile)
      }
    }
  }

  // 清除用户资料错误
  const clearProfileError = () => {
    profileError.value = null
  }

  return {
    user,
    userProfile,
    isLoggedIn,
    isAuthenticated,
    isAdmin,
    isNewUserFlag,
    loading,
    profileLoading,
    profileError,
    setUser,
    setUserProfile,
    fetchUserProfile,
    logout,
    initAuth,
    clearProfileError
  }
})