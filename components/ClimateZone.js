import * as THREE from "three";
/**
 * ClimateZone - 气候带（真实边界版）
 * 用多边形在球面上渲染真实气候带范围
 */

import { BaseComponent } from '../core/BaseComponent.js';
import { latLngToVector3 } from '../core/Utils.js';

// 主要气候带简化边界（经纬度多边形）
const CLIMATE_BOUNDARIES = {
  // 亚马逊热带雨林
  amazon_rainforest: {
    name: '亚马逊热带雨林',
    color: '#00aa44',
    opacity: 0.35,
    boundary: [
      [-80,5],[-75,8],[-70,10],[-65,8],[-60,5],[-55,2],[-50,-2],[-50,-8],
      [-55,-12],[-60,-15],[-65,-12],[-70,-8],[-75,-3],[-80,0],[-80,5]
    ]
  },
  // 刚果热带雨林
  congo_rainforest: {
    name: '刚果热带雨林',
    color: '#00aa44',
    opacity: 0.35,
    boundary: [
      [15,5],[18,4],[22,3],[26,2],[28,0],[30,-2],[30,-5],[28,-6],
      [24,-5],[20,-4],[16,-2],[14,0],[13,3],[15,5]
    ]
  },
  // 东南亚热带雨林
  se_asia_rainforest: {
    name: '东南亚热带雨林',
    color: '#00aa44',
    opacity: 0.35,
    boundary: [
      [98,8],[100,6],[102,4],[104,2],[106,0],[108,-2],[110,-4],[112,-6],
      [114,-7],[116,-8],[118,-6],[116,-4],[114,-2],[112,0],[110,2],[108,4],
      [106,6],[104,8],[100,8],[98,8]
    ]
  },
  // 撒哈拉沙漠
  sahara_desert: {
    name: '撒哈拉沙漠',
    color: '#ddaa44',
    opacity: 0.35,
    boundary: [
      [-15,30],[-10,33],[-5,35],[0,36],[5,35],[10,33],[15,30],[20,28],
      [25,25],[30,22],[33,20],[35,18],[33,16],[30,18],[25,20],[20,22],
      [15,24],[10,25],[5,25],[0,24],[-5,25],[-10,27],[-15,30]
    ]
  },
  // 阿拉伯沙漠
  arabian_desert: {
    name: '阿拉伯沙漠',
    color: '#ddaa44',
    opacity: 0.35,
    boundary: [
      [35,30],[38,28],[42,25],[45,22],[48,20],[50,22],[52,24],[55,26],
      [58,28],[56,30],[52,30],[48,28],[44,28],[40,30],[35,30]
    ]
  },
  // 戈壁沙漠
  gobi_desert: {
    name: '戈壁沙漠',
    color: '#cc9933',
    opacity: 0.35,
    boundary: [
      [90,42],[95,44],[100,45],[105,44],[110,42],[115,40],[118,38],
      [115,36],[110,36],[105,38],[100,40],[95,40],[90,42]
    ]
  },
  // 地中海气候区（地中海沿岸）
  mediterranean: {
    name: '地中海气候',
    color: '#ff8844',
    opacity: 0.3,
    boundary: [
      [-5,36],[0,38],[5,40],[10,42],[15,42],[20,40],[25,38],[30,36],
      [35,34],[35,32],[30,32],[25,34],[20,36],[15,38],[10,38],[5,36],
      [0,36],[-5,36]
    ]
  },
  // 印度热带季风
  indian_monsoon: {
    name: '印度热带季风',
    color: '#2288cc',
    opacity: 0.3,
    boundary: [
      [68,25],[72,22],[75,18],[78,14],[80,10],[82,8],[84,10],[86,15],
      [88,20],[90,22],[88,25],[85,28],[80,30],[75,28],[70,26],[68,25]
    ]
  },
  // 中国亚热带季风
  china_subtropical: {
    name: '中国亚热带季风',
    color: '#44bb88',
    opacity: 0.3,
    boundary: [
      [100,30],[105,28],[110,26],[115,28],[118,30],[120,32],[122,30],
      [121,28],[118,25],[115,23],[110,22],[108,24],[105,26],[100,28],[100,30]
    ]
  },
  // 西欧温带海洋性
  europe_oceanic: {
    name: '西欧温带海洋性',
    color: '#66aa88',
    opacity: 0.3,
    boundary: [
      [-10,36],[-8,38],[-5,42],[-3,45],[0,48],[2,50],[5,52],[8,54],
      [10,56],[12,58],[15,60],[18,62],[20,60],[18,56],[15,52],[12,48],
      [8,45],[5,42],[2,40],[0,38],[-5,36],[-10,36]
    ]
  },
  // 澳大利亚热带草原
  australia_savanna: {
    name: '澳大利亚热带草原',
    color: '#88cc44',
    opacity: 0.3,
    boundary: [
      [115,-12],[120,-12],[125,-13],[130,-12],[135,-13],[140,-15],[145,-16],
      [148,-18],[150,-20],[148,-22],[145,-22],[140,-20],[135,-18],[130,-17],
      [125,-16],[120,-15],[115,-14],[115,-12]
    ]
  },
  // 北美大草原
  north_america_prairie: {
    name: '北美温带大陆性',
    color: '#aa9955',
    opacity: 0.3,
    boundary: [
      [-105,50],[-100,52],[-95,52],[-90,50],[-85,48],[-82,45],[-85,42],
      [-90,40],[-95,38],[-100,38],[-105,40],[-110,42],[-115,45],[-115,48],
      [-110,50],[-105,50]
    ]
  },
  // 南极冰盖
  antarctic_ice: {
    name: '南极冰盖',
    color: '#ddeeff',
    opacity: 0.4,
    boundary: [
      [-180,-65],[-150,-68],[-120,-70],[-90,-72],[-60,-68],[-30,-65],
      [0,-68],[30,-70],[60,-72],[90,-70],[120,-68],[150,-66],[180,-65],
      [180,-90],[-180,-90],[-180,-65]
    ]
  },
  // 西伯利亚亚寒带
  siberia_subarctic: {
    name: '西伯利亚亚寒带',
    color: '#8899aa',
    opacity: 0.3,
    boundary: [
      [60,55],[70,58],[80,60],[90,62],[100,65],[110,68],[120,70],[130,68],
      [140,65],[150,62],[160,60],[170,58],[170,55],[160,52],[150,50],
      [140,48],[130,48],[120,50],[110,50],[100,48],[90,50],[80,52],[70,52],[60,55]
    ]
  }
};

export class ClimateZone extends BaseComponent {
  constructor() {
    super({
      id: 'climate_zone',
      name: '气候带',
      category: 'climate',
      description: '气候带真实范围（多边形）',
      params: {
        type: { type: 'string', description: '气候类型ID' },
        lat: { type: 'number', description: '中心纬度（自定义位置时用）' },
        lng: { type: 'number', description: '中心经度（自定义位置时用）' },
        radius: { type: 'number', default: 10 }
      },
      keywords: ['气候', '气候带', '热带', '温带', '寒带', '地中海', '季风', '雨林', '沙漠', '草原', '亚寒带', '苔原']
    });
  }

  render(scene, params = {}) {
    this.params = { type: '', lat: null, lng: null, radius: 10, ...params };
    
    // 如果指定了预设类型
    if (this.params.type && CLIMATE_BOUNDARIES[this.params.type]) {
      this._renderPreset(CLIMATE_BOUNDARIES[this.params.type]);
      return;
    }
    
    // 如果有 boundary 参数（直接传入多边形）
    if (this.params.boundary) {
      this._renderPolygon(this.params.boundary, this.params.color || '#44aa88', this.params.name || '');
      return;
    }
    
    // 否则用关键词匹配最近的气候带
    this._renderNearestMatch();
  }

  _renderPreset(zone) {
    this._renderPolygon(zone.boundary, zone.color, zone.name, zone.opacity);
  }

  _renderPolygon(boundary, color, name, opacity = 0.3) {
    if (!boundary || boundary.length < 3) return;
    
    // 将经纬度多边形转换为球面顶点
    const outerVertices = [];
    for (const [lng, lat] of boundary) {
      outerVertices.push(latLngToVector3(lat, lng, 1.002));
    }
    
    // 用三角形扇形填充多边形（中心点 + 边界点对）
    const center = new THREE.Vector3();
    for (const v of outerVertices) center.add(v);
    center.divideScalar(outerVertices.length);
    // 投影到球面
    center.normalize().multiplyScalar(1.002);
    
    const positions = [];
    for (let i = 0; i < outerVertices.length; i++) {
      const next = (i + 1) % outerVertices.length;
      positions.push(
        center.x, center.y, center.z,
        outerVertices[i].x, outerVertices[i].y, outerVertices[i].z,
        outerVertices[next].x, outerVertices[next].y, outerVertices[next].z
      );
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.computeVertexNormals();
    
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity: opacity,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    
    this.group.add(new THREE.Mesh(geometry, material));
    
    // 边界线
    const linePoints = [...outerVertices, outerVertices[0]];
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(linePoints);
    const lineMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity: 0.6
    });
    this.group.add(new THREE.Line(lineGeometry, lineMaterial));
  }

  _renderNearestMatch() {
    // 根据 lat/lng 找最近的气候带
    const lat = this.params.lat || 0;
    const lng = this.params.lng || 0;
    
    let nearest = null;
    let minDist = Infinity;
    
    for (const [id, zone] of Object.entries(CLIMATE_BOUNDARIES)) {
      const centerLat = zone.boundary.reduce((s, p) => s + p[1], 0) / zone.boundary.length;
      const centerLng = zone.boundary.reduce((s, p) => s + p[0], 0) / zone.boundary.length;
      const dist = Math.hypot(lat - centerLat, lng - centerLng);
      if (dist < minDist) {
        minDist = dist;
        nearest = zone;
      }
    }
    
    if (nearest) {
      this._renderPreset(nearest);
    }
  }
}

// 导出边界数据供 AI 参考
export { CLIMATE_BOUNDARIES };

export default ClimateZone;
