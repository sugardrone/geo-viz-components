import * as THREE from "three";
/**
 * Globe - 地球模型（增强版）
 * 真实纹理 + 大气光晕 + 晨昏线
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
        radius: { type: 'number', default: 1 },
        showAtmosphere: { type: 'boolean', default: true },
        showGraticule: { type: 'boolean', default: false },
        rotateSpeed: { type: 'number', default: 0.0005 }
      },
      keywords: ['地球', '世界', '全球', '地图']
    });
    
    this.radius = 1;
    this._autoRotate = false;
  }

  render(scene, params = {}) {
    this.params = {
      radius: 1,
      showAtmosphere: true,
      showGraticule: false,
      rotateSpeed: 0.0005,
      ...params
    };
    
    this.radius = this.params.radius;
    this._createSphere();
    
    if (this.params.showAtmosphere) {
      this._createAtmosphere();
    }
    
    if (this.params.showGraticule) {
      this._createGraticule();
    }
  }

  _createSphere() {
    const geometry = new THREE.SphereGeometry(this.radius, 64, 64);
    
    // 先用纯色确保 3D 渲染正常
    const material = new THREE.MeshPhongMaterial({
      color: 0x2266aa,
      shininess: 25,
      specular: 0x444444
    });
    
    this._sphere = new THREE.Mesh(geometry, material);
    this.group.add(this._sphere);
    
    // 加载纹理
    const loader = new THREE.TextureLoader();
    loader.load('/vendor/earth_texture.jpg', (texture) => {
      material.map = texture;
      material.needsUpdate = true;
      console.log('纹理加载成功');
    }, undefined, (err) => {
      console.error('纹理加载失败:', err);
      // 回退到程序化纹理
      this._fallbackTexture(material);
    });
    
    this._createGraticuleLines();
  }
  
  _fallbackTexture(material) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#0d2847';
    ctx.fillRect(0, 0, 1024, 512);
    
    const mc = (lng, lat) => [(lng + 180) / 360 * 1024, (90 - lat) / 180 * 512];
    const land = (coords, color) => {
      ctx.beginPath();
      ctx.moveTo(coords[0][0], coords[0][1]);
      for (let i = 1; i < coords.length; i++) ctx.lineTo(coords[i][0], coords[i][1]);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    };
    
    land([mc(-10,70),mc(20,60),mc(50,50),mc(80,42),mc(110,35),mc(130,35),mc(145,50),mc(140,65),mc(100,72),mc(50,70),mc(0,72),mc(-10,70)], '#1a7b2a');
    land([mc(-15,37),mc(10,35),mc(30,22),mc(50,2),mc(42,-15),mc(25,-34),mc(12,-25),mc(5,5),mc(-12,15),mc(-15,37)], '#2a8b1a');
    land([mc(-170,68),mc(-120,60),mc(-80,48),mc(-68,44),mc(-85,30),mc(-115,30),mc(-135,52),mc(-170,68)], '#1e8b22');
    land([mc(-80,12),mc(-50,0),mc(-40,-15),mc(-55,-35),mc(-72,-50),mc(-62,-42),mc(-70,-15),mc(-80,12)], '#1a9b20');
    land([mc(115,-12),mc(150,-20),mc(148,-36),mc(120,-34),mc(113,-18),mc(115,-12)], '#3a9b15');
    ctx.fillStyle = '#d0e0f0';
    ctx.fillRect(0, 460, 1024, 52);
    
    material.map = new THREE.CanvasTexture(canvas);
    material.needsUpdate = true;
  }

  _createGraticuleLines() {
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.06
    });
    
    // 经线
    for (let lng = -180; lng < 180; lng += 30) {
      const points = [];
      for (let lat = -85; lat <= 85; lat += 1) {
        points.push(latLngToVector3(lat, lng, this.radius * 1.001));
      }
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      this.group.add(new THREE.Line(geometry, lineMaterial));
    }
    
    // 纬线
    for (let lat = -60; lat <= 60; lat += 30) {
      const points = [];
      for (let lng = -180; lng <= 180; lng += 1) {
        points.push(latLngToVector3(lat, lng, this.radius * 1.001));
      }
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      this.group.add(new THREE.Line(geometry, lineMaterial));
    }
  }

  _createAtmosphere() {
    // 内层大气（蓝色光晕）
    const geometry = new THREE.SphereGeometry(this.radius * 1.015, 128, 128);
    const material = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vec3 viewDir = normalize(-vPosition);
          float rim = 1.0 - max(0.0, dot(viewDir, vNormal));
          float intensity = pow(rim, 3.0) * 0.8;
          vec3 color = mix(vec3(0.1, 0.4, 0.8), vec3(0.2, 0.6, 1.0), rim);
          gl_FragColor = vec4(color, intensity);
        }
      `,
      transparent: true,
      side: THREE.FrontSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    this._atmosphere = new THREE.Mesh(geometry, material);
    this.group.add(this._atmosphere);
    
    // 外层辉光
    const glowGeometry = new THREE.SphereGeometry(this.radius * 1.08, 64, 64);
    const glowMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 4.0);
          gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity * 0.4;
        }
      `,
      transparent: true,
      side: THREE.BackSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    this._glow = new THREE.Mesh(glowGeometry, glowMaterial);
    this.group.add(this._glow);
  }

  _createGraticule() {
    // 已在 _createSphere 中实现
  }

  getRadius() {
    return this.radius;
  }

  update(params, delta) {
    if (this.params.rotateSpeed) {
      this.group.rotation.y += this.params.rotateSpeed;
    }
  }
}

export default Globe;
