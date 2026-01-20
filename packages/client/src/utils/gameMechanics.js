import { ITEM_SIZE } from '../constants/gameConstants';
import { getColorForIngredient, getNameForIngredient } from './ingredientHelpers';
import { isRectIntersect, centerItemInZone } from './gameUtils';

// 아이템 생성 함수 (멀티플레이어 지원)
export const createSpawnItemFunction = (cookedItemsRef, isMultiplayer, socketRef) => {
  return (id, zone) => {
    const newItem = {
      id: id,
      uid: `${id}_${Date.now()}_${Math.random()}`,
      x: 0, y: 0, 
      w: ITEM_SIZE, 
      h: ITEM_SIZE,
      color: getColorForIngredient(id),
      status: 'ground',
      name: getNameForIngredient(id)
    };
    centerItemInZone(newItem, zone);
    cookedItemsRef.current.push(newItem);
    
    if (isMultiplayer && socketRef.current) {
      socketRef.current.emit('updateItemState', newItem);
    }
    
    return newItem;
  };
};

// 레시피 체크 함수 (멀티플레이어 지원)
export const createCheckRecipeFunction = (cookedItemsRef, isMultiplayer, socketRef, spawnItem) => {
  return (zone, ingredients, outputId, recipeIds) => {
    const itemsInZone = ingredients.filter(item => 
      (item.status === 'cooking' || item.status === 'ground') &&
      isRectIntersect({x:item.x, y:item.y, w:item.w, h:item.h}, zone)
    );

    const foundItems = recipeIds.map(reqId => itemsInZone.find(i => i.id === reqId));
    
    if (foundItems.every(i => i !== undefined)) {
      foundItems.forEach(item => {
        const idx = cookedItemsRef.current.indexOf(item);
        if (idx > -1) cookedItemsRef.current.splice(idx, 1);
        
        if (isMultiplayer && socketRef.current) {
          socketRef.current.emit('removeItem', item.uid);
        }
      });
      spawnItem(outputId, zone);
      return true;
    }
    return false;
  };
};

// 버너 상태 가져오기 헬퍼
export const getBurnerState = (burnerStatesRef, zone) => {
  const key = `${zone.x}_${zone.y}`;
  if (!burnerStatesRef.current[key]) {
    burnerStatesRef.current[key] = {
      state: 'empty',
      finishTime: 0,
      items: []
    };
  }
  return burnerStatesRef.current[key];
};
