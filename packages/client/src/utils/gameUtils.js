import { GRID_SIZE, MAP_WIDTH, MAP_HEIGHT } from '../constants/gameConstants';

// 직사각형 충돌 감지
export const isRectIntersect = (r1, r2) => {
  const r2x = r2.px !== undefined ? r2.px : r2.x;
  const r2y = r2.py !== undefined ? r2.py : r2.y;
  const r2w = r2.pw !== undefined ? r2.pw : r2.w;
  const r2h = r2.ph !== undefined ? r2.ph : r2.h;
  return !(r2x > r1.x + r1.w || r2x + r2w < r1.x || r2y > r1.y + r1.h || r2y + r2h < r1.y);
};

// 플레이어가 바라보는 방향의 zone 정보 가져오기
export const getFacingInfo = (player, zones, useWideRange = false) => {
  let targetX = player.x;
  let targetY = player.y;

  if (player.direction === 'up') targetY -= GRID_SIZE;
  else if (player.direction === 'down') targetY += GRID_SIZE;
  else if (player.direction === 'left') targetX -= GRID_SIZE;
  else if (player.direction === 'right') targetX += GRID_SIZE;

  const checkRect = useWideRange 
    ? { x: targetX, y: targetY, w: GRID_SIZE, h: GRID_SIZE }
    : { x: targetX + 10, y: targetY + 10, w: 20, h: 20 };
  
  const matchingZones = zones.filter(z => isRectIntersect(checkRect, z));
  let zone = null;
  
  if (matchingZones.length > 0) {
    const centerX = targetX + GRID_SIZE / 2;
    const centerY = targetY + GRID_SIZE / 2;
    
    zone = matchingZones.reduce((closest, current) => {
      const currentCenterX = current.px + current.pw / 2;
      const currentCenterY = current.py + current.ph / 2;
      const currentDist = Math.hypot(centerX - currentCenterX, centerY - currentCenterY);
      
      const closestCenterX = closest.px + closest.pw / 2;
      const closestCenterY = closest.py + closest.ph / 2;
      const closestDist = Math.hypot(centerX - closestCenterX, centerY - closestCenterY);
      
      return currentDist < closestDist ? current : closest;
    });
  }

  return { zone, rect: checkRect, x: targetX, y: targetY };
};

// 아이템을 zone 중앙에 배치
export const centerItemInZone = (item, zone) => {
  item.x = zone.px + (zone.pw - item.w) / 2;
  item.y = zone.py + (zone.ph - item.h) / 2;
};

// 아이템을 그리드 좌표 중앙에 배치
export const centerItemOnGrid = (item, gridX, gridY) => {
  item.x = gridX + (GRID_SIZE - item.w) / 2;
  item.y = gridY + (GRID_SIZE - item.h) / 2;
};

// processing이 끝난 아이템을 zone 앞쪽으로 배치
export const placeItemInFrontOfZone = (item, zone) => {
  const zoneCenterX = zone.px + zone.pw / 2;
  const zoneCenterY = zone.py + zone.ph / 2;
  
  const canvasCenterX = MAP_WIDTH / 2;
  const canvasCenterY = MAP_HEIGHT / 2;
  
  if (zoneCenterY < canvasCenterY / 2) {
    // 상단 zone
    item.x = zoneCenterX - item.w / 2;
    item.y = zone.py + zone.ph + GRID_SIZE / 2;
  } else if (zoneCenterY > canvasCenterY * 1.5) {
    // 하단 zone
    item.x = zoneCenterX - item.w / 2;
    item.y = zone.py - GRID_SIZE + (GRID_SIZE - item.h) / 2;
  } else if (zoneCenterX < canvasCenterX) {
    // 좌측 zone
    item.x = zone.px + zone.pw + GRID_SIZE / 2;
    item.y = zoneCenterY - item.h / 2;
  } else {
    // 우측 zone
    item.x = zone.px - GRID_SIZE + (GRID_SIZE - item.w) / 2;
    item.y = zoneCenterY - item.h / 2;
  }
};

// 고유 ID 생성
export const generateUID = () => {
  return Date.now() + '_' + Math.random().toString(36).substring(2, 11);
};
