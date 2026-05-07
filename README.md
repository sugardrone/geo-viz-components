# 地理可视化组件库

标准化 Three.js 地理教学组件，可被 AI 无脑调用。

## 设计原则

- **统一接口** — 所有组件继承 `BaseComponent`，API 一致
- **参数驱动** — AI 输出 JSON `{id, params}`，前端直接渲染
- **可组合** — 多个组件自由叠加，无冲突
- **关键词匹配** — 每个组件有 keywords，用于题目路由

## 快速使用

```js
import { quickRender } from './index.js';

// AI 输出的组件列表
const components = [
  { id: 'ocean_current', params: { 
    path: [[-80,-45],[-78,-35],[-77,-25],[-76,-15]],
    type: 'cold', temperature: 12
  }},
  { id: 'label', params: { lat: -20, lng: -82, text: '秘鲁寒流' }},
  { id: 'arrow', params: { from: [-78,-30], to: [-75,-15], label: '降温减湿' }}
];

// 一行渲染
const scene = quickRender(document.getElementById('container'), components);
```

## 组件列表

| ID | 名称 | 分类 | 用途 |
|---|---|---|---|
| `ocean_current` | 洋流 | ocean | 寒流/暖流可视化 |
| `climate_zone` | 气候带 | climate | 气候区域着色 |
| `wind` | 风向 | climate | 风向和风力 |
| `terrain` | 地形 | terrain | 地形类型区域 |
| `plate_tectonic` | 板块 | terrain | 板块边界 |
| `urban_area` | 城市 | terrain | 城市分布 |
| `arrow` | 箭头 | ui | 因果关系 |
| `label` | 标注 | ui | 文字标注 |

## 添加新组件

1. 继承 `BaseComponent`
2. 定义 `metadata`（id, name, params, keywords）
3. 实现 `render(scene, params, context)` 方法
4. 在 `index.js` 注册

```js
import { BaseComponent } from '../core/BaseComponent.js';

export class MyComponent extends BaseComponent {
  constructor() {
    super({
      id: 'my_component',
      name: '我的组件',
      category: 'custom',
      params: { /* ... */ },
      keywords: ['关键词1', '关键词2']
    });
  }
  
  render(scene, params, context) {
    // 渲染逻辑
  }
}
```

## 目录结构

```
geo-viz-components/
├── core/
│   ├── BaseComponent.js    # 组件基类
│   ├── SceneManager.js     # 场景管理器
│   ├── Globe.js            # 地球模型
│   └── Utils.js            # 坐标转换工具
├── components/
│   ├── OceanCurrent.js     # 洋流
│   ├── ClimateZone.js      # 气候带
│   ├── Arrow.js            # 因果箭头
│   ├── Label.js            # 标注
│   ├── Terrain.js          # 地形
│   ├── Wind.js             # 风向
│   ├── PlateTectonic.js    # 板块
│   └── UrbanArea.js        # 城市
├── demo/
│   └── index.html          # 演示页面
├── index.js                # 统一导出
└── README.md
```

## Demo

```bash
cd demo && python3 -m http.server 8080
# 打开 http://localhost:8080
```
