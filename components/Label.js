import * as THREE from "three";
/**
 * Label - 标注组件（增强版）
 * 清晰的地理标注，带背景框、描边、连线
 */

import { BaseComponent } from '../core/BaseComponent.js';
import { latLngToVector3 } from '../core/Utils.js';

export class Label extends BaseComponent {
  constructor() {
    super({
      id: 'label',
      name: '标注',
      category: 'ui',
      description: '地理标注文字',
      params: {
        lat: { type: 'number', required: true },
        lng: { type: 'number', required: true },
        text: { type: 'string', required: true },
        color: { type: 'string', default: '#ffffff' },
        fontSize: { type: 'number', default: 28 },
        backgroundColor: { type: 'string', default: 'rgba(0,0,0,0.8)' },
        offset: { type: 'number', default: 0.05 }
      },
      keywords: ['标注', '标签', '地名', '城市', '位置']
    });
  }

  render(scene, params = {}) {
    this.params = {
      lat: 0,
      lng: 0,
      text: '',
      color: '#ffffff',
      fontSize: 28,
      backgroundColor: 'rgba(0,0,0,0.8)',
      offset: 0.05,
      ...params
    };
    
    // 地球表面点
    const surfacePos = latLngToVector3(this.params.lat, this.params.lng, 1.002);
    // 标注悬浮点
    const labelPos = latLngToVector3(this.params.lat, this.params.lng, 1 + this.params.offset);
    
    // 连线（从表面到标注）
    const lineGeometry = new THREE.BufferGeometry().setFromPoints([surfacePos, labelPos]);
    const lineMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color(this.params.color),
      transparent: true,
      opacity: 0.5
    });
    this.group.add(new THREE.Line(lineGeometry, lineMaterial));
    
    // 表面圆点标记
    const dotGeometry = new THREE.SphereGeometry(0.004, 12, 12);
    const dotMaterial = new THREE.MeshBasicMaterial({ color: this.params.color });
    const dot = new THREE.Mesh(dotGeometry, dotMaterial);
    dot.position.copy(surfacePos);
    this.group.add(dot);
    
    // 标注文字（Canvas 生成）
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // 计算文字宽度
    ctx.font = `bold ${this.params.fontSize}px "Microsoft YaHei", Arial, sans-serif`;
    const textWidth = ctx.measureText(this.params.text).width;
    
    canvas.width = Math.max(textWidth + 40, 120);
    canvas.height = this.params.fontSize + 24;
    
    // 重新设置字体（canvas 尺寸变化后需要重设）
    ctx.font = `bold ${this.params.fontSize}px "Microsoft YaHei", Arial, sans-serif`;
    
    // 背景框
    const padding = 10;
    ctx.fillStyle = this.params.backgroundColor;
    ctx.beginPath();
    ctx.roundRect(padding/2, padding/2, canvas.width - padding, canvas.height - padding, 6);
    ctx.fill();
    
    // 边框
    ctx.strokeStyle = this.params.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(padding/2, padding/2, canvas.width - padding, canvas.height - padding, 6);
    ctx.stroke();
    
    // 文字描边（增加可读性）
    ctx.fillStyle = this.params.color;
    ctx.strokeStyle = 'rgba(0,0,0,0.8)';
    ctx.lineWidth = 3;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeText(this.params.text, canvas.width / 2, canvas.height / 2);
    ctx.fillText(this.params.text, canvas.width / 2, canvas.height / 2);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    
    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false
    });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.position.copy(labelPos);
    
    // 根据文字长度调整大小
    const aspect = canvas.width / canvas.height;
    const height = 0.04;
    sprite.scale.set(height * aspect, height, 1);
    
    this.group.add(sprite);
  }
}

export default Label;
