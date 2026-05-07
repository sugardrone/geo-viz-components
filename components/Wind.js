/**
 * Wind - 风向组件
 * 显示风向和风力
 */

import { BaseComponent } from '../core/BaseComponent.js';
import { latLngToVector3, interpolateArc } from '../core/Utils.js';

export class Wind extends BaseComponent {
  constructor() {
    super({
      id: 'wind',
      name: '风向',
      category: 'climate',
      description: '风向和风力可视化',
      params: {
        path: { type: 'array', required: true, description: '风向路径 [[lng, lat], ...]' },
        strength: { type: 'number', default: 1, description: '风力等级 1-12' },
        color: { type: 'string', default: 'auto', description: '颜色' },
        animated: { type: 'boolean', default: true, description: '是否动画' }
      },
      keywords: ['风', '风向', '季风', '信风', '西风', '台风', '风力']
    });
    
    this._particles = [];
  }

  render(scene, params = {}) {
    this.params = {
      path: [],
      strength: 1,
      color: 'auto',
      animated: true,
      ...params
    };
    
    const path = this.params.path;
    if (path.length < 2) return;
    
    const radius = 1.005;
    const coords3D = path.map(([lng, lat]) => latLngToVector3(lat, lng, radius));
    
    // 生成曲线
    const curvePoints = [];
    for (let i = 0; i < coords3D.length - 1; i++) {
      const arcPoints = interpolateArc(coords3D[i], coords3D[i + 1], 16, 0.01);
      curvePoints.push(...arcPoints.slice(i === 0 ? 0 : 1));
    }
    
    // 风向线
    const color = this.params.color === 'auto' ? 0xaaaaaa : new THREE.Color(this.params.color);
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(curvePoints);
    const lineMaterial = new THREE.LineBasicMaterial({
      color, transparent: true, opacity: 0.6
    });
    this.group.add(new THREE.Line(lineGeometry, lineMaterial));
    
    // 风力粒子
    const particleCount = Math.min(20, Math.max(3, this.params.strength * 2));
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      const t = i / particleCount;
      const idx = Math.floor(t * (curvePoints.length - 1));
      const point = curvePoints[idx];
      positions[i * 3] = point.x;
      positions[i * 3 + 1] = point.y;
      positions[i * 3 + 2] = point.z;
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const particleMaterial = new THREE.PointsMaterial({
      color, size: 0.005, transparent: true, opacity: 0.8
    });
    
    this._particles = new THREE.Points(particleGeometry, particleMaterial);
    this._curvePoints = curvePoints;
    this.group.add(this._particles);
  }

  update(params, delta) {
    if (!this.params.animated || !this._particles) return;
    
    const positions = this._particles.geometry.attributes.position.array;
    const count = positions.length / 3;
    
    for (let i = 0; i < count; i++) {
      const currentT = (positions[i * 3 + 1] + 1) / 2; // 使用 y 做简易索引
      const newT = (currentT + delta * 0.3) % 1;
      const idx = Math.floor(newT * (this._curvePoints.length - 1));
      const point = this._curvePoints[idx];
      
      positions[i * 3] = point.x + (Math.random() - 0.5) * 0.003;
      positions[i * 3 + 1] = point.y + (Math.random() - 0.5) * 0.003;
      positions[i * 3 + 2] = point.z + (Math.random() - 0.5) * 0.003;
    }
    
    this._particles.geometry.attributes.position.needsUpdate = true;
  }
}

export default Wind;
