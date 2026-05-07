import * as THREE from "three";
/**
 * OceanCurrent - 洋流组件（增强版）
 * 粒子流动 + 发光轨迹 + 动态箭头
 */

import { BaseComponent } from '../core/BaseComponent.js';
import { latLngToVector3, interpolateArc, Colors } from '../core/Utils.js';

export class OceanCurrent extends BaseComponent {
  constructor() {
    super({
      id: 'ocean_current',
      name: '洋流',
      category: 'ocean',
      description: '洋流可视化，粒子流动动画',
      params: {
        path: { type: 'array', required: true },
        type: { type: 'string', default: 'cold' },
        width: { type: 'number', default: 0.003 },
        animated: { type: 'boolean', default: true },
        label: { type: 'string', default: '' }
      },
      keywords: ['洋流', '寒流', '暖流', '海流']
    });
    
    this._particles = [];
    this._time = 0;
  }

  render(scene, params = {}) {
    this.params = {
      path: [],
      type: 'cold',
      width: 0.003,
      animated: true,
      label: '',
      ...params
    };
    
    const path = this.params.path;
    if (path.length < 2) return;
    
    const colorMap = {
      cold: new THREE.Color(0x1a8cff),
      warm: new THREE.Color(0xff4444),
      neutral: new THREE.Color(0x44aaff)
    };
    const baseColor = colorMap[this.params.type] || colorMap.neutral;
    
    // 路径转 3D
    const radius = 1.003;
    const coords3D = path.map(([lng, lat]) => latLngToVector3(lat, lng, radius));
    
    // 平滑曲线
    const curvePoints = [];
    for (let i = 0; i < coords3D.length - 1; i++) {
      const arcPoints = interpolateArc(coords3D[i], coords3D[i + 1], 30, 0.012);
      curvePoints.push(...arcPoints.slice(i === 0 ? 0 : 1));
    }
    
    this._curvePoints = curvePoints;
    
    // 底层轨迹线（淡色）
    const trailGeometry = new THREE.BufferGeometry().setFromPoints(curvePoints);
    const trailMaterial = new THREE.LineBasicMaterial({
      color: baseColor,
      transparent: true,
      opacity: 0.25,
      linewidth: 1
    });
    this.group.add(new THREE.Line(trailGeometry, trailMaterial));
    
    // 发光轨迹线
    const glowGeometry = new THREE.BufferGeometry().setFromPoints(curvePoints);
    const glowMaterial = new THREE.LineBasicMaterial({
      color: baseColor,
      transparent: true,
      opacity: 0.5,
      linewidth: 2
    });
    this.group.add(new THREE.Line(glowGeometry, glowMaterial));
    
    // 流动粒子
    if (this.params.animated) {
      this._createParticles(curvePoints, baseColor);
    }
    
    // 方向箭头（沿路径均匀分布）
    this._createDirectionArrows(curvePoints, baseColor);
  }

  _createParticles(points, color) {
    const particleCount = Math.min(60, Math.max(20, points.length / 2));
    
    for (let i = 0; i < particleCount; i++) {
      // 粒子球
      const size = 0.004 + Math.random() * 0.003;
      const geometry = new THREE.SphereGeometry(size, 8, 8);
      const material = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.9
      });
      const particle = new THREE.Mesh(geometry, material);
      
      // 发光外圈
      const glowGeometry = new THREE.SphereGeometry(size * 2.5, 8, 8);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.25,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      particle.add(glow);
      
      // 沿路径分布
      particle._t = i / particleCount;
      particle._speed = 0.03 + Math.random() * 0.02;
      particle._points = points;
      
      this.group.add(particle);
      this._particles.push(particle);
    }
  }

  _createDirectionArrows(points, color) {
    const arrowCount = Math.max(2, Math.floor(points.length / 25));
    
    for (let i = 0; i < arrowCount; i++) {
      const t = (i + 0.5) / arrowCount;
      const idx = Math.floor(t * (points.length - 1));
      
      if (idx >= points.length - 1) continue;
      
      const pos = points[idx].clone();
      const nextPos = points[Math.min(idx + 1, points.length - 1)].clone();
      const dir = new THREE.Vector3().subVectors(nextPos, pos).normalize();
      
      // 三角箭头
      const shape = new THREE.Shape();
      shape.moveTo(0, 0.012);
      shape.lineTo(-0.006, -0.006);
      shape.lineTo(0.006, -0.006);
      shape.closePath();
      
      const geometry = new THREE.ShapeGeometry(shape);
      const material = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide
      });
      
      const arrow = new THREE.Mesh(geometry, material);
      arrow.position.copy(pos);
      arrow.lookAt(nextPos);
      
      this.group.add(arrow);
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
        particle.position.copy(p);
      }
      
      // 脉动效果
      const pulse = 0.7 + Math.sin(this._time * 3 + particle._t * 10) * 0.3;
      particle.material.opacity = pulse * 0.9;
    }
  }
}

export default OceanCurrent;
