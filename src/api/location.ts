import { http, type ApiResponse } from '../utils/http'

// 省份信息接口
export interface ProvinceVo {
  id: number
  provinceId: string
  province: string
}

// 城市信息接口
export interface CityVo {
  id: number
  cityId: string
  city: string
  provinceId: string
}

// 区县信息接口
export interface AreaVo {
  id: number
  areaId: string
  area: string
  cityId: string
}

/**
 * 获取所有省份
 */
export const getProvinces = async (): Promise<ApiResponse<ProvinceVo[]>> => {
  return await http.get('/user/address/provinces')
}

/**
 * 根据省份ID获取城市列表
 * @param provinceId 省份ID
 */
export const getCitiesByProvinceId = async (provinceId: string): Promise<ApiResponse<CityVo[]>> => {
  return await http.get(`/user/address/cities/${provinceId}`)
}

/**
 * 根据城市ID获取区县列表
 * @param cityId 城市ID
 */
export const getAreasByCityId = async (cityId: string): Promise<ApiResponse<AreaVo[]>> => {
  return await http.get(`/user/address/areas/${cityId}`)
}