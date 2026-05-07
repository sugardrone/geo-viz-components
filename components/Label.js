/**
 * Label - 标注组件
 * 在地球表面显示文字标注
 */

import { BaseComponent } from '../core/BaseComponent.js';
import { latLngToVector3 } from '../core/Utils.js';

export class Label extends BaseComponent {
  constructor() {
    super({
      id: 'label',
      name: '标注',
      category: 'ui',
      description: '地理标注文字',
      params: {
        lat: { type: 'number', required: true, description: '纬度' },
        lng: { type: 'number', required: true, description: '经度' },
        text: { type: 'string', required: true, description: '标注文字' },
        color: { type: 'string', default: '#ffffff', description: '文字颜色' },
        fontSize: { type: 'number', default: 20, description: '字号' },
        backgroundColor: { type: 'string', default: 'rgba(0,0,0,0.7)', description: '背景色' },
        offset: { type: 'number', default: 0.03, description: '离地高度' }
      },
      keywords: ['标注', '标签', '地名', '城市', '位置']
    });
  }

  render(scene, params = {}) {
    this.params = {
      lat: 0,
      lng: 0,
      text: '',
      color: '#ffffff',
      fontSize: 20,
      backgroundColor: 'rgba(0,0,0,0.7)',
      offset: 0.03,
      ...params
    };
    
    const position = latLngToVector3(
      this.params.lat, 
      this.params.lng, 
      1 + this.params.offset
    );
    
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    // 背景
    ctx.fillStyle = this.params.backgroundColor;
    ctx.roundRect(0, 10, canvas.width, canvas.height - 20, 12);
    ctx.fill();
    
    // 文字
    ctx.fillStyle = this.params.color;
    ctx.font = `bold ${this.params.fontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.params.text, canvas.width / 2, canvas.height / 2);
    
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.position.copy(position);
    sprite.scale.set(0.15, 0.04, 1);
    this.group.add(sprite);
  }
}

export default Label;
