/**
 * geo-viz-components - 地理可视化组件库
 * 
 * 标准化 Three.js 地理教学组件
 * 所有组件继承 BaseComponent，遵循统一接口规范
 * 
 * 使用方式：
 *   import { SceneManager, Globe, OceanCurrent } from './index.js';
 *   const scene = new SceneManager(container);
 *   const globe = new Globe();
 *   scene.addComponent(globe, {});
 *   const current = new OceanCurrent();
 *   scene.addComponent(current, { path: [[-80,-15],[-75,-5]], type: 'cold' });
 *   scene.start();
 */

// 核心
export { SceneManager } from './core/SceneManager.js';
export { Globe } from './core/Globe.js';
export { BaseComponent } from './core/BaseComponent.js';
export { latLngToVector3, vector3ToLatLng, coordsToVector3Array, interpolateArc, Colors } from './core/Utils.js';

// 组件
export { OceanCurrent } from './components/OceanCurrent.js';
export { ClimateZone } from './components/ClimateZone.js';
export { Arrow } from './components/Arrow.js';
export { Label } from './components/Label.js';
export { Terrain } from './components/Terrain.js';
export { Wind } from './components/Wind.js';
export { PlateTectonic } from './components/PlateTectonic.js';
export { UrbanArea } from './components/UrbanArea.js';

// 组件注册表（AI 调用用）
import { OceanCurrent } from './components/OceanCurrent.js';
import { ClimateZone } from './components/ClimateZone.js';
import { Arrow } from './components/Arrow.js';
import { Label } from './components/Label.js';
import { Terrain } from './components/Terrain.js';
import { Wind } from './components/Wind.js';
import { PlateTectonic } from './components/PlateTectonic.js';
import { UrbanArea } from './components/UrbanArea.js';

export const COMPONENT_REGISTRY = {
  ocean_current: OceanCurrent,
  climate_zone: ClimateZone,
  arrow: Arrow,
  label: Label,
  terrain: Terrain,
  wind: Wind,
  plate_tectonic: PlateTectonic,
  urban_area: UrbanArea
};

/**
 * 快速渲染函数 - AI 输出 JSON 直接调用
 * @param {HTMLElement} container - 挂载容器
 * @param {Array<{id: string, params: Object}>} componentList - 组件列表
 * @returns {SceneManager}
 */
export function quickRender(container, componentList) {
  const scene = new SceneManager(container);
  
  // 默认加载地球
  const globe = new Globe();
  scene.addComponent(globe, {});
  
  // 加载其他组件
  scene.loadComponents(componentList, COMPONENT_REGISTRY);
  scene.start();
  
  return scene;
}
