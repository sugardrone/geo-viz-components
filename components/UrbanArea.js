/**
 * UrbanArea - 城市区域组件
 * 显示城市分布和规模
 */

import { BaseComponent } from '../core/BaseComponent.js';
import { latLngToVector3 } from '../core/Utils.js';

export class UrbanArea extends BaseComponent {
  constructor() {
    super({
      id: 'urban_area',
      name: '城市',
      category: 'terrain',
      description: '城市分布和规模可视化',
      params: {
        cities: { type: 'array', required: true, description: '城市列表 [{name, lat, lng, population}]' },
        showConnections: { type: 'boolean', default: false, description: '显示城市间连线' },
        scaleByPopulation: { type: 'boolean', default: true, description: '按人口缩放' }
      },
      keywords: ['城市', '城镇化', '城市化', '城市群', '都市圈', '人口']
    });
  }

  render(scene, params = {}) {
    this.params = {
      cities: [],
      showConnections: false,
      scaleByPopulation: true,
      ...params
    };
    
    const radius = 1.005;
    const cityPositions = [];
    
    for (const city of this.params.cities) {
      const position = latLngToVector3(city.lat, city.lng, radius);
      const size = this.params.scaleByPopulation 
        ? Math.max(0.003, Math.min(0.012, (city.population || 1000000) / 100000000))
        : 0.006;
      
      // 城市点
      const geometry = new THREE.SphereGeometry(size, 16, 16);
      const material = new THREE.MeshBasicMaterial({
        color: 0xff6b6b,
        transparent: true,
        opacity: 0.9
      });
      const sphere = new THREE.Mesh(geometry, material);
      sphere.position.copy(position);
      this.group.add(sphere);
      
      // 城市名称
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(city.name, 128, 32);
      
      const texture = new THREE.CanvasTexture(canvas);
      const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.position.copy(position);
      sprite.position.y += 0.025;
      sprite.scale.set(0.08, 0.02, 1);
      this.group.add(sprite);
      
      cityPositions.push(position);
    }
    
    // 城市间连线
    if (this.params.showConnections && cityPositions.length >= 2) {
      for (let i = 0; i < cityPositions.length - 1; i++) {
        const points = [cityPositions[i], cityPositions[i + 1]];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.3
        });
        this.group.add(new THREE.Line(geometry, material));
      }
    }
  }
}

export default UrbanArea;
