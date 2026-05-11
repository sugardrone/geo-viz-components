import * as THREE from "three";
/**
 * Globe - 地球模型
 * 真实纹理 + 经纬网
 */

import { BaseComponent } from './BaseComponent.js';
import { latLngToVector3 } from './Utils.js';

export class Globe extends BaseComponent {
  constructor() {
    super({
      id: 'globe',
      name: '地球',
      category: 'core',
      description: '3D 地球模型，支持纹理贴图和交互',
      params: {
        radius: { type: 'number', default: 1 },
        showAtmosphere: { type: 'boolean', default: false },
        showGraticule: { type: 'boolean', default: false },
        rotateSpeed: { type: 'number', default: 0.05 }
      },
      keywords: ['地球', '世界', '全球', '地图']
    });
    
    this.radius = 1;
    this._texture = null;
  }

  render(scene, params = {}) {
    this.params = {
      radius: 1,
      showAtmosphere: false,
      showGraticule: false,
      rotateSpeed: 0.05,
      ...params
    };
    
    this.radius = this.params.radius;
    this._createSphere();
    
    if (this.params.showAtmosphere) {
      this._createAtmosphere();
    }
  }

  _createSphere() {
    // 高面数球体，让凹凸效果更细腻
    const geometry = new THREE.SphereGeometry(this.radius, 128, 64);
    
    const material = new THREE.MeshPhongMaterial({
      shininess: 15,
      specular: new THREE.Color(0x222244),
      color: 0x2233aa,
      bumpScale: 0.2 // 凹凸强度（加大）
    });
    
    const loader = new THREE.TextureLoader();
    
    // 并行加载颜色贴图和高度图
    let loadedCount = 0;
    const onLoaded = () => {
      loadedCount++;
      if (loadedCount >= 2) {
        material.color.set(0xffffff);
        material.needsUpdate = true;
      }
    };
    
    // 颜色贴图
    loader.load('/vendor/earth_texture.jpg', 
      (texture) => {
        this._texture = texture;
        material.map = texture;
        onLoaded();
      },
      undefined,
      (err) => {
        console.warn('地球纹理加载失败，使用纯色 fallback');
      }
    );
    
    // 高度图（凹凸贴图）
    loader.load('/vendor/earth_bump.png',
      (texture) => {
        this._bumpTexture = texture;
        material.bumpMap = texture;
        onLoaded();
      },
      undefined,
      (err) => {
        console.warn('高度图加载失败，无凹凸效果');
      }
    );
    
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
      this.group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), lineMaterial));
    }
    
    // 纬线
    for (let lat = -60; lat <= 60; lat += 30) {
      const points = [];
      for (let lng = -180; lng <= 180; lng += 1) {
        points.push(latLngToVector3(lat, lng, this.radius * 1.001));
      }
      this.group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), lineMaterial));
    }
  }

  _createAtmosphere() {
    const geometry = new THREE.SphereGeometry(this.radius * 1.01, 64, 64);
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
          float intensity = pow(rim, 4.0) * 0.3;
          vec3 color = vec3(0.3, 0.6, 1.0);
          gl_FragColor = vec4(color, intensity);
        }
      `,
      transparent: true,
      side: THREE.FrontSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    this.group.add(new THREE.Mesh(geometry, material));
  }

  getRadius() {
    return this.radius;
  }

  update(params, delta) {
    if (this.params.rotateSpeed) {
      // 基于 delta time 的自转，帧率无关
      this.group.rotation.y += this.params.rotateSpeed * delta;
    }
  }

  destroy() {
    if (this._texture) {
      this._texture.dispose();
      this._texture = null;
    }
    if (this._bumpTexture) {
      this._bumpTexture.dispose();
      this._bumpTexture = null;
    }
    super.destroy();
  }
}

export default Globe;
