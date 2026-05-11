import * as THREE from "three";
/**
 * Globe - 地球模型（真实地形起伏版）
 * 自定义顶点着色器 + displacement map = 真实几何起伏
 */

import { BaseComponent } from './BaseComponent.js';
import { latLngToVector3 } from './Utils.js';

export class Globe extends BaseComponent {
  constructor() {
    super({
      id: 'globe',
      name: '地球',
      category: 'core',
      description: '3D 地球模型，真实地形起伏',
      params: {
        radius: { type: 'number', default: 1 },
        showAtmosphere: { type: 'boolean', default: false },
        showGraticule: { type: 'boolean', default: false },
        rotateSpeed: { type: 'number', default: 0.05 }
      },
      keywords: ['地球', '世界', '全球', '地图']
    });
    
    this.radius = 1;
    this._textures = [];
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
    // 超高面数，让 displacement 效果平滑
    const geometry = new THREE.SphereGeometry(this.radius, 256, 128);
    
    // 自定义 ShaderMaterial：顶点着色器读取高度图做 displacement
    const material = new THREE.ShaderMaterial({
      uniforms: {
        colorMap: { value: null },
        bumpMap: { value: null },
        displacementScale: { value: 0.06 }, // 地形起伏强度
        lightDir: { value: new THREE.Vector3(0.8, 0.5, 0.3).normalize() }
      },
      vertexShader: `
        uniform sampler2D bumpMap;
        uniform float displacementScale;
        
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vWorldPos;
        varying float vElevation;
        
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          
          // 采样高度图
          float elevation = texture2D(bumpMap, uv).r;
          vElevation = elevation;
          
          // 沿法线方向位移顶点
          vec3 displaced = position + normal * elevation * displacementScale;
          
          vWorldPos = (modelMatrix * vec4(displaced, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D colorMap;
        uniform vec3 lightDir;
        
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vWorldPos;
        varying float vElevation;
        
        void main() {
          vec4 color = texture2D(colorMap, vUv);
          
          // 简单光照
          float diff = max(dot(vNormal, lightDir), 0.0);
          float ambient = 0.3;
          float lighting = ambient + diff * 0.7;
          
          // 海洋变暗（低海拔）
          float oceanMask = smoothstep(0.02, 0.08, vElevation);
          vec3 oceanDeep = color.rgb * vec3(0.6, 0.7, 1.0);
          vec3 finalColor = mix(oceanDeep, color.rgb, oceanMask);
          
          // 高海拔雪顶
          float snow = smoothstep(0.75, 0.9, vElevation);
          finalColor = mix(finalColor, vec3(0.95, 0.95, 1.0), snow * 0.4);
          
          // 地形阴影增强（基于高度差的微弱 AO）
          float ao = 0.9 + 0.1 * vElevation;
          
          gl_FragColor = vec4(finalColor * lighting * ao, 1.0);
        }
      `
    });
    
    const loader = new THREE.TextureLoader();
    
    // 颜色贴图
    loader.load('/vendor/earth_texture.jpg', 
      (texture) => {
        this._textures.push(texture);
        material.uniforms.colorMap.value = texture;
        material.needsUpdate = true;
      },
      undefined,
      (err) => console.warn('颜色贴图加载失败')
    );
    
    // 高度图（同时用于 displacement 和光照）
    loader.load('/vendor/earth_bump.png',
      (texture) => {
        this._textures.push(texture);
        material.uniforms.bumpMap.value = texture;
        material.needsUpdate = true;
      },
      undefined,
      (err) => console.warn('高度图加载失败')
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
    
    for (let lng = -180; lng < 180; lng += 30) {
      const points = [];
      for (let lat = -85; lat <= 85; lat += 1) {
        points.push(latLngToVector3(lat, lng, this.radius * 1.001));
      }
      this.group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), lineMaterial));
    }
    
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
          gl_FragColor = vec4(0.3, 0.6, 1.0, intensity);
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
      this.group.rotation.y += this.params.rotateSpeed * delta;
    }
  }

  destroy() {
    for (const t of this._textures) t.dispose();
    this._textures = [];
    super.destroy();
  }
}

export default Globe;
