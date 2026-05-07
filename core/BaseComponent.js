/**
 * BaseComponent - 所有地理可视化组件的基类
 * 
 * 每个组件必须：
 * 1. 定义元数据（id, name, category, params schema, keywords）
 * 2. 实现 render() 方法
 * 3. 实现 destroy() 方法
 * 
 * AI 调用时只需提供 { id, params }，系统自动匹配组件并渲染
 */

export class BaseComponent {
  /**
   * @param {Object} metadata - 组件元数据
   * @param {string} metadata.id - 唯一标识（如 "ocean_current"）
   * @param {string} metadata.name - 中文名（如 "洋流"）
   * @param {string} metadata.category - 分类（ocean / climate / terrain / ui）
   * @param {Object} metadata.params - 参数 schema（JSON Schema 格式）
   * @param {string[]} metadata.keywords - 匹配关键词（用于题目路由）
   * @param {string} metadata.description - 组件描述
   */
  constructor(metadata) {
    if (new.target === BaseComponent) {
      throw new Error('BaseComponent 不能直接实例化，必须继承');
    }
    this.metadata = metadata;
    this.group = new THREE.Group(); // 组件的 Three.js 对象组
    this.params = {};
    this._disposed = false;
  }

  /**
   * 渲染组件到场景
   * @param {THREE.Scene} scene - Three.js 场景
   * @param {Object} params - 组件参数
   * @param {Object} context - 上下文（globe 实例、其他组件等）
   */
  render(scene, params, context = {}) {
    throw new Error(`${this.constructor.name} 必须实现 render() 方法`);
  }

  /**
   * 销毁组件，释放资源
   */
  destroy() {
    if (this._disposed) return;
    this._disposed = true;
    
    // 遍历 group 中所有对象并释放
    this.group.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
    
    this.group.parent?.remove(this.group);
    this.group.clear();
  }

  /**
   * 更新组件参数（支持动画）
   * @param {Object} newParams
   */
  update(newParams) {
    this.params = { ...this.params, ...newParams };
  }

  /**
   * 获取组件信息（用于 AI 调用）
   * @returns {Object}
   */
  getInfo() {
    return {
      ...this.metadata,
      instanceId: this._instanceId,
      disposed: this._disposed
    };
  }

  /**
   * 验证参数是否合法
   * @param {Object} params
   * @returns {{ valid: boolean, errors: string[] }}
   */
  static validateParams(params, schema) {
    const errors = [];
    if (!schema) return { valid: true, errors };
    
    for (const [key, rule] of Object.entries(schema)) {
      if (rule.required && !(key in params)) {
        errors.push(`缺少必填参数: ${key}`);
      }
      if (key in params && rule.type) {
        const val = params[key];
        if (rule.type === 'array' && !Array.isArray(val)) {
          errors.push(`参数 ${key} 必须是数组`);
        }
        if (rule.type === 'number' && typeof val !== 'number') {
          errors.push(`参数 ${key} 必须是数字`);
        }
      }
    }
    return { valid: errors.length === 0, errors };
  }
}

export default BaseComponent;
