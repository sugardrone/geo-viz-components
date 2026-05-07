/**
 * OceanCurrent - 洋流组件
 * 支持寒流、暖流、一般洋流的可视化
 */

import { BaseComponent } from '../core/BaseComponent.js';
import { latLngToVector3, interpolateArc, Colors } from '../core/Utils.js';

export class OceanCurrent extends BaseComponent {
  constructor() {
    super({
      id: 'ocean_current',
      name: '洋流',
      category: 'ocean',
      description: '洋流可视化，支持流动动画',
      params: {
        path: { type: 'array', required: true, description: '洋流路径 [[lng, lat], ...]' },
        direction: { type: 'string', default: 'forward', description: '方向 forward/backward' },
        type: { type: 'string', default: 'cold', description: '类型 cold/warm/neutral' },
        temperature: { type: 'number', default: 15, description: '水温' },
        width: { type: 'number', default: 0.003, description: '线条宽度' },
        animated: { type: 'boolean', default: true, description: '是否流动动画' },
        label: { type: 'string', default: '', description: '洋流名称' }
      },
      keywords: ['洋流', '寒流', '暖流', '海流', '秘鲁寒流', '北大西洋暖流', '墨西哥湾流', '黑潮', '亲潮']
    });
    
    this._animationTime = 0;
    this._flowLines = [];
  }

  render(scene, params = {}) {
    this.params = {
      path: [],
      direction: 'forward',
      type: 'cold',
      temperature: 15,
      width: 0.003,
      animated: true,
      label: '',
      ...params
    };
    
    const path = this.params.path;
    if (path.length < 2) return;
    
    // 确定颜色
    const colorMap = { cold: Colors.ocean.cold, warm: Colors.ocean.warm, neutral: Colors.ocean.current };
    const baseColor = colorMap[this.params.type] || Colors.ocean.current;
    
    // 将路径点转换为 3D 坐标
    const radius = 1.002; // 略高于地球表面
    const coords3D = path.map(([lng, lat]) => latLngToVector3(lat, lng, radius));
    
    // 生成平滑曲线
    const curvePoints = [];
    for (let i = 0; i < coords3D.length - 1; i++) {
      const arcPoints = interpolateArc(coords3D[i], coords3D[i + 1], 20, 0.015);
      curvePoints.push(...arcPoints.slice(i === 0 ? 0 : 1));
    }
    
    // 主线条
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(curvePoints);
    const lineMaterial = new THREE.LineBasicMaterial({
      color: baseColor,
      linewidth: 2,
      transparent: true,
      opacity: 0.9
    });
    const line = new THREE.Line(lineGeometry, lineMaterial);
    this.group.add(line);
    this._flowLines.push(line);
    
    // 流动箭头（动画用）
    if (this.params.animated) {
      this._createFlowArrows(curvePoints, baseColor);
    }
    
    // 起点和终点标记
    this._createEndpoint(coords3D[0], 0x00ff00, '起点');
    this._createEndpoint(coords3D[coords3D.length - 1], 0xff0000, '终点');
  }

  _createFlowArrows(points, color) {
    const arrowCount = Math.max(3, Math.floor(points.length / 15));
    const arrowGeometry = new THREE.ConeGeometry(0.008, 0.02, 8);
    const arrowMaterial = new THREE.MeshBasicMaterial({ color });
    
    for (let i = 0; i < arrowCount; i++) {
      const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
      arrow._flowIndex = (i / arrowCount) * points.length;
      arrow._points = points;
      this.group.add(arrow);
      this._flowLines.push(arrow);
    }
  }

  _createEndpoint(position, color, label) {
    const geometry = new THREE.SphereGeometry(0.008, 16, 16);
    const material = new THREE.MeshBasicMaterial({ color });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.copy(position);
    this.group.add(sphere);
  }

  update(params, delta) {
    if (!this.params.animated) return;
    
    this._animationTime += delta * 0.5;
    const points = this._flowLines[0]?._geometry?.attributes?.position;
    if (!points) return;
    
    // 更新流动箭头位置
    for (const obj of this._flowLines) {
      if (obj.isMesh && obj._points) {
        obj._flowIndex = (obj._flowIndex + delta * 15) % obj._points.length;
        const idx = Math.floor(obj._flowIndex);
        const nextIdx = (idx + 1) % obj._points.length;
        const t = obj._flowIndex - idx;
        
        const pos = new THREE.Vector3().lerpVectors(
          obj._points[idx], obj._points[nextIdx], t
        );
        obj.position.copy(pos);
        
        // 朝向流动方向
        const dir = new THREE.Vector3().subVectors(
          obj._points[nextIdx], obj._points[idx]
        ).normalize();
        obj.lookAt(pos.clone().add(dir));
      }
    }
  }
}

export default OceanCurrent;
