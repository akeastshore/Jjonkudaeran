import { GRID_SIZE, MAP_WIDTH, MAP_HEIGHT, PLAYER_SIZE, ITEM_SIZE, MOVE_DELAY } from '../constants/gameConstants';
import { isRectIntersect } from './gameUtils';

export const updateMovement = (playerRef, keysRef, cookedItemsRef, ZONES, socketRef) => {
  const player = playerRef.current;
  const keys = keysRef.current;
  const cookedItems = cookedItemsRef.current;
  const now = Date.now();

  // 1. 움직이기 전 상태 기억
  const prevX = player.x;
  const prevY = player.y;
  const prevDir = player.direction;

  // 2. 방향키 입력 감지 및 방향 즉시 업데이트
  let intendedDirection = null;
  if (keys['w'] || keys['ArrowUp']) intendedDirection = 'up';
  else if (keys['s'] || keys['ArrowDown']) intendedDirection = 'down';
  else if (keys['a'] || keys['ArrowLeft']) intendedDirection = 'left';
  else if (keys['d'] || keys['ArrowRight']) intendedDirection = 'right';

  if (intendedDirection) {
    player.direction = intendedDirection;
  }

  // 3. 실제 이동 처리
  if (now - player.lastMoveTime >= MOVE_DELAY) {
    let dx = 0, dy = 0;

    if (keys['w'] || keys['ArrowUp']) dy -= GRID_SIZE;
    else if (keys['s'] || keys['ArrowDown']) dy += GRID_SIZE;
    else if (keys['a'] || keys['ArrowLeft']) dx -= GRID_SIZE;
    else if (keys['d'] || keys['ArrowRight']) dx += GRID_SIZE;

    if (dx !== 0 || dy !== 0) {
      const nextX = player.x + dx;
      const nextY = player.y + dy;
      
      // 충돌 체크
      const checkRect = { x: nextX + 5, y: nextY + 5, w: player.w - 10, h: player.h - 10 };
      let collided = false;
      if (nextX < 0 || nextX + player.w > MAP_WIDTH || nextY < 0 || nextY + player.h > MAP_HEIGHT) {
        collided = true;
      }
      if (!collided) {
        for (const zone of ZONES) {
          if (isRectIntersect(checkRect, zone)) { 
            collided = true; 
            break; 
          }
        }
      }

      // 충돌하지 않았다면 좌표 업데이트
      if (!collided) {
        player.x = nextX;
        player.y = nextY;
        player.lastMoveTime = now;
      }
    }
  }

  // 4. 위치나 방향이 바뀌었으면 전송
  if (player.x !== prevX || player.y !== prevY || player.direction !== prevDir) {
    if (socketRef.current) {
      socketRef.current.emit('playerMovement', {
        x: player.x,
        y: player.y,
        direction: player.direction
      });
    }
  }

  // 들고 있는 아이템 위치 조정
  if (player.holding) {
    const target = cookedItems.find(i => i.uid === player.holding);
    if (target) {
      const centerOffset = (PLAYER_SIZE - ITEM_SIZE) / 2;
      if (player.direction === 'up') { 
        target.x = player.x + centerOffset; 
        target.y = player.y - ITEM_SIZE + 20; 
      }
      else if (player.direction === 'down') { 
        target.x = player.x + centerOffset; 
        target.y = player.y + PLAYER_SIZE - 20; 
      }
      else if (player.direction === 'left') { 
        target.x = player.x - ITEM_SIZE + 20; 
        target.y = player.y + centerOffset; 
      }
      else if (player.direction === 'right') { 
        target.x = player.x + PLAYER_SIZE - 20; 
        target.y = player.y + centerOffset; 
      }
    }
  }
};
