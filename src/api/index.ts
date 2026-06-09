import axios from 'axios'

// API 基础配置
const API_BASE_URL = __API_BASE_URL__

// 模拟API响应
export const mockApi = {
  // 用户认证相关
  auth: {
    // 注册功能已移至 register.ts 文件处理
  },
  
  // YOLO检测相关
  detection: {
    detect: async (imageFile: File | string) => {
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // 基本验证
      if (!imageFile) {
        return {
          success: false,
          error: '请提供有效的图片文件'
        }
      }
      
      // 模拟根据文件类型返回不同结果
      const isFile = imageFile instanceof File
      const fileName = isFile ? imageFile.name : 'demo-image'
      
      return {
        success: true,
        data: {
          fileName,
          boxes: [
            {
              id: 1,
              label: 'person',
              confidence: 0.95,
              x: 100,
              y: 150,
              width: 200,
              height: 300
            },
            {
              id: 2,
              label: 'car',
              confidence: 0.87,
              x: 300,
              y: 200,
              width: 150,
              height: 100
            }
          ],
          processingTime: 45,
          modelVersion: 'YOLOv8s'
        }
      }
    },
    
    getModels: async () => {
      return {
        success: true,
        data: [
          { id: 'yolov8n', name: 'YOLOv8 Nano', size: '6.2MB', speed: '80ms' },
          { id: 'yolov8s', name: 'YOLOv8 Small', size: '21.5MB', speed: '120ms' },
          { id: 'yolov8m', name: 'YOLOv8 Medium', size: '49.7MB', speed: '200ms' },
          { id: 'yolov8l', name: 'YOLOv8 Large', size: '83.7MB', speed: '300ms' },
          { id: 'yolov8x', name: 'YOLOv8 XLarge', size: '136.7MB', speed: '450ms' }
        ]
      }
    }
  },
  
  // 统计数据
  stats: {
    getGitHubStats: async () => {
      return {
        success: true,
        data: {
          stars: 98654,
          forks: 23456,
          contributors: 1234,
          downloads: 5678901
        }
      }
    },
    
    getPerformanceStats: async () => {
      return {
        success: true,
        data: {
          fps: 120,
          accuracy: 99.7,
          latency: 8.5,
          throughput: 1500
        }
      }
    }
  },
  
  // 订阅相关
  subscription: {
    subscribe: async (emailAddress: string) => {
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // 基本邮箱验证
      if (!emailAddress || !emailAddress.includes('@')) {
        return {
          success: false,
          error: '请提供有效的邮箱地址'
        }
      }
      
      return {
        success: true,
        data: {
          message: `订阅成功！我们会定期向 ${emailAddress} 发送最新技术动态。`
        }
      }
    }
  },
  
  // 作者信息相关
  author: {
    getAuthorInfo: async () => {
      try {
        const response = await axios.get(API_BASE_URL + '/home/authorInfo')
        return {
          success: true,
          data: response.data.data
        }
      } catch (error) {
        console.error('获取作者信息失败:', error)
        return {
          success: false,
          error: '无法连接到服务，请检查网络连接'
        }
      }
    }
  },

  // 提交记录相关
  commits: {
    getCommits: async (repoId: number) => {
      try {
        const response = await axios.get(`${API_BASE_URL}/home/commits`, {
          params: { repoId }
        })
        return {
          success: true,
          data: response.data.data
        }
      } catch (error) {
        console.error('获取提交记录失败:', error)
        return {
          success: false,
          error: '无法连接到服务，请检查网络连接'
        }
      }
    }
  }
}

// 当前使用模拟API，后续可以切换到真实API
export const api = mockApi