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
    
    // 加载真实地球纹理
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load('/vendor/earth_texture.jpg', 
      (tex) => { console.log('纹理加载成功:', tex.image.width, tex.image.height); },
      undefined,
      (err) => { console.error('纹理加载失败:', err); }
    );
    texture.anisotropy = 4;
    
    const material = new THREE.MeshPhongMaterial({
      map: texture,
      shininess: 15,
      specular: new THREE.Color(0x222244),
      emissive: new THREE.Color(0x020210),
      emissiveIntensity: 0.15
    });
    
    this._sphere = new THREE.Mesh(geometry, material);
    this.group.add(this._sphere);
    
    // 添加经纬线
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
