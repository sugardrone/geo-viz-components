import * as THREE from "three";
/**
 * SceneManager - 场景管理器
 * 管理 Three.js 场景、相机、渲染器、组件生命周期
 */

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class SceneManager {
  /**
   * @param {HTMLElement} container - 挂载容器
   * @param {Object} options
   * @param {number} options.width
   * @param {number} options.height
   * @param {number} options.backgroundColor
   */
  constructor(container, options = {}) {
    this.container = container;
    this.width = options.width || container.clientWidth || 800;
    this.height = options.height || container.clientHeight || 600;
    this.backgroundColor = options.backgroundColor || 0x000011;
    
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.backgroundColor);
    
    // 相机
    this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.1, 100);
    this.camera.position.set(0, 0, 2.5);
    
    // 渲染器
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);
    
    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 1.2;
    this.controls.maxDistance = 5;
    this.controls.rotateSpeed = 0.5;
    
    // 组件注册表
    this.components = new Map();
    this._componentIdCounter = 0;
    
    // 灯光
    this._setupLights();
    
    // 动画循环
    this._clock = new THREE.Clock();
    this._animate = this._animate.bind(this);
    this._running = false;
    
    // 响应式
    this._onResize = this._onResize.bind(this);
    window.addEventListener('resize', this._onResize);
  }

  _setupLights() {
    // 环境光
    const ambient = new THREE.AmbientLight(0x444455, 0.8);
    this.scene.add(ambient);
    
    // 主光源（模拟太阳）
    const sun = new THREE.DirectionalLight(0xffffff, 2.0);
    sun.position.set(5, 3, 5);
    this.scene.add(sun);
    
    // 补光
    const fill = new THREE.DirectionalLight(0x8899bb, 0.6);
    fill.position.set(-3, -1, -3);
    this.scene.add(fill);
  }

  /**
   * 添加组件到场景
   * @param {BaseComponent} component - 组件实例
   * @param {Object} params - 组件参数
   * @returns {string} 组件实例 ID
   */
  addComponent(component, params) {
    const instanceId = `comp_${this._componentIdCounter++}`;
    component._instanceId = instanceId;
    
    // 如果有 globe，组件作为 globe 的子对象（跟着转）
    const globe = this.components.get('comp_0');
    const parent = globe ? globe.group : this.scene;
    parent.add(component.group);
    
    component.render(this.scene, params, { globe: this });
    this.components.set(instanceId, component);
    
    return instanceId;
  }

  /**
   * 移除组件
   * @param {string} instanceId
   */
  removeComponent(instanceId) {
    const comp = this.components.get(instanceId);
    if (comp) {
      comp.destroy();
      this.components.delete(instanceId);
    }
  }

  /**
   * 清除所有组件
   */
  clearComponents() {
    for (const [id, comp] of this.components) {
      comp.destroy();
    }
    this.components.clear();
  }

  /**
   * 按 ID 查找组件
   */
  getComponent(instanceId) {
    return this.components.get(instanceId);
  }

  /**
   * 批量加载组件（AI 输出格式）
   * @param {Array<{id: string, params: Object}>} componentList
   * @param {Object} componentRegistry - { componentId: ComponentClass }
   */
  loadComponents(componentList, componentRegistry) {
    const loaded = [];
    for (const item of componentList) {
      const ComponentClass = componentRegistry[item.id];
      if (!ComponentClass) {
        console.warn(`未找到组件: ${item.id}`);
        continue;
      }
      const instance = new ComponentClass();
      const instanceId = this.addComponent(instance, item.params);
      loaded.push({ instanceId, id: item.id, params: item.params });
    }
    return loaded;
  }

  start() {
    if (this._running) return;
    this._running = true;
    this._animate();
  }

  stop() {
    this._running = false;
  }

  _animate() {
    if (!this._running) return;
    requestAnimationFrame(this._animate);
    
    const delta = this._clock.getDelta();
    this.controls.update();
    
    // 更新所有组件（动画）
    for (const comp of this.components.values()) {
      if (comp.update && comp._lastUpdate !== undefined) {
        comp.update(comp.params, delta);
      }
      comp._lastUpdate = delta;
    }
    
    this.renderer.render(this.scene, this.camera);
  }

  _onResize() {
    this.width = this.container.clientWidth;
    this.height = this.container.clientHeight;
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
  }

  dispose() {
    this.stop();
    this.clearComponents();
    this.controls.dispose();
    this.renderer.dispose();
    window.removeEventListener('resize', this._onResize);
    this.container.removeChild(this.renderer.domElement);
  }
}

export default SceneManager;
