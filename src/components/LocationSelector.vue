<template>
  <div class="location-selector">
    <el-cascader
      v-model="selectedLocation"
      :options="cascaderOptions"
      :props="cascaderProps"
      placeholder="请选择省份/城市/区县"
      clearable
      filterable
      :loading="loading"
      :disabled="disabled"
      @change="handleLocationChange"
      class="location-cascader"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import type { CascaderOption } from 'element-plus'
import {
  getProvinces,
  getCitiesByProvinceId,
  getAreasByCityId,
  type ProvinceVo,
  type CityVo,
  type AreaVo
} from '../api/location'

// Props
interface Props {
  modelValue?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  disabled: false
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: string]
  'change': [location: { province: string; city: string; area: string; fullLocation: string }]
}>()

// 响应式数据
const selectedLocation = ref<string[]>([])
const cascaderOptions = ref<CascaderOption[]>([])
const loading = ref(false)
const isInternalUpdate = ref(false) // 防止内部更新触发循环

// Cascader 配置
const cascaderProps = {
  value: 'id',
  label: 'name',
  children: 'children',
  lazy: true,
  lazyLoad: async (node: any, resolve: any) => {
    const { level, value } = node
    
    try {
      if (level === 0) {
        // 加载省份
        const response = await getProvinces()
        if (response.success) {
          const provinces = response.data.map((province: ProvinceVo) => ({
            id: province.provinceId,
            name: province.province,
            leaf: false
          }))
          resolve(provinces)
        } else {
          ElMessage.error(response.message || '获取省份列表失败')
          resolve([])
        }
      } else if (level === 1) {
        // 加载城市
        const response = await getCitiesByProvinceId(value)
        if (response.success) {
          const cities = response.data.map((city: CityVo) => ({
            id: city.cityId,
            name: city.city,
            leaf: false
          }))
          resolve(cities)
        } else {
          ElMessage.error(response.message || '获取城市列表失败')
          resolve([])
        }
      } else if (level === 2) {
        // 加载区县
        const response = await getAreasByCityId(value)
        if (response.success) {
          const areas = response.data.map((area: AreaVo) => ({
            id: area.areaId,
            name: area.area,
            leaf: true
          }))
          resolve(areas)
        } else {
          ElMessage.error(response.message || '获取区县列表失败')
          resolve([])
        }
      }
    } catch (error) {
      console.error('加载数据失败:', error)
      ElMessage.error('加载数据失败')
      resolve([])
    }
  }
}

// 处理位置变化
const handleLocationChange = async (value: string[]) => {
  // 如果是内部更新，不触发事件
  if (isInternalUpdate.value) {
    return
  }

  if (!value || value.length === 0) {
    emit('update:modelValue', '')
    emit('change', {
      province: '',
      city: '',
      area: '',
      fullLocation: ''
    })
    return
  }

  try {
    // 通过API获取选中的文本标签
    const labels: string[] = []
    
    if (value.length >= 1) {
      // 获取省份名称
      const provincesResponse = await getProvinces()
      if (provincesResponse.success) {
        const province = provincesResponse.data.find((p: ProvinceVo) => p.provinceId === value[0])
        if (province) {
          labels.push(province.province)
        }
      }
    }
    
    if (value.length >= 2) {
      // 获取城市名称
      const citiesResponse = await getCitiesByProvinceId(value[0])
      if (citiesResponse.success) {
        const city = citiesResponse.data.find((c: CityVo) => c.cityId === value[1])
        if (city) {
          labels.push(city.city)
        }
      }
    }
    
    if (value.length >= 3) {
      // 获取区县名称
      const areasResponse = await getAreasByCityId(value[1])
      if (areasResponse.success) {
        const area = areasResponse.data.find((a: AreaVo) => a.areaId === value[2])
        if (area) {
          labels.push(area.area)
        }
      }
    }

    const fullLocation = labels.join(' ')
    
    emit('update:modelValue', fullLocation)
    emit('change', {
      province: labels[0] || '',
      city: labels[1] || '',
      area: labels[2] || '',
      fullLocation
    })
  } catch (error) {
    console.error('获取位置标签失败:', error)
    ElMessage.error('获取位置信息失败')
  }
}

// 解析现有位置值并设置选中状态
const parseLocationValue = async (value: string) => {
  if (!value) {
    selectedLocation.value = []
    return
  }

  try {
    loading.value = true
    const parts = value.split(' ')
    const result: string[] = []

    // 获取省份列表
    const provincesResponse = await getProvinces()
    if (!provincesResponse.success) return

    const province = provincesResponse.data.find((p: ProvinceVo) => p.province === parts[0])
    if (!province) return

    result.push(province.provinceId)

    if (parts.length >= 2) {
      // 获取城市列表
      const citiesResponse = await getCitiesByProvinceId(province.provinceId)
      if (!citiesResponse.success) return

      const city = citiesResponse.data.find((c: CityVo) => c.city === parts[1])
      if (!city) return

      result.push(city.cityId)

      if (parts.length >= 3) {
        // 获取区县列表
        const areasResponse = await getAreasByCityId(city.cityId)
        if (!areasResponse.success) return

        const area = areasResponse.data.find((a: AreaVo) => a.area === parts[2])
        if (area) {
          result.push(area.areaId)
        }
      }
    }

    isInternalUpdate.value = true
    selectedLocation.value = result
    // 延迟重置标志，确保DOM更新完成
    await nextTick()
    isInternalUpdate.value = false
  } catch (error) {
    console.error('解析位置值失败:', error)
  } finally {
    loading.value = false
  }
}

// 监听 modelValue 变化
watch(() => props.modelValue, (newValue, oldValue) => {
  // 只有当值真正改变时才重新解析
  if (newValue !== oldValue) {
    parseLocationValue(newValue || '')
  }
}, { immediate: true })

// 组件挂载时初始化
onMounted(() => {
  if (props.modelValue) {
    parseLocationValue(props.modelValue)
  }
})
</script>

<style scoped>
.location-selector {
  width: 100%;
}

.location-cascader {
  width: 100%;
}

:deep(.el-cascader) {
  width: 100%;
}

:deep(.el-cascader__dropdown) {
  max-height: 300px;
}
</style>