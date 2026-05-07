import * as THREE from "three";
/**
 * ClimateZone - 气候带组件
 * 在地球表面显示气候区域着色
 */

import { BaseComponent } from '../core/BaseComponent.js';
import { latLngToVector3, Colors } from '../core/Utils.js';

export class ClimateZone extends BaseComponent {
  constructor() {
    super({
      id: 'climate_zone',
      name: '气候带',
      category: 'climate',
      description: '气候区域可视化',
      params: {
        lat: { type: 'number', required: true, description: '中心纬度' },
        lng: { type: 'number', required: true, description: '中心经度' },
        type: { type: 'string', default: 'temperate', description: '气候类型' },
        radius: { type: 'number', default: 15, description: '影响范围（度）' },
        opacity: { type: 'number', default: 0.4, description: '透明度' },
        label: { type: 'string', default: '', description: '标注文字' }
      },
      keywords: ['气候', '气候带', '热带', '温带', '寒带', '地中海气候', '季风', '雨林', '沙漠', '草原']
    });
    
    this._climateTypes = {
      tropical_rainforest: { color: 0x27ae60, name: '热带雨林' },
      tropical_monsoon: { color: 0x2ecc71, name: '热带季风' },
      tropical_savanna: { color: 0xf39c12, name: '热带草原' },
      arid: { color: 0xe67e22, name: '干旱' },
      mediterranean: { color: 0xe74c3c, name: '地中海' },
      humid_subtropical: { color: 0xf1c40f, name: '亚热带湿润' },
      temperate_oceanic: { color: 0x3498db, name: '温带海洋' },
      temperate_continental: { color: 0x9b59b6, name: '温带大陆' },
      subarctic: { color: 0x1abc9c, name: '亚寒带' },
      tundra: { color: 0xbdc3c7, name: '苔原' },
      ice_cap: { color: 0xecf0f1, name: '冰原' },
      temperate: { color: Colors.climate.temperate, name: '温带' },
      tropical: { color: Colors.climate.tropical, name: '热带' },
      polar: { color: Colors.climate.polar, name: '极地' }
    };
  }

  render(scene, params = {}) {
    this.params = {
      lat: 0,
      lng: 0,
      type: 'temperate',
      radius: 15,
      opacity: 0.4,
      label: '',
      ...params
    };
    
    const typeInfo = this._climateTypes[this.params.type] || this._climateTypes.temperate;
    const color = typeInfo.color;
    
    // 创建圆形区域
    const radius3D = 1.003;
    const center = latLngToVector3(this.params.lat, this.params.lng, radius3D);
    
    // 创建扇形区域
    const segments = 32;
    const geometry = new THREE.CircleGeometry(1, segments);
    geometry.rotateX(-Math.PI / 2);
    
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: this.params.opacity,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    
    const circle = new THREE.Mesh(geometry, material);
    circle.position.copy(center);
    circle.lookAt(new THREE.Vector3(0, 0, 0));
    circle.scale.setScalar(0.15 * (this.params.radius / 15));
    this.group.add(circle);
    
    // 边框
    const edgeGeometry = new THREE.EdgesGeometry(geometry);
    const edgeMaterial = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.8 });
    const edge = new THREE.LineSegments(edgeGeometry, edgeMaterial);
    circle.add(edge);
  }
}

export default ClimateZone;
