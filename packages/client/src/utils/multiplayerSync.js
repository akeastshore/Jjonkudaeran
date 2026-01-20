// 멀티플레이어 아이템 동기화 유틸리티
import { PLAYER_SIZE, ITEM_SIZE } from '../constants/gameConstants';

// 다른 플레이어가 들고 있는 아이템 위치 동기화
export const syncOtherPlayersItems = (cookedItemsRef, otherPlayersRef, socketRef) => {
  cookedItemsRef.current.forEach(item => {
    if (item.status === 'held' && item.holderId && item.holderId !== socketRef.current?.id) {
      const holder = otherPlayersRef.current[item.holderId];
      if (holder) {
        const centerOffset = (PLAYER_SIZE - ITEM_SIZE) / 2;
        
        switch (holder.direction) {
          case 'up':
            item.x = holder.x + centerOffset;
            item.y = holder.y - ITEM_SIZE - 20;
            break;
          case 'down':
            item.x = holder.x + centerOffset;
            item.y = holder.y + PLAYER_SIZE + 20;
            break;
          case 'left':
            item.x = holder.x - ITEM_SIZE - 20;
            item.y = holder.y + centerOffset;
            break;
          case 'right':
            item.x = holder.x + PLAYER_SIZE + 20;
            item.y = holder.y + centerOffset;
            break;
        }
      }
    }
  });
};
