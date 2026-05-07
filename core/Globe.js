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
    
    // 生成高质量程序化地球纹理
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    
    // 海洋 - 深邃渐变
    const gradient = ctx.createLinearGradient(0, 0, 0, 1024);
    gradient.addColorStop(0, '#0a1628');
    gradient.addColorStop(0.15, '#0d2137');
    gradient.addColorStop(0.3, '#102a44');
    gradient.addColorStop(0.5, '#133552');
    gradient.addColorStop(0.7, '#102a44');
    gradient.addColorStop(0.85, '#0d2137');
    gradient.addColorStop(1, '#0a1628');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 2048, 1024);
    
    // 添加海洋纹理细节
    ctx.globalAlpha = 0.15;
    for (let i = 0; i < 3000; i++) {
      const x = Math.random() * 2048;
      const y = Math.random() * 1024;
      const size = Math.random() * 2 + 0.5;
      ctx.fillStyle = `hsl(200, 60%, ${20 + Math.random() * 15}%)`;
      ctx.fillRect(x, y, size, size * 0.6);
    }
    ctx.globalAlpha = 1.0;
    
    // 大陆 - 多层次绿色
    const drawContinent = (paths, baseColor, variation) => {
      paths.forEach(path => {
        ctx.beginPath();
        ctx.moveTo(path[0][0], path[0][1]);
        for (let i = 1; i < path.length; i++) {
          ctx.lineTo(path[i][0], path[i][1]);
        }
        ctx.closePath();
        
        // 渐变填充
        const cx = path.reduce((s, p) => s + p[0], 0) / path.length;
        const cy = path.reduce((s, p) => s + p[1], 0) / path.length;
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 150);
        grad.addColorStop(0, baseColor);
        grad.addColorStop(1, variation);
        ctx.fillStyle = grad;
        ctx.fill();
        
        // 边缘描边
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    };
    
    // 简化的大陆轮廓（相对经纬度映射到画布）
    const mapCoord = (lng, lat) => [
      (lng + 180) / 360 * 2048,
      (90 - lat) / 180 * 1024
    ];
    
    // 欧亚大陆
    drawContinent([[
      mapCoord(-10, 70), mapCoord(0, 60), mapCoord(30, 55), mapCoord(50, 50),
      mapCoord(70, 45), mapCoord(90, 40), mapCoord(110, 35), mapCoord(120, 30),
      mapCoord(130, 35), mapCoord(140, 40), mapCoord(145, 50), mapCoord(140, 60),
      mapCoord(120, 65), mapCoord(100, 70), mapCoord(80, 72), mapCoord(60, 68),
      mapCoord(40, 65), mapCoord(20, 68), mapCoord(0, 72), mapCoord(-10, 70)
    ]], '#1a5c2a', '#0d3318');
    
    // 非洲
    drawContinent([[
      mapCoord(-15, 35), mapCoord(0, 37), mapCoord(10, 35), mapCoord(15, 30),
      mapCoord(20, 25), mapCoord(35, 20), mapCoord(42, 12), mapCoord(50, 5),
      mapCoord(48, -5), mapCoord(42, -15), mapCoord(35, -25), mapCoord(28, -33),
      mapCoord(18, -35), mapCoord(12, -28), mapCoord(10, -15), mapCoord(5, 0),
      mapCoord(-5, 5), mapCoord(-10, 10), mapCoord(-15, 15), mapCoord(-18, 22),
      mapCoord(-15, 35)
    ]], '#2a6b1a', '#1a4a12');
    
    // 北美
    drawContinent([[
      mapCoord(-170, 65), mapCoord(-160, 60), mapCoord(-140, 62), mapCoord(-120, 58),
      mapCoord(-100, 55), mapCoord(-85, 50), mapCoord(-75, 45), mapCoord(-65, 42),
      mapCoord(-70, 35), mapCoord(-80, 30), mapCoord(-90, 28), mapCoord(-100, 25),
      mapCoord(-110, 28), mapCoord(-120, 32), mapCoord(-125, 40), mapCoord(-130, 48),
      mapCoord(-140, 55), mapCoord(-155, 58), mapCoord(-170, 65)
    ]], '#1e6b22', '#124a15');
    
    // 南美
    drawContinent([[
      mapCoord(-80, 12), mapCoord(-65, 10), mapCoord(-50, 5), mapCoord(-45, -5),
      mapCoord(-40, -15), mapCoord(-45, -25), mapCoord(-55, -30), mapCoord(-65, -35),
      mapCoord(-70, -42), mapCoord(-75, -50), mapCoord(-72, -55), mapCoord(-65, -52),
      mapCoord(-60, -45), mapCoord(-65, -35), mapCoord(-70, -25), mapCoord(-75, -15),
      mapCoord(-78, -5), mapCoord(-80, 5), mapCoord(-80, 12)
    ]], '#1a7a20', '#0d5515');
    
    // 澳大利亚
    drawContinent([[
      mapCoord(115, -12), mapCoord(130, -12), mapCoord(145, -15), mapCoord(152, -20),
      mapCoord(155, -28), mapCoord(150, -35), mapCoord(140, -38), mapCoord(130, -35),
      mapCoord(118, -32), mapCoord(115, -25), mapCoord(112, -18), mapCoord(115, -12)
    ]], '#3a7a15', '#2a5a10');
    
    // 撒哈拉/中东沙漠
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#c4a842';
    ctx.beginPath();
    const saharaCenter = mapCoord(15, 25);
    ctx.ellipse(saharaCenter[0], saharaCenter[1], 120, 60, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;
    
    // 冰盖
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#dde8f0';
    // 北极
    ctx.fillRect(0, 0, 2048, 60);
    // 南极
    ctx.fillRect(0, 940, 2048, 84);
    ctx.globalAlpha = 1.0;
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.anisotropy = 4;
    
    const material = new THREE.MeshPhongMaterial({
      map: texture,
      shininess: 15,
      specular: new THREE.Color(0x222244),
      emissive: new THREE.Color(0x010108),
      emissiveIntensity: 0.1
    });
    
    this._sphere = new THREE.Mesh(geometry, material);
    this.group.add(this._sphere);
    
    // 添加经纬线（更细更淡）
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
    if (this.params.rotateSpeed && this._sphere) {
      this._sphere.rotation.y += this.params.rotateSpeed;
      if (this._atmosphere) this._atmosphere.rotation.y += this.params.rotateSpeed;
      if (this._glow) this._glow.rotation.y += this.params.rotateSpeed;
    }
  }
}

export default Globe;
