import { GRID_SIZE, ITEM_SIZE } from '../constants/gameConstants';
import { isRectIntersect, getFacingInfo, centerItemInZone, centerItemOnGrid, placeItemInFrontOfZone } from './gameUtils';
import { getColorForIngredient, getNameForIngredient } from './ingredientHelpers';

export const createGameLogicUpdate = (
  playerRef,
  itemsRef,
  cookedItemsRef,
  keysRef,
  fireRef,
  blenderRef,
  trayStatesRef,
  getBurnerState,
  checkRecipe,
  ZONES,
  onBurgerDelivered,
  score,
  isMultiplayer,
  socketRef
) => {
  return () => {
    // --- 1. 기본 상태 및 변수 가져오기 ---
    const player = playerRef.current;
    const items = itemsRef.current;
    const cookedItems = cookedItemsRef.current;
    const isSpacePressed = keysRef.current[' '] || keysRef.current['Space'];
    const now = Date.now();

    const interactRect = { x: player.x - 10, y: player.y - 10, w: player.w + 20, h: player.h + 20 };

    // --- 2. 헬퍼 함수 정의 ---
    const broadcastItem = (item) => {
      if (isMultiplayer && socketRef.current) {
        socketRef.current.emit('updateItemState', item);
      }
    };

    const removeServerItem = (uid) => {
      if (isMultiplayer && socketRef.current) {
        socketRef.current.emit('removeItem', uid);
      }
    };

    const deleteItemLocally = (uid) => {
      cookedItemsRef.current = cookedItemsRef.current.filter(item => item.uid !== uid);
    };

    // [핵심] 좌표(x,y)를 필수로 받아서 생성 즉시 위치를 잡음
    const createNewItem = (id, x, y) => {
      return {
        id,
        uid: `${id}_${now}_${Math.random()}`,
        x: x || 0,
        y: y || 0,
        w: ITEM_SIZE, h: ITEM_SIZE,
        color: getColorForIngredient(id),
        name: getNameForIngredient(id),
        status: 'ground'
      };
    };

    const getTrayState = (zone) => {
      const key = `${zone.x}_${zone.y}`;
      if (!trayStatesRef.current[key]) {
        trayStatesRef.current[key] = { state: 'empty' };
      }
      return trayStatesRef.current[key];
    };

    // --- 3. 화덕(Fire) 제어 로직 ---
    const fire = fireRef.current;
    const { zone: facingZone } = getFacingInfo(player, ZONES);
    const isFacingFire = facingZone && facingZone.func === 'fire';

    if (isFacingFire) {
      if (!fire.isFacing) {
        fire.isFacing = true;
        fire.facingStartTime = now;
        fire.isOn = false;
        if (isMultiplayer && socketRef.current) {
          socketRef.current.emit('updateFireState', { isFacing: true, facingStartTime: now, isOn: false });
        }
      } else if (!fire.isOn && now - fire.facingStartTime > 2000) {
        fire.isOn = true;
        if (isMultiplayer && socketRef.current) {
          socketRef.current.emit('updateFireState', { isFacing: true, facingStartTime: fire.facingStartTime, isOn: true });
        }
      }
    } else {
      if (fire.isFacing || fire.isOn) {
        fire.isFacing = false;
        fire.isOn = false;
        fire.facingStartTime = 0;
        if (isMultiplayer && socketRef.current) {
          socketRef.current.emit('updateFireState', { isFacing: false, isOn: false });
        }
      }
    }

    // --- 4. 기계별 상태 업데이트 (Timer Check) ---
    cookedItems.forEach(item => {
      if (item.status === 'processing' && now >= item.finishTime) {
        item.status = 'ground';
        item.id = item.nextId;
        item.name = getNameForIngredient(item.nextId);
        item.color = getColorForIngredient(item.nextId);
        item.holderId = null;

        const currentZone = ZONES.find(z => isRectIntersect({ x: item.x, y: item.y, w: item.w, h: item.h }, z));

        if (currentZone) {
          // 기구별 아이템 배치 위치 조정 (중요: 전자레인지 중앙 고정)
          if (currentZone.func === 'microwave') {
            centerItemInZone(item, currentZone);
          } else if (['fridge', 'peel', 'blend', 'fire'].includes(currentZone.func)) {
            placeItemInFrontOfZone(item, currentZone);
          } else {
            centerItemInZone(item, currentZone);
          }
        }
        broadcastItem(item);
      }
    });

    // 믹서기 & 화덕 상태 업데이트
    if (blenderRef.current.state === 'processing' && now >= blenderRef.current.finishTime) {
      blenderRef.current.state = 'ready';
    }

    const fireZones = ZONES.filter(z => z.func === 'fire');
    fireZones.forEach(zone => {
      const burner = getBurnerState(zone);

      if (burner.state === 'marshmallow_processing' && now >= burner.finishTime) burner.state = 'marshmallow_ready';
      else if (burner.state === 'butter_processing' && now >= burner.finishTime) burner.state = 'butter_ready';
      else if (burner.state === 'final_processing' && now >= burner.finishTime) burner.state = 'final_ready';
      else if (burner.state === 'kadaif_processing' && now >= burner.finishTime) burner.state = 'kadaif_ready';

      if ((burner.state === 'final_ready' || burner.state === 'kadaif_ready' || burner.state === 'butter_ready' || burner.state === 'marshmallow_ready' || burner.state === 'mixing') && now >= burner.finishTime + 6000) {
        if (burner.state === 'final_ready') burner.message = "🔥피가 탔습니다🔥";
        else if (burner.state === 'kadaif_ready') burner.message = "🔥카다이프가 탔습니다🔥";
        else if (burner.state === 'butter_ready') burner.message = "🔥버터가 탔습니다🔥";
        else if (burner.state === 'marshmallow_ready') burner.message = "🔥마시멜로가 탔습니다🔥";
        else if (burner.state === 'mixing') burner.message = "🔥반죽이 탔습니다🔥";
        burner.messageStartTime = now;
        burner.state = 'empty';
        burner.items = [];
        if (isMultiplayer && socketRef.current) {
          socketRef.current.emit('updateBurnerState', { ...burner, x: zone.x, y: zone.y });
        }
      }
    });

    // --- 5. 레시피 체크 ---
    if (fire.isOn) {
      fireZones.forEach(zone => {
        checkRecipe(zone, cookedItems, 'meltedMarshmallow', ['butter', 'marshmallow']);
        checkRecipe(zone, cookedItems, 'toastedKadaif', ['kadaif_v1', 'butter_v2']);
      });
    }
    const mixZone = ZONES.find(z => z.func === 'mix');
    if (mixZone) {
      checkRecipe(mixZone, cookedItems, 'whiteChoco_pistachio', ['meltedWhiteChoco', 'pistachioSpread_in_bowl']);
      checkRecipe(mixZone, cookedItems, 'innerpart', ['whiteChoco_pistachio', 'toastedKadaif']);
      checkRecipe(mixZone, cookedItems, 'innerpart', ['meltedWhiteChoco', 'pistachioSpread_in_bowl', 'toastedKadaif']);
    }

    // --- 6. 아이템 내려놓기 (DROP) ---
    if (player.holding && !isSpacePressed) {
      const heldUid = player.holding;
      let droppedItem = cookedItems.find(i => i.uid === heldUid);

      if (droppedItem) {
        const { zone: facingZone, x: facingX, y: facingY } = getFacingInfo(player, ZONES, true);

        if (facingZone) {
          if (facingZone.type === 'wall' || facingZone.ingredient) {
            droppedItem.status = 'ground';
            centerItemOnGrid(droppedItem, facingX, facingY);
          }
          else {
            const startProcessing = (nextId, duration) => {
              droppedItem.status = 'processing';
              droppedItem.finishTime = now + duration;
              droppedItem.nextId = nextId;
              centerItemInZone(droppedItem, facingZone);
            };

            const consumeItem = () => {
              deleteItemLocally(droppedItem.uid);
              player.holding = null;
              removeServerItem(droppedItem.uid);
            };

            // ★ [문제 해결의 핵심] 아이템 교체 함수
            const replaceItemWith = (newItemId) => {
              // 1. 내려놓는 기계(Zone)의 정중앙 좌표를 직접 계산합니다.
              // (들고 있던 아이템의 좌표는 업데이트가 안 되어 있을 수 있으므로 쓰지 않습니다!)
              const targetX = facingZone.x + (facingZone.w - ITEM_SIZE) / 2;
              const targetY = facingZone.y + (facingZone.h - ITEM_SIZE) / 2;

              // 2. 정확한 위치에 새 아이템 생성
              const newItem = createNewItem(newItemId, targetX, targetY);
              newItem.status = 'placed'; // 상태 고정

              cookedItems.push(newItem);
              deleteItemLocally(droppedItem.uid);

              if (isMultiplayer && socketRef.current) {
                socketRef.current.emit('updateItemState', newItem);
                socketRef.current.emit('removeItem', droppedItem.uid);
              }
              player.holding = null;
            };

            // 1. 트레이 (Tray)
            if (facingZone.func === 'tray') {
              const tray = getTrayState(facingZone);
              if (droppedItem.id === 'pistachio') {
                startProcessing('peeledPistachio', 1000);
              } else if (droppedItem.id === 'dough' && tray.state === 'empty') {
                tray.state = 'dough';
                consumeItem();
                return;
              } else if ((droppedItem.id === 'cocoa' || droppedItem.id === 'cocoa_v2') && tray.state === 'empty') {
                tray.state = 'cocoa';
                consumeItem();
                return;
              } else if (droppedItem.id === 'frozenInnerpart' && tray.state === 'dough') {
                replaceItemWith('dujjonku'); // <-- 여기서 위에서 만든 함수 사용
                tray.state = 'empty';
                return;
              } else if (droppedItem.id === 'dujjonku' && tray.state === 'cocoa') {
                replaceItemWith('finalCookie'); // <-- 여기도 사용
                tray.state = 'empty';
                return;
              }
            }

            // 2. 믹서기 (Blend)
            else if (facingZone.func === 'blend' && droppedItem.id === 'peeledPistachio') {
              blenderRef.current.state = 'processing';
              blenderRef.current.finishTime = now + 2000;
              consumeItem();
              return;
            }

            // 3. 믹싱볼 (Mix)
            else if (facingZone.func === 'mix' && droppedItem.id === 'pistachioSpread') {
              const isMixerFull = cookedItemsRef.current.some(item =>
                item.id === 'pistachioSpread_in_bowl' &&
                isRectIntersect({ x: item.x, y: item.y, w: item.w, h: item.h }, facingZone)
              );
              if (!isMixerFull) {
                droppedItem.id = 'pistachioSpread_in_bowl';
                droppedItem.status = 'placed';
                centerItemInZone(droppedItem, facingZone);
                player.holding = null;
                broadcastItem(droppedItem);
                return;
              }
            }

            // 4. 조리기구
            else if (facingZone.func === 'microwave' && droppedItem.id === 'whiteChoco') {
              startProcessing('meltedWhiteChoco', 2000);
            } else if (facingZone.func === 'fridge' && droppedItem.id === 'innerpart') {
              startProcessing('frozenInnerpart', 5000);
            }

            // 5. 화덕
            else if (facingZone.func === 'fire') {
              const burner = getBurnerState(facingZone);
              const addToBurner = (state, duration, items) => {
                burner.state = state;
                burner.finishTime = now + duration;
                if (items) burner.items = items;
                consumeItem();
                if (isMultiplayer && socketRef.current) {
                  socketRef.current.emit('updateBurnerState', { ...burner, x: facingZone.x, y: facingZone.y });
                }
              };
              if (droppedItem.id === 'butter_v2' && burner.state === 'empty') {
                addToBurner('butter_processing', 1000, ['butter_v2']);
                return;
              } else if (droppedItem.id === 'marshmallow' && burner.state === 'butter_ready') {
                burner.items.push('marshmallow');
                addToBurner('marshmallow_processing', 2000, null);
                return;
              } else if (droppedItem.id.includes('kadaif') && !droppedItem.id.includes('toasted') && burner.state === 'empty') {
                addToBurner('kadaif_processing', 3000, ['kadaif_v1']);
                return;
              } else if ((droppedItem.id === 'milkPowder_v2' || droppedItem.id === 'cocoa_v2') &&
                (burner.state === 'marshmallow_ready' || burner.state === 'mixing')) {
                burner.items.push(droppedItem.id);

                const hasMilk = burner.items.includes('milkPowder_v2');
                const hasCocoa = burner.items.includes('cocoa_v2');
                console.log(`[Burner] Added ${droppedItem.id}. Items:`, burner.items, { hasMilk, hasCocoa }); // [DEBUG]

                const nextState = (hasMilk && hasCocoa)
                  ? 'final_processing' : 'mixing';

                console.log(`[Burner] Transitioning to: ${nextState}`); // [DEBUG]

                const duration = nextState === 'final_processing' ? 1000 : 0;
                addToBurner(nextState, duration, null);
                return;
              }
            }
            // 6. 포장
            else if (facingZone.func === 'package' && droppedItem.id === 'finalCookie') {
              startProcessing('packagedCookie', 1000);
            } else {
              droppedItem.status = 'cooking';
              centerItemInZone(droppedItem, facingZone);
            }
          }
        } else {
          droppedItem.status = 'ground';
          centerItemOnGrid(droppedItem, facingX, facingY);
        }
        droppedItem.holderId = null;
        broadcastItem(droppedItem);
      }
      player.holding = null;
    }

    // --- 7. 아이템 집기 (PICKUP) ---
    if (!player.holding && isSpacePressed) {
      const { zone: facingZone, x: facingX, y: facingY } = getFacingInfo(player, ZONES, true);

      // [핵심] 집을 때는 '플레이어의 현재 위치'에서 생성
      const pickupNewItem = (id) => {
        const newItem = createNewItem(id, player.x, player.y);
        newItem.status = 'held';
        newItem.holderId = socketRef.current?.id;
        cookedItemsRef.current.push(newItem);
        player.holding = newItem.uid;
        broadcastItem(newItem);
      };

      if (facingZone && facingZone.func === 'blend' && blenderRef.current.state === 'ready') {
        pickupNewItem('pistachioSpread');
        blenderRef.current.state = 'empty';
      } else if (facingZone && facingZone.func === 'fire') {
        const burner = getBurnerState(facingZone);
        if (burner.state === 'final_ready') {
          pickupNewItem('dough');
          burner.state = 'empty';
          burner.items = [];
          if (isMultiplayer && socketRef.current) socketRef.current.emit('updateBurnerState', { ...burner, x: facingZone.x, y: facingZone.y });
        } else if (burner.state === 'kadaif_ready') {
          pickupNewItem('toastedKadaif');
          burner.state = 'empty';
          burner.items = [];
          if (isMultiplayer && socketRef.current) socketRef.current.emit('updateBurnerState', { ...burner, x: facingZone.x, y: facingZone.y });
        }
      } else if (facingZone && facingZone.func === 'mix') {
        const bowlItem = cookedItemsRef.current.find(item =>
          isRectIntersect({ x: item.x, y: item.y, w: item.w, h: item.h }, facingZone)
        );
        if (bowlItem) {
          if (bowlItem.id === 'pistachioSpread_in_bowl') {
            deleteItemLocally(bowlItem.uid);
            removeServerItem(bowlItem.uid);
            pickupNewItem('pistachioSpread');
          } else {
            bowlItem.status = 'held';
            bowlItem.holderId = socketRef.current?.id;
            player.holding = bowlItem.uid;
            broadcastItem(bowlItem);
          }
        }
      } else {
        const pickupRange = { x: facingX, y: facingY, w: GRID_SIZE, h: GRID_SIZE };
        const target = cookedItems
          .filter(i => i.status === 'ground' || i.status === 'cooking' || i.status === 'placed')
          .find(i => isRectIntersect(pickupRange, i));

        if (target) {
          target.status = 'held';
          target.holderId = socketRef.current?.id;
          player.holding = target.uid;
          broadcastItem(target);
        } else if (facingZone && facingZone.ingredient) {
          const baseItem = items[facingZone.ingredient];
          if (baseItem.status === 'spawn') {
            let finalId = baseItem.id;
            if (finalId === 'kadaif') finalId = 'kadaif_v1';
            else if (finalId === 'butter') finalId = 'butter_v2';
            else if (finalId === 'milkPowder') finalId = 'milkPowder_v2';
            else if (finalId === 'cocoa') finalId = 'cocoa_v2';

            const newItem = {
              ...baseItem,
              id: finalId,
              uid: `${baseItem.id}_${now}_${Math.random()}`,
              x: player.x, y: player.y, // 집을 땐 플레이어 위치
              status: 'held',
              holderId: socketRef.current?.id,
              color: getColorForIngredient(finalId),
              name: getNameForIngredient(finalId)
            };
            cookedItems.push(newItem);
            player.holding = newItem.uid;
            broadcastItem(newItem);
          }
        }
      }
    }

    // --- 8. 배달 ---
    const heldItem = cookedItems.find(i => i.uid === player.holding);
    if (heldItem && isSpacePressed) {
      const exitZone = ZONES.find(zone => zone.type === 'exit' && isRectIntersect(interactRect, zone));
      if (exitZone && heldItem.id === 'packagedCookie') {
        onBurgerDelivered();
        const idx = cookedItems.indexOf(heldItem);
        if (idx > -1) cookedItems.splice(idx, 1);
        player.holding = null;
        if (isMultiplayer && socketRef.current) {
          socketRef.current.emit('removeItem', heldItem.uid);
          socketRef.current.emit('updateScore', score + 1);
        }
      }
    }
  };
};