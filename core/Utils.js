/**
 * 地理坐标转换工具
 * 经纬度 ↔ Three.js 3D 坐标
 */

const DEG2RAD = Math.PI / 180;

/**
 * 经纬度转 3D 坐标
 * @param {number} lat - 纬度 (-90 ~ 90)
 * @param {number} lng - 经度 (-180 ~ 180)
 * @param {number} radius - 球体半径
 * @returns {THREE.Vector3}
 */
export function latLngToVector3(lat, lng, radius = 1) {
  const phi = (90 - lat) * DEG2RAD;
  const theta = (lng + 180) * DEG2RAD;
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

/**
 * 3D 坐标转经纬度
 * @param {THREE.Vector3} pos
 * @param {number} radius
 * @returns {{ lat: number, lng: number }}
 */
export function vector3ToLatLng(pos, radius = 1) {
  const lat = 90 - Math.acos(pos.y / radius) * (180 / Math.PI);
  const lng = Math.atan2(pos.z, -pos.x) * (180 / Math.PI) - 180;
  return { lat, lng: ((lng + 540) % 360) - 180 };
}

/**
 * 经纬度数组转 3D 点数组
 * @param {Array<[number, number]>} coords - [[lng, lat], ...]
 * @param {number} radius
 * @returns {THREE.Vector3[]}
 */
export function coordsToVector3Array(coords, radius = 1) {
  return coords.map(([lng, lat]) => latLngToVector3(lat, lng, radius));
}

/**
 * 在两点之间插值生成曲线点
 * @param {THREE.Vector3} start
 * @param {THREE.Vector3} end
 * @param {number} segments
 * @param {number} altitude - 曲线高度（凸起）
 * @returns {THREE.Vector3[]}
 */
export function interpolateArc(start, end, segments = 32, altitude = 0.02) {
  const points = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const point = new THREE.Vector3().lerpVectors(start, end, t);
    // 弧线凸起
    const elevation = 1 + altitude * Math.sin(t * Math.PI);
    point.normalize().multiplyScalar(point.length() * elevation);
    points.push(point);
  }
  return points;
}

/**
 * 颜色工具
 */
export const Colors = {
  ocean: {
    cold: 0x1a5276,    // 深蓝（寒流）
    warm: 0xe74c3c,    // 红色（暖流）
    current: 0x3498db  // 蓝色（一般洋流）
  },
  climate: {
    tropical: 0xf39c12,      // 热带（橙）
    temperate: 0x27ae60,     // 温带（绿）
    arid: 0xf1c40f,          // 干旱（黄）
    polar: 0xaed6f1          // 极地（浅蓝）
  },
  terrain: {
    mountain: 0x8b4513,      // 山地（棕）
    plain: 0x2ecc71,         // 平原（绿）
    desert: 0xdaa520,        // 沙漠（金）
    water: 0x2980b9          // 水体（蓝）
  },
  ui: {
    arrow: 0xff6b6b,         // 箭头（红）
    label: 0xffffff,         // 标注（白）
    highlight: 0xf1c40f      // 高亮（黄）
  }
};

export default { latLngToVector3, vector3ToLatLng, coordsToVector3Array, interpolateArc, Colors };
