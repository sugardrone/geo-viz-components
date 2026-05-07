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
    const geometry = new THREE.SphereGeometry(this.radius, 128, 128);
    
    // 程序化地球纹理（保证 WebGL 兼容）
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    
    // 海洋底色
    const oceanGrad = ctx.createLinearGradient(0, 0, 0, 1024);
    oceanGrad.addColorStop(0, '#0a1628');
    oceanGrad.addColorStop(0.3, '#0d2847');
    oceanGrad.addColorStop(0.5, '#103566');
    oceanGrad.addColorStop(0.7, '#0d2847');
    oceanGrad.addColorStop(1, '#0a1628');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, 2048, 1024);
    
    // 海洋细节
    ctx.globalAlpha = 0.12;
    for (let i = 0; i < 5000; i++) {
      ctx.fillStyle = `hsl(200, 50%, ${15 + Math.random() * 20}%)`;
      ctx.fillRect(Math.random() * 2048, Math.random() * 1024, Math.random() * 3 + 1, Math.random() * 2 + 0.5);
    }
    ctx.globalAlpha = 1.0;
    
    // 坐标映射
    const mc = (lng, lat) => [(lng + 180) / 360 * 2048, (90 - lat) / 180 * 1024];
    
    // 绘制大陆
    const drawLand = (coords, base, edge) => {
      ctx.beginPath();
      ctx.moveTo(coords[0][0], coords[0][1]);
      for (let i = 1; i < coords.length; i++) ctx.lineTo(coords[i][0], coords[i][1]);
      ctx.closePath();
      const g = ctx.createLinearGradient(coords[0][0], coords[0][1], coords[coords.length-1][0], coords[coords.length-1][1]);
      g.addColorStop(0, base);
      g.addColorStop(1, edge);
      ctx.fillStyle = g;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 0.8;
      ctx.stroke();
    };
    
    // 欧亚大陆
    drawLand([mc(-10,70),mc(0,62),mc(20,58),mc(40,52),mc(60,48),mc(80,42),mc(100,38),mc(120,32),mc(130,35),mc(140,42),mc(145,52),mc(140,62),mc(120,68),mc(90,72),mc(60,70),mc(30,68),mc(0,72),mc(-10,70)], '#1a6b2a', '#0d4418');
    
    // 非洲
    drawLand([mc(-15,37),mc(5,37),mc(12,33),mc(18,28),mc(30,22),mc(42,12),mc(50,2),mc(45,-8),mc(40,-18),mc(33,-28),mc(25,-34),mc(17,-35),mc(12,-25),mc(9,-12),mc(3,5),mc(-5,8),mc(-12,15),mc(-17,25),mc(-15,37)], '#2a7b1a', '#1a5512');
    
    // 北美
    drawLand([mc(-168,68),mc(-145,65),mc(-120,60),mc(-95,55),mc(-80,48),mc(-68,44),mc(-75,35),mc(-85,30),mc(-100,26),mc(-115,30),mc(-125,42),mc(-135,52),mc(-155,60),mc(-168,68)], '#1e7b22', '#125515');
    
    // 南美
    drawLand([mc(-80,12),mc(-60,8),mc(-48,0),mc(-42,-10),mc(-40,-22),mc(-50,-32),mc(-65,-40),mc(-72,-50),mc(-68,-55),mc(-62,-48),mc(-58,-38),mc(-65,-25),mc(-72,-12),mc(-78,0),mc(-80,12)], '#1a8b20', '#0d6515');
    
    // 澳大利亚
    drawLand([mc(115,-12),mc(132,-12),mc(148,-18),mc(153,-28),mc(148,-36),mc(135,-38),mc(120,-34),mc(115,-25),mc(113,-18),mc(115,-12)], '#3a8b15', '#2a6510');
    
    // 格陵兰
    drawLand([mc(-55,60),mc(-40,65),mc(-25,72),mc(-18,78),mc(-30,82),mc(-50,82),mc(-60,78),mc(-55,70),mc(-55,60)], '#c8d8e8', '#a0b8d0');
    
    // 南极
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = '#d0e0f0';
    ctx.fillRect(0, 920, 2048, 104);
    ctx.globalAlpha = 1.0;
    
    // 撒哈拉
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#c4a842';
    ctx.beginPath();
    const sc = mc(18, 24);
    ctx.ellipse(sc[0], sc[1], 100, 50, 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 4;
    
    const material = new THREE.MeshPhongMaterial({
      map: texture,
      shininess: 20,
      specular: new THREE.Color(0x333355),
      emissive: new THREE.Color(0x020210),
      emissiveIntensity: 0.12
    });
    
    this._sphere = new THREE.Mesh(geometry, material);
    this.group.add(this._sphere);
    
    this._createGraticuleLines();
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
