/**
 * Terrain - 地形组件
 * 显示地形类型区域
 */

import { BaseComponent } from '../core/BaseComponent.js';
import { latLngToVector3, Colors } from '../core/Utils.js';

export class Terrain extends BaseComponent {
  constructor() {
    super({
      id: 'terrain',
      name: '地形',
      category: 'terrain',
      description: '地形类型可视化',
      params: {
        lat: { type: 'number', required: true, description: '中心纬度' },
        lng: { type: 'number', required: true, description: '中心经度' },
        type: { type: 'string', default: 'plain', description: '地形类型' },
        radius: { type: 'number', default: 10, description: '范围（度）' },
        label: { type: 'string', default: '', description: '标注文字' }
      },
      keywords: ['地形', '平原', '山地', '高原', '盆地', '丘陵', '峡谷', '沙漠', '绿洲']
    });
    
    this._terrainTypes = {
      mountain: { color: Colors.terrain.mountain, name: '山地' },
      plain: { color: Colors.terrain.plain, name: '平原' },
      plateau: { color: 0xd35400, name: '高原' },
      basin: { color: 0x16a085, name: '盆地' },
      hill: { color: 0x8bc34a, name: '丘陵' },
      desert: { color: Colors.terrain.desert, name: '沙漠' },
      glacier: { color: 0xe8f5e9, name: '冰川' }
    };
  }

  render(scene, params = {}) {
    this.params = {
      lat: 0, lng: 0, type: 'plain', radius: 10, label: '', ...params
    };
    
    const typeInfo = this._terrainTypes[this.params.type] || this._terrainTypes.plain;
    const radius3D = 1.003;
    const center = latLngToVector3(this.params.lat, this.params.lng, radius3D);
    
    const segments = 32;
    const geometry = new THREE.CircleGeometry(1, segments);
    geometry.rotateX(-Math.PI / 2);
    
    const material = new THREE.MeshBasicMaterial({
      color: typeInfo.color,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    
    const circle = new THREE.Mesh(geometry, material);
    circle.position.copy(center);
    circle.lookAt(new THREE.Vector3(0, 0, 0));
    circle.scale.setScalar(0.12 * (this.params.radius / 10));
    this.group.add(circle);
    
    // 边框
    const edgeGeometry = new THREE.EdgesGeometry(geometry);
    const edgeMaterial = new THREE.LineBasicMaterial({ 
      color: typeInfo.color, transparent: true, opacity: 0.7 
    });
    circle.add(new THREE.LineSegments(edgeGeometry, edgeMaterial));
  }
}

export default Terrain;
