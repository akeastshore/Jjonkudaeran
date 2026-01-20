// 초기 재료 생성 유틸리티
import { ITEM_SIZE } from '../constants/gameConstants';
import { getColorForIngredient, getNameForIngredient } from './ingredientHelpers';

// 존(Zone)으로부터 초기 재료 생성
export const createInitialIngredients = (zones) => {
  const ingredients = {};
  
  zones.forEach(zone => {
    if (zone.ingredient) {
      ingredients[zone.ingredient] = {
        id: zone.ingredient,
        uid: `${zone.ingredient}_base`,
        x: zone.px + zone.pw/2 - ITEM_SIZE/2,
        y: zone.py + zone.ph/2 - ITEM_SIZE/2,
        w: ITEM_SIZE, 
        h: ITEM_SIZE,
        color: getColorForIngredient(zone.ingredient),
        status: 'spawn', 
        name: getNameForIngredient(zone.ingredient)
      };
    }
  });
  
  return ingredients;
};
