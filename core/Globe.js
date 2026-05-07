import * as THREE from "three";
/**
 * Globe - 地球模型
 * 必加载组件，提供地球基础场景
 */

import { BaseComponent } from './BaseComponent.js';
import { latLngToVector3, Colors } from './Utils.js';

export class Globe extends BaseComponent {
  constructor() {
    super({
      id: 'globe',
      name: '地球',
      category: 'core',
      description: '3D 地球模型，支持纹理贴图和交互',
      params: {
        radius: { type: 'number', default: 1, description: '地球半径' },
        texture: { type: 'string', default: 'blue_marble', description: '纹理类型' },
        showAtmosphere: { type: 'boolean', default: true, description: '显示大气层' },
        showGraticule: { type: 'boolean', default: false, description: '显示经纬网' },
        rotateSpeed: { type: 'number', default: 0.001, description: '自转速度' }
      },
      keywords: ['地球', '世界', '全球', '地图']
    });
    
    this.radius = 1;
    this._autoRotate = false;
  }

  render(scene, params = {}) {
    this.params = {
      radius: 1,
      texture: 'blue_marble',
      showAtmosphere: true,
      showGraticule: false,
      rotateSpeed: 0.001,
      ...params
    };
    
    this.radius = this.params.radius;
    
    // 地球球体
    this._createSphere();
    
    // 大气层
    if (this.params.showAtmosphere) {
      this._createAtmosphere();
    }
    
    // 经纬网
    if (this.params.showGraticule) {
      this._createGraticule();
    }
  }

  _createSphere() {
    const geometry = new THREE.SphereGeometry(this.radius, 64, 64);
    
    // 程序化地球纹理
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // 海洋底色
    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, '#1a3a5c');    // 北极
    gradient.addColorStop(0.2, '#1e5a8a');  // 北温带
    gradient.addColorStop(0.5, '#2980b9');  // 赤道
    gradient.addColorStop(0.8, '#1e5a8a');  // 南温带
    gradient.addColorStop(1, '#1a3a5c');    // 南极
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1024, 512);
    
    // 简化的大陆轮廓（示意用）
    ctx.fillStyle = '#2ecc71';
    ctx.globalAlpha = 0.6;
    
    // 欧亚大陆
    ctx.beginPath();
    ctx.ellipse(650, 180, 120, 80, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // 非洲
    ctx.beginPath();
    ctx.ellipse(560, 300, 50, 90, 0.2, 0, Math.PI * 2);
    ctx.fill();
    
    // 北美
    ctx.beginPath();
    ctx.ellipse(250, 170, 80, 70, -0.3, 0, Math.PI * 2);
    ctx.fill();
    
    // 南美
    ctx.beginPath();
    ctx.ellipse(300, 340, 40, 80, 0.1, 0, Math.PI * 2);
    ctx.fill();
    
    // 澳大利亚
    ctx.beginPath();
    ctx.ellipse(820, 350, 40, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.globalAlpha = 1.0;
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    
    const material = new THREE.MeshPhongMaterial({
      map: texture,
      shininess: 25,
      specular: 0x333333
    });
    
    this._sphere = new THREE.Mesh(geometry, material);
    this.group.add(this._sphere);
  }

  _createAtmosphere() {
    const geometry = new THREE.SphereGeometry(this.radius * 1.02, 64, 64);
    const material = new THREE.MeshBasicMaterial({
      color: 0x4da6ff,
      transparent: true,
      opacity: 0.08,
      side: THREE.BackSide
    });
    this._atmosphere = new THREE.Mesh(geometry, material);
    this.group.add(this._atmosphere);
  }

  _createGraticule() {
    const material = new THREE.LineBasicMaterial({ 
      color: 0xffffff, 
      transparent: true, 
      opacity: 0.1 
    });
    
    // 经线
    for (let lng = -180; lng < 180; lng += 30) {
      const points = [];
      for (let lat = -90; lat <= 90; lat += 2) {
        points.push(latLngToVector3(lat, lng, this.radius * 1.001));
      }
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      this.group.add(new THREE.Line(geometry, material));
    }
    
    // 纬线
    for (let lat = -60; lat <= 60; lat += 30) {
      const points = [];
      for (let lng = -180; lng <= 180; lng += 2) {
        points.push(latLngToVector3(lat, lng, this.radius * 1.001));
      }
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      this.group.add(new THREE.Line(geometry, material));
    }
  }

  /**
   * 获取地球半径（供其他组件使用）
   */
  getRadius() {
    return this.radius;
  }

  update(params, delta) {
    if (this.params.rotateSpeed && this._sphere) {
      this._sphere.rotation.y += this.params.rotateSpeed;
      if (this._atmosphere) this._atmosphere.rotation.y += this.params.rotateSpeed;
    }
  }
}

export default Globe;
