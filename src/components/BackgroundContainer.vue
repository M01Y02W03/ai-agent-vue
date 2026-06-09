<template>
  <div class="background-container">
    <!-- 动态背景层 -->
    <div class="background-layers">
      <!-- 主渐变背景 -->
      <div class="gradient-bg"></div>

      <!-- 粒子动画层 -->
      <div class="particles-layer">
        <div
          v-for="particle in particles"
          :key="particle.id"
          class="particle"
          :style="particle.style"
        ></div>
      </div>

      <!-- 几何图形装饰 -->
      <div class="geometric-shapes" aria-hidden="true">
        <div class="shape shape-circle-1"></div>
        <div class="shape shape-circle-2"></div>
        <div class="shape shape-circle-3"></div>
        <div class="lightning-effect"></div>
      </div>

      <!-- 光效遮罩 -->
      <div class="light-overlay"></div>

      <!-- 区域渐变效果层 -->
      <div class="area-gradients">
        <!-- 顶部区域渐变 -->
        <div class="top-area-gradient"></div>

        <!-- 中部区域渐变 -->
        <div class="middle-area-gradient"></div>

        <!-- 底部区域渐变 -->
        <div class="bottom-area-gradient"></div>

        <!-- 动态光晕效果 -->
        <div class="dynamic-glow glow-1"></div>
        <div class="dynamic-glow glow-2"></div>
        <div class="dynamic-glow glow-3"></div>

        <!-- 边缘柔化渐变 -->
        <div class="edge-softening"></div>
      </div>
    </div>

    <!-- 内容插槽 -->
    <div class="content-wrapper">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Particle {
  id: number
  style: {
    left: string
    top: string
    animationDelay: string
    animationDuration: string
    opacity: number
  }
}

// 粒子系统
const particles = ref<Particle[]>([])

// 生成粒子
const generateParticles = () => {
  const particleCount = 50
  const newParticles: Particle[] = []

  for (let i = 0; i < particleCount; i++) {
    newParticles.push({
      id: i,
      style: {
        left: Math.random() * 100 + '%',
        top: Math.random() * 100 + '%',
        animationDelay: Math.random() * 10 + 's',
        animationDuration: (Math.random() * 20 + 10) + 's',
        opacity: Math.random() * 0.8 + 0.2
      }
    })
  }

  particles.value = newParticles
}

// 组件挂载时生成粒子
onMounted(() => {
  generateParticles()
})
</script>

<style scoped>
/* CSS 变量定义 */
:root {
  --bg-primary: #2E2E2E; /* 深灰色背景 */
  --bg-secondary: #3A3A3A; /* 稍微浅一点的灰色 */
  --accent-blue: #4A90E2; /* 柔和的蓝色 */
  --text-primary: #FFFFFF; /* 白色文本 */
  --text-secondary: rgba(255, 255, 255, 0.7); /* 半透明白色文本 */
  --glass-bg: rgba(255, 255, 255, 0.1); /* 玻璃效果背景 */
}

.background-container {
  position: relative;
  min-height: 100vh;
  width: 100%;
  overflow: hidden;
  background: var(--bg-primary);
}

/* 背景层系统 */
.background-layers {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  pointer-events: none;
}

/* 主渐变背景 */
.gradient-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
  animation: gradientShift 20s ease-in-out infinite;
}

@keyframes gradientShift {
  0%, 100% {
    background-position: 0 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

/* 粒子动画层 */
.particles-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.particle {
  position: absolute;
  width: 2px;
  height: 2px;
  background: var(--accent-blue);
  border-radius: 50%;
  animation: particleFloat linear infinite;
}

@keyframes particleFloat {
  0% {
    transform: translateY(100vh) rotate(0deg);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateY(-100px) rotate(360deg);
    opacity: 0;
  }
}

/* 几何图形装饰 */
.geometric-shapes {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.shape {
  position: absolute;
  border-radius: 50%;
  background: var(--accent-blue);
  opacity: 0.05;
  animation: shapeFloat 15s ease-in-out infinite;
}

.shape-circle-1 {
  width: 300px;
  height: 300px;
  top: 10%;
  left: 10%;
  animation-delay: 0s;
}

.shape-circle-2 {
  width: 200px;
  height: 200px;
  top: 60%;
  right: 15%;
  animation-delay: 5s;
}

.shape-circle-3 {
  width: 150px;
  height: 150px;
  bottom: 20%;
  left: 20%;
  animation-delay: 10s;
}

@keyframes shapeFloat {
  0%, 100% {
    transform: translateY(0px) rotate(0deg) scale(1);
    opacity: 0.05;
  }
  50% {
    transform: translateY(-30px) rotate(180deg) scale(1.1);
    opacity: 0.1;
  }
}

/* 光效遮罩 */
.light-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.1);
  animation: lightPulse 10s ease-in-out infinite;
}

@keyframes lightPulse {
  0%, 100% {
    opacity: 0.4;
  }
  50% {
    opacity: 0.7;
  }
}

/* 区域渐变效果层 */
.area-gradients {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.top-area-gradient {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.05) 50%, transparent 100%);
  animation: unifiedGradientFlow 40s ease-in-out infinite;
}

@keyframes unifiedGradientFlow {
  0%, 100% {
    transform: translateY(0) scale(1);
    opacity: 0.8;
  }
  50% {
    transform: translateY(5px) scale(1.01);
    opacity: 1;
  }
}

/* 动态光晕效果 */
.dynamic-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(30px);
  animation: glowFloat 15s ease-in-out infinite;
}

.glow-1 {
  width: 200px;
  height: 200px;
  top: 15%;
  left: 10%;
  background: rgba(74, 144, 226, 0.15);
}

.glow-2 {
  width: 150px;
  height: 150px;
  top: 50%;
  right: 15%;
  background: rgba(74, 144, 226, 0.1);
}

.glow-3 {
  width: 180px;
  height: 180px;
  bottom: 20%;
  left: 60%;
  background: rgba(74, 144, 226, 0.12);
}

@keyframes glowFloat {
  0%, 100% {
    transform: translate(0, 0) scale(1);
    opacity: 0.6;
  }
  50% {
    transform: translate(10px, -10px) scale(1.05);
    opacity: 1;
  }
}

.edge-softening {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background:
      linear-gradient(to right, rgba(0, 0, 0, 0.05) 0%, transparent 5%, transparent 95%, rgba(0, 0, 0, 0.05) 100%),
      linear-gradient(to bottom, rgba(0, 0, 0, 0.05) 0%, transparent 3%, transparent 97%, rgba(0, 0, 0, 0.05) 100%);
}
</style>