import * as THREE from "three";
/**
 * Terrain - 地形（真实边界版）
 * 用多边形在球面上渲染真实地形范围
 */

import { BaseComponent } from '../core/BaseComponent.js';
import { latLngToVector3 } from '../core/Utils.js';

// 主要地形简化边界
const TERRAIN_BOUNDARIES = {
  // 青藏高原
  tibetan_plateau: {
    name: '青藏高原',
    color: '#aa8855',
    type: 'plateau',
    boundary: [
      [75,35],[78,36],[82,37],[86,38],[90,38],[94,37],[98,36],[100,34],
      [102,32],[100,30],[96,28],[92,28],[88,28],[84,30],[80,32],[76,34],[75,35]
    ]
  },
  // 喜马拉雅山脉
  himalayas: {
    name: '喜马拉雅山脉',
    color: '#8B4513',
    type: 'mountain',
    boundary: [
      [72,34],[74,35],[76,35],[78,35],[80,34],[82,33],[84,32],[86,30],
      [88,28],[90,28],[92,28],[94,28],[96,29],[98,30],[100,30],
      [98,28],[96,27],[94,27],[92,27],[90,27],[88,27],[86,28],[84,29],
      [82,30],[80,31],[78,32],[76,33],[74,33],[72,34]
    ]
  },
  // 安第斯山脉
  andes: {
    name: '安第斯山脉',
    color: '#8B4513',
    type: 'mountain',
    boundary: [
      [-70,-50],[-68,-48],[-70,-45],[-69,-42],[-68,-40],[-68,-38],[-69,-35],
      [-70,-32],[-70,-28],[-72,-25],[-74,-22],[-76,-18],[-78,-15],[-78,-12],
      [-80,-8],[-80,-5],[-80,-2],[-78,0],[-76,2],[-78,5],
      [-80,2],[-78,-2],[-76,-5],[-74,-8],[-72,-12],[-70,-15],[-68,-18],
      [-66,-22],[-65,-25],[-66,-28],[-67,-32],[-68,-35],[-67,-38],[-66,-40],
      [-68,-42],[-70,-45],[-68,-48],[-70,-50]
    ]
  },
  // 落基山脉
  rockies: {
    name: '落基山脉',
    color: '#8B4513',
    type: 'mountain',
    boundary: [
      [-120,50],[-118,52],[-116,54],[-115,56],[-118,58],[-120,60],
      [-122,58],[-124,55],[-122,52],[-120,50],
      [-118,48],[-116,46],[-115,44],[-114,42],[-112,40],[-110,38],
      [-108,36],[-106,34],[-108,32],[-110,34],[-112,36],[-114,38],
      [-116,40],[-118,42],[-118,45],[-118,48],[-120,50]
    ]
  },
  // 巴西高原
  brazilian_highlands: {
    name: '巴西高原',
    color: '#aa8855',
    type: 'plateau',
    boundary: [
      [-50,-5],[-45,-8],[-42,-10],[-40,-12],[-38,-15],[-38,-18],[-40,-20],
      [-42,-22],[-45,-22],[-48,-20],[-50,-18],[-52,-15],[-54,-12],[-52,-10],
      [-50,-8],[-50,-5]
    ]
  },
  // 东非高原
  east_african_plateau: {
    name: '东非高原',
    color: '#aa8855',
    type: 'plateau',
    boundary: [
      [30,-5],[32,-3],[35,0],[37,3],[38,5],[40,3],[42,0],[42,-3],
      [40,-5],[38,-8],[36,-10],[34,-10],[32,-8],[30,-5]
    ]
  },
  // 德干高原
  deccan_plateau: {
    name: '德干高原',
    color: '#aa8855',
    type: 'plateau',
    boundary: [
      [73,20],[75,18],[78,16],[80,14],[80,12],[78,10],[76,8],
      [74,10],[72,12],[72,15],[73,18],[73,20]
    ]
  },
  // 亚马逊平原
  amazon_basin: {
    name: '亚马逊平原',
    color: '#55aa33',
    type: 'plain',
    boundary: [
      [-75,5],[-70,8],[-65,8],[-60,5],[-55,2],[-50,-2],[-50,-8],
      [-55,-10],[-60,-10],[-65,-8],[-70,-5],[-75,0],[-75,5]
    ]
  },
  // 西西伯利亚平原
  west_siberian_plain: {
    name: '西西伯利亚平原',
    color: '#88aa66',
    type: 'plain',
    boundary: [
      [60,55],[65,58],[70,62],[75,65],[80,68],[85,70],[90,68],
      [85,65],[80,62],[75,58],[70,55],[65,52],[60,52],[60,55]
    ]
  }
};

export class Terrain extends BaseComponent {
  constructor() {
    super({
      id: 'terrain',
      name: '地形',
      category: 'terrain',
      description: '真实地形范围（多边形）',
      params: {
        type: { type: 'string', description: '地形类型ID' },
        lat: { type: 'number', description: '中心纬度' },
        lng: { type: 'number', description: '中心经度' },
        radius: { type: 'number', default: 10 }
      },
      keywords: ['山脉', '高原', '平原', '盆地', '丘陵', '地形', '地势', '喜马拉雅', '安第斯', '落基', '青藏', '巴西高原']
    });
  }

  render(scene, params = {}) {
    this.params = { type: '', lat: null, lng: null, radius: 10, ...params };
    
    // 如果指定了预设类型
    if (this.params.type && TERRAIN_BOUNDARIES[this.params.type]) {
      this._renderPreset(TERRAIN_BOUNDARIES[this.params.type]);
      return;
    }
    
    // 如果有 boundary 参数
    if (this.params.boundary) {
      this._renderPolygon(this.params.boundary, this.params.color || '#aa8855', this.params.name || '', this.params.type || 'terrain');
      return;
    }
    
    // 匹配最近的地形
    this._renderNearestMatch();
  }

  _renderPreset(terrain) {
    this._renderPolygon(terrain.boundary, terrain.color, terrain.name, terrain.type);
  }

  _renderPolygon(boundary, color, name, terrainType = 'terrain', opacity = 0.3) {
    if (!boundary || boundary.length < 3) return;
    
    const outerVertices = [];
    for (const [lng, lat] of boundary) {
      outerVertices.push(latLngToVector3(lat, lng, 1.002));
    }
    
    // 中心点（投影到球面）
    const center = new THREE.Vector3();
    for (const v of outerVertices) center.add(v);
    center.divideScalar(outerVertices.length);
    center.normalize().multiplyScalar(1.002);
    
    // 三角形扇形填充
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
    
    // 不同地形类型用不同颜色深度
    const opacityMap = { mountain: 0.4, plateau: 0.35, plain: 0.25, basin: 0.3 };
    
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity: opacityMap[terrainType] || 0.3,
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
      opacity: 0.7
    });
    this.group.add(new THREE.Line(lineGeometry, lineMaterial));
    
    // 地形类型标记（山脉用▲，高原用▬）
    if (name && terrainType === 'mountain') {
      this._addPeakMarkers(boundary, color);
    }
  }

  _addPeakMarkers(boundary, color) {
    // 在边界中心添加山峰标记
    const centerLng = boundary.reduce((s, p) => s + p[0], 0) / boundary.length;
    const centerLat = boundary.reduce((s, p) => s + p[1], 0) / boundary.length;
    
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    // 画山峰符号
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(32, 8);
    ctx.lineTo(56, 56);
    ctx.lineTo(8, 56);
    ctx.closePath();
    ctx.fill();
    
    // 白色雪顶
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(32, 8);
    ctx.lineTo(40, 24);
    ctx.lineTo(24, 24);
    ctx.closePath();
    ctx.fill();
    
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: true
    });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.position.copy(latLngToVector3(centerLat, centerLng, 1.008));
    sprite.scale.set(0.04, 0.04, 1);
    this.group.add(sprite);
  }

  _renderNearestMatch() {
    const lat = this.params.lat || 0;
    const lng = this.params.lng || 0;
    
    let nearest = null;
    let minDist = Infinity;
    
    for (const [id, terrain] of Object.entries(TERRAIN_BOUNDARIES)) {
      const centerLat = terrain.boundary.reduce((s, p) => s + p[1], 0) / terrain.boundary.length;
      const centerLng = terrain.boundary.reduce((s, p) => s + p[0], 0) / terrain.boundary.length;
      const dist = Math.hypot(lat - centerLat, lng - centerLng);
      if (dist < minDist) {
        minDist = dist;
        nearest = terrain;
      }
    }
    
    if (nearest) {
      this._renderPreset(nearest);
    }
  }
}

export { TERRAIN_BOUNDARIES };

export default Terrain;
