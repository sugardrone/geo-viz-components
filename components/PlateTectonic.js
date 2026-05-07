import * as THREE from "three";
/**
 * PlateTectonic - 板块构造组件
 * 显示板块边界和运动方向
 */

import { BaseComponent } from '../core/BaseComponent.js';
import { latLngToVector3, interpolateArc } from '../core/Utils.js';

export class PlateTectonic extends BaseComponent {
  constructor() {
    super({
      id: 'plate_tectonic',
      name: '板块构造',
      category: 'terrain',
      description: '板块边界和运动方向',
      params: {
        boundary: { type: 'array', required: true, description: '板块边界路径 [[lng, lat], ...]' },
        type: { type: 'string', default: 'convergent', description: '边界类型 convergent/divergent/transform' },
        plates: { type: 'array', default: [], description: '板块名称' },
        showMovement: { type: 'boolean', default: true, description: '显示运动方向' }
      },
      keywords: ['板块', '板块构造', '地震', '火山', '造山', '裂谷', '海沟']
    });
    
    this._boundaryTypes = {
      convergent: { color: 0xe74c3c, name: '汇聚型' },
      divergent: { color: 0x3498db, name: '离散型' },
      transform: { color: 0xf39c12, name: '转换型' }
    };
  }

  render(scene, params = {}) {
    this.params = {
      boundary: [],
      type: 'convergent',
      plates: [],
      showMovement: true,
      ...params
    };
    
    const typeInfo = this._boundaryTypes[this.params.type] || this._boundaryTypes.convergent;
    const radius = 1.006;
    
    // 边界线
    const coords3D = this.params.boundary.map(([lng, lat]) => latLngToVector3(lat, lng, radius));
    
    if (coords3D.length >= 2) {
      const curvePoints = [];
      for (let i = 0; i < coords3D.length - 1; i++) {
        const arcPoints = interpolateArc(coords3D[i], coords3D[i + 1], 16, 0.01);
        curvePoints.push(...arcPoints.slice(i === 0 ? 0 : 1));
      }
      
      const lineGeometry = new THREE.BufferGeometry().setFromPoints(curvePoints);
      const lineMaterial = new THREE.LineBasicMaterial({
        color: typeInfo.color,
        linewidth: 3,
        transparent: true,
        opacity: 0.9
      });
      this.group.add(new THREE.Line(lineGeometry, lineMaterial));
      
      // 运动方向箭头
      if (this.params.showMovement) {
        const mid = Math.floor(curvePoints.length / 2);
        this._createMovementArrows(curvePoints[mid], typeInfo.color);
      }
    }
  }

  _createMovementArrows(position, color) {
    const arrowGeometry = new THREE.ConeGeometry(0.008, 0.02, 8);
    const arrowMaterial = new THREE.MeshBasicMaterial({ color });
    
    // 两个方向的箭头
    for (let angle of [-Math.PI / 4, Math.PI / 4]) {
      const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
      arrow.position.copy(position);
      arrow.position.y += 0.015;
      arrow.rotation.z = angle;
      this.group.add(arrow);
    }
  }
}

export default PlateTectonic;
