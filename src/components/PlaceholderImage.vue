<template>
  <div 
    class="placeholder-image" 
    :style="{
      width: width + 'px',
      height: height + 'px',
      background: gradient
    }"
  >
    <div class="placeholder-content">
      <div class="placeholder-icon">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
        </svg>
      </div>
      <div class="placeholder-text">
        <div class="size-text">{{ width }} × {{ height }}</div>
        <div class="label-text" v-if="label">{{ label }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  width?: number
  height?: number
  label?: string
  color?: string
}

const props = withDefaults(defineProps<Props>(), {
  width: 400,
  height: 300,
  label: '',
  color: '#2A5CAA'
})

const gradient = `linear-gradient(135deg, ${props.color}20, ${props.color}40)`
</script>

<style scoped>
.placeholder-image {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px dashed rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.8);
  font-family: 'Inter', sans-serif;
}

.placeholder-content {
  text-align: center;
  padding: 1rem;
}

.placeholder-icon {
  width: 48px;
  height: 48px;
  margin: 0 auto 1rem;
  opacity: 0.6;
}

.placeholder-icon svg {
  width: 100%;
  height: 100%;
}

.size-text {
  font-size: 1rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.label-text {
  font-size: 0.9rem;
  opacity: 0.8;
}
</style>