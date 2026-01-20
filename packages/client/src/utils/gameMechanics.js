import { ITEM_SIZE } from '../constants/gameConstants';
import { getColorForIngredient, getNameForIngredient } from './ingredientHelpers';
import { generateUID } from './gameUtils';

// 아이템 생성 함수
export const spawnItem = (id, zone) => {
  return {
    id,
    uid: generateUID(),
    x: zone.px + zone.pw/2 - ITEM_SIZE/2,
    y: zone.py + zone.ph/2 - ITEM_SIZE/2,
    w: ITEM_SIZE,
    h: ITEM_SIZE,
    color: getColorForIngredient(id),
    status: 'placed',
    name: getNameForIngredient(id)
  };
};

// 레시피 체크 함수
export const checkRecipe = (zone, ingredients, outputId, recipeIds) => {
  const found = ingredients.filter(item => {
    if (item.status === 'held') return false;
    const dx = item.x - (zone.px + zone.pw/2);
    const dy = item.y - (zone.py + zone.ph/2);
    const dist = Math.sqrt(dx*dx + dy*dy);
    return dist < 50 && recipeIds.includes(item.id);
  });
  
  if (found.length === recipeIds.length) {
    const allMatch = recipeIds.every(rid => found.some(f => f.id === rid));
    if (allMatch) {
      return { matches: true, items: found };
    }
  }
  return { matches: false, items: [] };
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
