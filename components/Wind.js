import * as THREE from "three";
/**
 * Wind - 风向组件（增强版）
 * 粒子流动 + 箭头指示 + 动态轨迹
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
        path: { type: 'array', required: true },
        strength: { type: 'number', default: 5 },
        animated: { type: 'boolean', default: true },
        label: { type: 'string', default: '' }
      },
      keywords: ['风', '风向', '季风', '信风', '西风', '台风']
    });
    
    this._particles = [];
    this._time = 0;
  }

  render(scene, params = {}) {
    this.params = {
      path: [],
      strength: 5,
      animated: true,
      label: '',
      ...params
    };
    
    const path = this.params.path;
    if (path.length < 2) return;
    
    const radius = 1.005;
    const coords3D = path.map(([lng, lat]) => latLngToVector3(lat, lng, radius));
    
    // 平滑曲线
    const curvePoints = [];
    for (let i = 0; i < coords3D.length - 1; i++) {
      const arcPoints = interpolateArc(coords3D[i], coords3D[i + 1], 20, 0.01);
      curvePoints.push(...arcPoints.slice(i === 0 ? 0 : 1));
    }
    
    this._curvePoints = curvePoints;
    
    // 风向轨迹（虚线效果）
    const color = new THREE.Color(0x88ccff);
    
    // 底层淡线
    const trailGeometry = new THREE.BufferGeometry().setFromPoints(curvePoints);
    const trailMaterial = new THREE.LineBasicMaterial({
      color, transparent: true, opacity: 0.15
    });
    this.group.add(new THREE.Line(trailGeometry, trailMaterial));
    
    // 风向箭头（V 形标记）
    this._createWindArrows(curvePoints, color);
    
    // 流动粒子
    if (this.params.animated) {
      this._createParticles(curvePoints, color);
    }
  }

  _createWindArrows(points, color) {
    const arrowCount = Math.max(2, Math.floor(points.length / 20));
    
    for (let i = 0; i < arrowCount; i++) {
      const t = (i + 0.5) / arrowCount;
      const idx = Math.floor(t * (points.length - 1));
      if (idx >= points.length - 1) continue;
      
      const pos = points[idx].clone();
      const nextPos = points[Math.min(idx + 2, points.length - 1)].clone();
      const dir = new THREE.Vector3().subVectors(nextPos, pos).normalize();
      
      // V 形箭头
      const side = new THREE.Vector3().crossVectors(dir, pos.clone().normalize()).normalize();
      
      const p1 = pos.clone().add(dir.clone().multiplyScalar(0.015));
      const p2 = pos.clone().sub(side.clone().multiplyScalar(0.008)).sub(dir.clone().multiplyScalar(0.005));
      const p3 = pos.clone().add(side.clone().multiplyScalar(0.008)).sub(dir.clone().multiplyScalar(0.005));
      
      const geometry = new THREE.BufferGeometry().setFromPoints([p2, pos, p3]);
      const material = new THREE.LineBasicMaterial({
        color, transparent: true, opacity: 0.6, linewidth: 2
      });
      this.group.add(new THREE.Line(geometry, material));
    }
  }

  _createParticles(points, color) {
    const count = Math.min(40, Math.max(10, this.params.strength * 3));
    
    for (let i = 0; i < count; i++) {
      const size = 0.003 + Math.random() * 0.002;
      const geometry = new THREE.SphereGeometry(size, 6, 6);
      const material = new THREE.MeshBasicMaterial({
        color, transparent: true, opacity: 0.7
      });
      const particle = new THREE.Mesh(geometry, material);
      
      // 拖尾效果
      const tailGeometry = new THREE.SphereGeometry(size * 0.6, 6, 6);
      const tailMaterial = new THREE.MeshBasicMaterial({
        color, transparent: true, opacity: 0.3
      });
      const tail = new THREE.Mesh(tailGeometry, tailMaterial);
      tail.position.z = -0.005;
      particle.add(tail);
      
      particle._t = i / count;
      particle._speed = 0.04 + Math.random() * 0.03;
      particle._offset = (Math.random() - 0.5) * 0.004;
      particle._points = points;
      
      this.group.add(particle);
      this._particles.push(particle);
    }
  }

  update(params, delta) {
    this._time += delta;
    
    for (const particle of this._particles) {
      particle._t += particle._speed * delta;
      if (particle._t > 1) particle._t -= 1;
      
      const points = particle._points;
      const totalLen = points.length - 1;
      const pos = particle._t * totalLen;
      const idx = Math.floor(pos);
      const t = pos - idx;
      
      if (idx < totalLen) {
        const p = new THREE.Vector3().lerpVectors(points[idx], points[idx + 1], t);
        // 添加微小偏移模拟湍流
        p.x += Math.sin(this._time * 2 + particle._t * 8) * particle._offset;
        p.y += Math.cos(this._time * 2 + particle._t * 8) * particle._offset;
        particle.position.copy(p);
      }
      
      const pulse = 0.5 + Math.sin(this._time * 4 + particle._t * 12) * 0.3;
      particle.material.opacity = pulse * 0.7;
    }
  }
}

export default Wind;
