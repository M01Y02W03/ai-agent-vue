import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { cwd } from 'node:process'

// https://vite.dev/config/ 处理跨域问题
export default defineConfig(({ command, mode }) => {
    // 根据当前工作目录和模式加载环境变量
    const env = loadEnv(mode, cwd())
    const isBuild = command === 'build'
    
    // 服务器配置
    const serverPort = parseInt(env.VITE_DEV_SERVER_PORT || '3000')
    const serverHost = env.VITE_DEV_SERVER_HOST || 'localhost'
    
    // 自动生成回调地址（如果环境变量中没有明确指定）
    const defaultCallbackUrl = `http://${serverHost}:${serverPort}`
    const oauthCallbackBaseUrl = env.VITE_OAUTH_CALLBACK_BASE_URL || defaultCallbackUrl
    
    return {
        plugins: [vue()],
        define: {
            // 定义全局常量，在运行时替换
            __API_BASE_URL__: JSON.stringify(env.VITE_API_BASE_URL || 'http://127.0.0.1:8086'),
            __OAUTH_CALLBACK_BASE_URL__: JSON.stringify(oauthCallbackBaseUrl),
            __DEV_SERVER_PORT__: JSON.stringify(serverPort)
        },
        server: {
            port: serverPort,
            open: true,
            host: true,
            proxy: {
                // 后端 API 代理配置
                '/api': {
                    target: env.VITE_API_BASE_URL || 'http://127.0.0.1:8086',
                    changeOrigin: true,
                    rewrite: (path) => path.replace(/^\/api/, '')
                },
                // OSS 代理配置（替换为你的阿里云 OSS 地址）
                '/oss': {
                    target: 'https://your-bucket.oss-cn-chengdu.aliyuncs.com',
                    changeOrigin: true,
                    rewrite: (path) => path.replace(/^\/oss/, '')
                }
            }
        },
        build: {
            // 生产环境构建配置
            outDir: 'dist',
            sourcemap: !isBuild,
            minify: isBuild ? 'esbuild' : false
        }
    }
})