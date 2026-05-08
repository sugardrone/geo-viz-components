import * as THREE from "three";
/**
 * Arrow - 因果关系箭头（增强版）
 * 清晰的因果链可视化
 */

import { BaseComponent } from '../core/BaseComponent.js';
import { latLngToVector3, interpolateArc, Colors } from '../core/Utils.js';

export class Arrow extends BaseComponent {
  constructor() {
    super({
      id: 'arrow',
      name: '因果箭头',
      category: 'ui',
      description: '地理要素之间的因果关系箭头',
      params: {
        from: { type: 'array', required: true },
        to: { type: 'array', required: true },
        color: { type: 'string', default: '#ff6644' },
        label: { type: 'string', default: '' },
        altitude: { type: 'number', default: 0.04 }
      },
      keywords: ['箭头', '因果', '关系', '导致', '影响']
    });
  }

  render(scene, params = {}) {
    this.params = {
      from: [0, 0],
      to: [0, 0],
      color: '#ff6644',
      label: '',
      altitude: 0.04,
      ...params
    };
    
    const radius = 1.004;
    const start = latLngToVector3(this.params.from[1], this.params.from[0], radius);
    const end = latLngToVector3(this.params.to[1], this.params.to[0], radius);
    
    // 弧线路径
    const curvePoints = interpolateArc(start, end, 32, this.params.altitude);
    
    const color = new THREE.Color(this.params.color);
    
    // 底层淡线（增加可见度）
    const glowGeometry = new THREE.BufferGeometry().setFromPoints(curvePoints);
    const glowMaterial = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.3,
      linewidth: 4
    });
    this.group.add(new THREE.Line(glowGeometry, glowMaterial));
    
    // 主线条
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(curvePoints);
    const lineMaterial = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.9,
      linewidth: 2
    });
    this.group.add(new THREE.Line(lineGeometry, lineMaterial));
    
    // 箭头头部（更大的三角形）
    const lastTwoPoints = curvePoints.slice(-2);
    const dir = new THREE.Vector3().subVectors(lastTwoPoints[1], lastTwoPoints[0]).normalize();
    
    const coneGeometry = new THREE.ConeGeometry(0.012, 0.03, 8);
    const coneMaterial = new THREE.MeshBasicMaterial({ color });
    const cone = new THREE.Mesh(coneGeometry, coneMaterial);
    cone.position.copy(lastTwoPoints[1]);
    cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    this.group.add(cone);
    
    // 标签（带背景框和描边）
    if (this.params.label) {
      const midPoint = curvePoints[Math.floor(curvePoints.length / 2)];
      this._createLabel(midPoint, this.params.label, color);
    }
  }

  _createLabel(position, text, color) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    ctx.font = 'bold 22px "Microsoft YaHei", Arial, sans-serif';
    const textWidth = ctx.measureText(text).width;
    
    canvas.width = Math.max(textWidth + 30, 100);
    canvas.height = 40;
    
    ctx.font = 'bold 22px "Microsoft YaHei", Arial, sans-serif';
    
    // 背景
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.beginPath();
    ctx.roundRect(4, 4, canvas.width - 8, canvas.height - 8, 6);
    ctx.fill();
    
    // 边框
    ctx.strokeStyle = `rgb(${color.r*255},${color.g*255},${color.b*255})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(4, 4, canvas.width - 8, canvas.height - 8, 6);
    ctx.stroke();
    
    // 文字描边
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = 'rgba(0,0,0,0.8)';
    ctx.lineWidth = 3;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeText(text, canvas.width / 2, canvas.height / 2);
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    
    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false
    });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.position.copy(position);
    sprite.position.y += 0.025;
    
    const aspect = canvas.width / canvas.height;
    const height = 0.035;
    sprite.scale.set(height * aspect, height, 1);
    
    this.group.add(sprite);
  }
}

export default Arrow;
