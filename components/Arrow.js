/**
 * Arrow - 因果关系箭头
 * 用于展示地理要素之间的因果关系
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
        from: { type: 'array', required: true, description: '起点 [lng, lat]' },
        to: { type: 'array', required: true, description: '终点 [lng, lat]' },
        color: { type: 'string', default: 'auto', description: '颜色' },
        label: { type: 'string', default: '', description: '箭头标签' },
        dashed: { type: 'boolean', default: false, description: '虚线' },
        altitude: { type: 'number', default: 0.03, description: '弧线高度' }
      },
      keywords: ['箭头', '因果', '关系', '导致', '影响']
    });
  }

  render(scene, params = {}) {
    this.params = {
      from: [0, 0],
      to: [0, 0],
      color: 'auto',
      label: '',
      dashed: false,
      altitude: 0.03,
      ...params
    };
    
    const radius = 1.004;
    const start = latLngToVector3(this.params.from[1], this.params.from[0], radius);
    const end = latLngToVector3(this.params.to[1], this.params.to[0], radius);
    
    // 弧线路径
    const curvePoints = interpolateArc(start, end, 32, this.params.altitude);
    
    // 线条
    const color = this.params.color === 'auto' ? Colors.ui.arrow : new THREE.Color(this.params.color);
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(curvePoints);
    const lineMaterial = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.8,
      linewidth: 2
    });
    
    if (this.params.dashed) {
      lineMaterial.setLineDash && lineMaterial.setLineDash([0.02, 0.02]);
    }
    
    const line = new THREE.Line(lineGeometry, lineMaterial);
    this.group.add(line);
    
    // 箭头头部
    const lastTwoPoints = curvePoints.slice(-2);
    const dir = new THREE.Vector3().subVectors(lastTwoPoints[1], lastTwoPoints[0]).normalize();
    
    const coneGeometry = new THREE.ConeGeometry(0.01, 0.025, 8);
    const coneMaterial = new THREE.MeshBasicMaterial({ color });
    const cone = new THREE.Mesh(coneGeometry, coneMaterial);
    
    cone.position.copy(lastTwoPoints[1]);
    cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    this.group.add(cone);
    
    // 标签
    if (this.params.label) {
      const midPoint = curvePoints[Math.floor(curvePoints.length / 2)];
      this._createLabel(midPoint, this.params.label, color);
    }
  }

  _createLabel(position, text, color) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.roundRect(0, 0, 256, 64, 8);
    ctx.fill();
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 32);
    
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.position.copy(position);
    sprite.position.y += 0.02;
    sprite.scale.set(0.12, 0.03, 1);
    this.group.add(sprite);
  }
}

export default Arrow;
