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
    const player = playerRef.current;
    const items = itemsRef.current;
    const cookedItems = cookedItemsRef.current;
    const isSpacePressed = keysRef.current[' '] || keysRef.current['Space'];
    const now = Date.now();

    const interactRect = { x: player.x - 10, y: player.y - 10, w: player.w + 20, h: player.h + 20 };
    const nearbyZone = ZONES.find(zone => isRectIntersect(interactRect, zone));

    const broadcastItem = (item) => {
      if (isMultiplayer && socketRef.current) {
        socketRef.current.emit('updateItemState', item);
      }
    };

    // --- Fire Logic (Tray State) ---
    const getTrayState = (zone) => {
      const key = `${zone.x}_${zone.y}`;
      if (!trayStatesRef.current[key]) {
        trayStatesRef.current[key] = { state: 'empty' };
      }
      return trayStatesRef.current[key];
    };

    const fire = fireRef.current;
    const { zone: facingZone } = getFacingInfo(player, ZONES);
    const isFacingFire = facingZone && facingZone.func === 'fire';

    // 불 켜기/끄기 로직
    if (isFacingFire) {
      if (!fire.isFacing) {
        fire.isFacing = true;
        fire.facingStartTime = now;
        fire.isOn = false;

        if (isMultiplayer && socketRef.current) {
          socketRef.current.emit('updateFireState', {
            isFacing: true,
            facingStartTime: now,
            isOn: false
          });
        }
      } else {
        if (!fire.isOn && now - fire.facingStartTime > 2000) {
          fire.isOn = true;
          if (isMultiplayer && socketRef.current) {
            socketRef.current.emit('updateFireState', {
              isFacing: true,
              facingStartTime: fire.facingStartTime,
              isOn: true
            });
          }
        }
      }
    } else {
      if (fire.isFacing || fire.isOn) {
        fire.isFacing = false;
        fire.isOn = false;
        fire.facingStartTime = 0;

        if (isMultiplayer && socketRef.current) {
          socketRef.current.emit('updateFireState', {
            isFacing: false,
            isOn: false
          });
        }
      }
    }

    // Processing (전자레인지, 믹서기 등 타이머 처리)
    cookedItems.forEach(item => {
      if (item.status === 'processing' && now >= item.finishTime) {
        // 1. 아이템 정보 업데이트 (기존 코드와 동일)
        item.status = 'ground';
        item.id = item.nextId;
        item.name = getNameForIngredient(item.nextId);
        item.color = getColorForIngredient(item.nextId);
        item.holderId = null;

        // 2. 현재 아이템이 놓인 위치(Zone) 찾기
        const itemCenter = { x: item.x + item.w / 2, y: item.y + item.h / 2 };
        const currentZone = ZONES.find(z =>
          itemCenter.x >= z.px && itemCenter.x < z.px + z.pw &&
          itemCenter.y >= z.py && itemCenter.y < z.py + z.ph
        );

        if (currentZone) {
          // -------------------------------------------------------------
          // 🛠️ [수정된 부분] 기구별 위치 설정 로직
          // -------------------------------------------------------------

          // (1) 마이크로웨이브: 끝나면 기계 '위(중앙)'에 그대로 둠
          if (currentZone.func === 'microwave') {
            centerItemInZone(item, currentZone);
          }
          // (2) 다른 기구들 (냉장고, 믹서기 등): 필요하다면 '앞'으로 배출 (선택 사항)
          // 만약 다른 기구들도 위에 두고 싶다면 이 `else if`는 지우세요.
          else if (currentZone.func === 'fridge') {
            placeItemInFrontOfZone(item, currentZone);
          }
          // (3) 그 외 나머지: 모두 중앙 정렬
          else {
            centerItemInZone(item, currentZone);
          }
        }

        broadcastItem(item);
      }
    });

    // 믹서기 상태 업데이트
    const blender = blenderRef.current;
    if (blender.state === 'processing' && now >= blender.finishTime) {
      blender.state = 'ready';
    }

    // 후라이팬 상태 업데이트
    const fireZones = ZONES.filter(z => z.func === 'fire');
    fireZones.forEach(zone => {
      const burner = getBurnerState(zone);
      if (burner.state === 'marshmallow_processing' && now >= burner.finishTime) {
        burner.state = 'marshmallow_ready';
      } else if (burner.state === 'butter_processing' && now >= burner.finishTime) {
        burner.state = 'butter_ready';
      } else if (burner.state === 'final_processing' && now >= burner.finishTime) {
        burner.state = 'final_ready';
      } else if (burner.state === 'kadaif_processing' && now >= burner.finishTime) {
        burner.state = 'kadaif_ready';
      }

      // 타는 로직 (5초 초과 시 초기화)
      if ((burner.state === 'final_ready' || burner.state === 'kadaif_ready') &&
        now >= burner.finishTime + 5000) {

        // 메시지 설정
        if (burner.state === 'final_ready') {
          burner.message = "🔥피가 탔습니다🔥";
        } else {
          burner.message = "🔥카다이프가 탔습니다🔥";
        }
        burner.messageStartTime = now;

        burner.state = 'empty';
        burner.items = [];
        if (isMultiplayer && socketRef.current) {
          socketRef.current.emit('updateBurnerState', { ...burner, x: zone.x, y: zone.y });
        }
      }
    });

    // Cooking (레시피 체크)
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
      checkRecipe(mixZone, cookedItems, 'innerpart', ['whiteChoco_pistachio', 'toastedKadaif']);
      checkRecipe(mixZone, cookedItems, 'innerpart', ['meltedWhiteChoco', 'pistachioSpread_in_bowl', 'toastedKadaif']);
    }

    // ----------------------------------------------------------------
    // Drop (아이템 내려놓기/넣기)
    // ----------------------------------------------------------------
    if (player.holding && !isSpacePressed) {
      const heldUid = player.holding;
      let droppedItem = cookedItems.find(i => i.uid === heldUid);

      if (droppedItem) {
        const { zone: facingZone, x: facingX, y: facingY } = getFacingInfo(player, ZONES, true);

        if (facingZone) {
          if (facingZone.type === 'wall' || facingZone.ingredient) {
            // (1) 재료가 있는 곳(ingredient zone)에 놓으면 아이템 삭제 ("제자리에 돌려놓기")
            if (facingZone.ingredient) {
              cookedItemsRef.current = cookedItemsRef.current.filter(item => item.uid !== droppedItem.uid);
              if (isMultiplayer && socketRef.current) socketRef.current.emit('removeItem', droppedItem.uid);
            } else {
              // (2) 일반 벽이면 바닥에 놓기
              droppedItem.status = 'ground';
              centerItemOnGrid(droppedItem, facingX, facingY);
            }
          } else {
            const setProcessing = (nextId, duration) => {
              droppedItem.status = 'processing';
              droppedItem.finishTime = now + duration;
              droppedItem.nextId = nextId;
              centerItemInZone(droppedItem, facingZone);
            };

            // 1. 트레이(Tray) 로직
            if (facingZone.func === 'tray') {
              const tray = getTrayState(facingZone);

              if (droppedItem.id === 'pistachio') {
                setProcessing('peeledPistachio', 1000);
              } else if (droppedItem.id === 'dough' && tray.state === 'empty') {
                tray.state = 'dough';
                cookedItemsRef.current = cookedItemsRef.current.filter(item => item.uid !== droppedItem.uid);
                player.holding = null;
                if (isMultiplayer && socketRef.current) socketRef.current.emit('removeItem', droppedItem.uid);
                return;
              } else if ((droppedItem.id === 'cocoa' || droppedItem.id === 'cocoa_v2') && tray.state === 'empty') {
                tray.state = 'cocoa';
                cookedItemsRef.current = cookedItemsRef.current.filter(item => item.uid !== droppedItem.uid);
                player.holding = null;
                if (isMultiplayer && socketRef.current) socketRef.current.emit('removeItem', droppedItem.uid);
                return;
              } else if (droppedItem.id === 'frozenInnerpart' && tray.state === 'dough') {
                const newItem = {
                  id: 'dujjonku',
                  uid: `dujjonku_${now}_${Math.random()}`,
                  x: 0, y: 0, w: ITEM_SIZE, h: ITEM_SIZE,
                  color: getColorForIngredient('dujjonku'),
                  name: getNameForIngredient('dujjonku'),
                  status: 'ground'
                };
                centerItemInZone(newItem, facingZone);
                cookedItems.push(newItem);
                cookedItemsRef.current = cookedItemsRef.current.filter(item => item.uid !== droppedItem.uid);
                if (isMultiplayer && socketRef.current) {
                  socketRef.current.emit('updateItemState', newItem);
                  socketRef.current.emit('removeItem', droppedItem.uid);
                }
                tray.state = 'empty';
                player.holding = null;
                return;
              } else if (droppedItem.id === 'dujjonku' && tray.state === 'cocoa') {
                const newItem = {
                  id: 'finalCookie',
                  uid: `finalCookie_${now}_${Math.random()}`,
                  x: 0, y: 0, w: ITEM_SIZE, h: ITEM_SIZE,
                  color: getColorForIngredient('finalCookie'),
                  name: getNameForIngredient('finalCookie'),
                  status: 'ground'
                };
                centerItemInZone(newItem, facingZone);
                cookedItems.push(newItem);
                cookedItemsRef.current = cookedItemsRef.current.filter(item => item.uid !== droppedItem.uid);
                if (isMultiplayer && socketRef.current) {
                  socketRef.current.emit('updateItemState', newItem);
                  socketRef.current.emit('removeItem', droppedItem.uid);
                }
                tray.state = 'empty';
                player.holding = null;
                return;
              } else {
                // 트레이에 올바르지 않은 재료를 놓았을 때: 그냥 위에 올림
                droppedItem.status = 'placed';
                centerItemInZone(droppedItem, facingZone);
              }
            }

            // 2. 믹서기(Blend) 로직
            else if (facingZone.func === 'blend' && droppedItem.id === 'peeledPistachio') {
              blenderRef.current.state = 'processing';
              blenderRef.current.finishTime = now + 2000;
              cookedItemsRef.current = cookedItemsRef.current.filter(item => item.uid !== droppedItem.uid);
              player.holding = null;
              return;
            }

            // 3. 믹싱볼(Mix) 로직 [수정됨: 피스타치오 스프레드 넣기]
            else if (facingZone.func === 'mix' && droppedItem.id === 'pistachioSpread') {
              const isMixerFull = cookedItemsRef.current.some(item =>
                item.id === 'pistachioSpread_in_bowl' &&
                isRectIntersect({ x: item.x, y: item.y, w: item.w, h: item.h }, facingZone)
              );

              if (!isMixerFull) {
                droppedItem.id = 'pistachioSpread_in_bowl'; // ID 변경하여 렌더링에서 숨김/교체
                droppedItem.status = 'placed';
                centerItemInZone(droppedItem, facingZone);
                player.holding = null;
                broadcastItem(droppedItem);
                return;
              }
            }

            // 4. 전자레인지 & 냉장고
            else if (facingZone.func === 'microwave' && droppedItem.id === 'whiteChoco') {
              setProcessing('meltedWhiteChoco', 2000);
            } else if (facingZone.func === 'fridge' && droppedItem.id === 'innerpart') {
              setProcessing('frozenInnerpart', 5000);
            }

            // 5. 화덕(Fire) 로직
            else if (facingZone.func === 'fire') {
              const burner = getBurnerState(facingZone);

              // (1) 버터
              if (droppedItem.id === 'butter_v2') {
                if (burner.state === 'empty') {
                  burner.state = 'butter_processing';
                  burner.finishTime = now + 1000;
                  burner.items = ['butter_v2'];
                  cookedItemsRef.current = cookedItemsRef.current.filter(item => item.uid !== droppedItem.uid);
                  player.holding = null;
                  if (isMultiplayer && socketRef.current) {
                    socketRef.current.emit('updateBurnerState', { ...burner, x: facingZone.x, y: facingZone.y });
                    socketRef.current.emit('removeItem', droppedItem.uid);
                  }
                  return;
                }
              }
              // (2) 마시멜로
              else if (droppedItem.id === 'marshmallow') {
                if (burner.state === 'butter_ready') {
                  burner.state = 'marshmallow_processing';
                  burner.finishTime = now + 2000;
                  burner.items.push('marshmallow');
                  cookedItemsRef.current = cookedItemsRef.current.filter(item => item.uid !== droppedItem.uid);
                  player.holding = null;
                  if (isMultiplayer && socketRef.current) {
                    socketRef.current.emit('updateBurnerState', { ...burner, x: facingZone.x, y: facingZone.y });
                    socketRef.current.emit('removeItem', droppedItem.uid);
                  }
                  return;
                }
              }
              // (3) 카다이프 [수정됨: 넣으면 사라짐]
              else if (droppedItem.id.includes('kadaif') && !droppedItem.id.includes('toasted')) {
                if (burner.state === 'empty') {
                  burner.state = 'kadaif_processing';
                  burner.finishTime = now + 3000;
                  burner.items = ['kadaif_v1'];
                  // 바닥 아이템 삭제
                  cookedItemsRef.current = cookedItemsRef.current.filter(item => item.uid !== droppedItem.uid);
                  player.holding = null;
                  if (isMultiplayer && socketRef.current) {
                    // x, y 좌표 포함해서 전송 (수신측에서 키 식별용)
                    socketRef.current.emit('updateBurnerState', { ...burner, x: facingZone.x, y: facingZone.y });
                    socketRef.current.emit('removeItem', droppedItem.uid);
                  }
                  return;
                }
              }
              // (4) 코코아/분유
              else if (droppedItem.id === 'milkPowder_v2' || droppedItem.id === 'cocoa_v2') {
                if (burner.state === 'marshmallow_ready' || burner.state === 'mixing') {
                  burner.items.push(droppedItem.id);
                  cookedItemsRef.current = cookedItemsRef.current.filter(item => item.uid !== droppedItem.uid);
                  player.holding = null;

                  if (burner.items.includes('milkPowder_v2') && burner.items.includes('cocoa_v2')) {
                    burner.state = 'final_processing';
                    burner.finishTime = now + 1000;
                  } else {
                    burner.state = 'mixing';
                  }
                }
                if (isMultiplayer && socketRef.current) {
                  socketRef.current.emit('updateBurnerState', { ...burner, x: facingZone.x, y: facingZone.y });
                  socketRef.current.emit('removeItem', droppedItem.uid);
                }
                return;
              } else {
                // 화덕에 올바르지 않은 재료를 놓았을 때: 그냥 위에 올림
                droppedItem.status = 'placed';
                centerItemInZone(droppedItem, facingZone);
              }
            }


            // 6. 포장 (즉시 완료)
            else if (facingZone.func === 'package' && droppedItem.id === 'finalCookie') {
              droppedItem.id = 'packagedCookie';
              droppedItem.name = getNameForIngredient('packagedCookie');
              droppedItem.color = getColorForIngredient('packagedCookie');
              droppedItem.status = 'ground';
              centerItemInZone(droppedItem, facingZone);
              broadcastItem(droppedItem);
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

    // ----------------------------------------------------------------
    // Pickup (아이템 집기)
    // ----------------------------------------------------------------
    if (!player.holding && isSpacePressed) {
      const { zone: facingZone, x: facingX, y: facingY } = getFacingInfo(player, ZONES, true);

      // 1. 믹서기에서 꺼내기
      if (facingZone && facingZone.func === 'blend' && blenderRef.current.state === 'ready') {
        const newUid = `pistachioSpread_${now}_${Math.random()}`;
        const newItem = {
          id: 'pistachioSpread',
          uid: newUid,
          x: player.x,
          y: player.y,
          w: ITEM_SIZE,
          h: ITEM_SIZE,
          color: getColorForIngredient('pistachioSpread'),
          name: getNameForIngredient('pistachioSpread'),
          status: 'held',
          holderId: socketRef.current?.id
        };
        cookedItemsRef.current.push(newItem);
        player.holding = newUid;
        blenderRef.current.state = 'empty';
        broadcastItem(newItem);
      }

      // 2. 화덕에서 꺼내기
      else if (facingZone && facingZone.func === 'fire') {
        const burner = getBurnerState(facingZone);
        if (burner.state === 'final_ready') {
          const newUid = `dough_${now}_${Math.random()}`;
          const newItem = {
            id: 'dough',
            uid: newUid,
            x: player.x,
            y: player.y,
            w: ITEM_SIZE,
            h: ITEM_SIZE,
            color: getColorForIngredient('dough'),
            name: getNameForIngredient('dough'),
            status: 'held',
            holderId: socketRef.current?.id
          };
          cookedItemsRef.current.push(newItem);
          player.holding = newUid;
          burner.state = 'empty';
          burner.items = [];
          broadcastItem(newItem);
        }
        // [수정됨: 구운 카다이프 꺼내기]
        else if (burner.state === 'kadaif_ready') {
          const newUid = `toastedKadaif_${now}_${Math.random()}`;
          const newItem = {
            id: 'toastedKadaif',
            uid: newUid,
            x: player.x,
            y: player.y,
            w: ITEM_SIZE,
            h: ITEM_SIZE,
            color: getColorForIngredient('toastedKadaif'),
            name: getNameForIngredient('toastedKadaif'),
            status: 'held',
            holderId: socketRef.current?.id
          };
          cookedItemsRef.current.push(newItem);
          player.holding = newUid;
          burner.state = 'empty'; // 화덕 비우기
          burner.items = [];
          broadcastItem(newItem);
        } else {
          // 화덕 위에 잘못 놓인 아이템 집기
          const placedItem = cookedItems.find(item =>
            item.status === 'placed' &&
            isRectIntersect({ x: item.x, y: item.y, w: item.w, h: item.h }, facingZone)
          );
          if (placedItem) {
            placedItem.status = 'held';
            placedItem.holderId = socketRef.current?.id;
            player.holding = placedItem.uid;
            broadcastItem(placedItem);
          }
        }
      }

      // 3. 믹싱볼(Mix)에서 꺼내기 [수정됨]
      else if (facingZone && facingZone.func === 'mix') {
        const bowlItem = cookedItemsRef.current.find(item =>
          isRectIntersect({ x: item.x, y: item.y, w: item.w, h: item.h }, facingZone)
        );

        if (bowlItem) {
          if (bowlItem.id === 'pistachioSpread_in_bowl') {
            // 볼 안의 아이템 삭제
            cookedItemsRef.current = cookedItemsRef.current.filter(i => i.uid !== bowlItem.uid);
            if (isMultiplayer && socketRef.current) socketRef.current.emit('removeItem', bowlItem.uid);

            // 플레이어 손에 새 스프레드 생성
            const newUid = `pistachioSpread_${now}_${Math.random()}`;
            const newItem = {
              id: 'pistachioSpread',
              uid: newUid,
              x: player.x,
              y: player.y,
              w: ITEM_SIZE,
              h: ITEM_SIZE,
              color: getColorForIngredient('pistachioSpread'),
              name: getNameForIngredient('pistachioSpread'),
              status: 'held',
              holderId: socketRef.current?.id
            };

            cookedItemsRef.current.push(newItem);
            player.holding = newUid;
            broadcastItem(newItem);
          } else {
            // 일반 아이템 집기 (innerpart 등)
            bowlItem.status = 'held';
            bowlItem.holderId = socketRef.current?.id;
            player.holding = bowlItem.uid;
            broadcastItem(bowlItem);
          }
        }
      }

      // 4. 바닥/재료 집기 (기본)
      else {
        const pickupRange = {
          x: facingX,
          y: facingY,
          w: GRID_SIZE,
          h: GRID_SIZE
        };

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
            const newUid = `${baseItem.id}_${now}_${Math.random()}`;
            const newItem = { ...baseItem, uid: newUid, x: player.x, y: player.y, status: 'held', holderId: socketRef.current?.id };

            // 재료 변환 로직
            if (newItem.id === 'kadaif') {
              newItem.id = 'kadaif_v1';
              newItem.color = getColorForIngredient('kadaif_v1');
              newItem.name = getNameForIngredient('kadaif_v1');
            }
            if (newItem.id === 'butter') {
              newItem.id = 'butter_v2';
              newItem.color = getColorForIngredient('butter_v2');
              newItem.name = getNameForIngredient('butter_v2');
            }
            if (newItem.id === 'milkPowder') {
              newItem.id = 'milkPowder_v2';
              newItem.color = getColorForIngredient('milkPowder_v2');
              newItem.name = getNameForIngredient('milkPowder_v2');
            }
            if (newItem.id === 'cocoa') {
              newItem.id = 'cocoa_v2';
              newItem.color = getColorForIngredient('cocoa_v2');
              newItem.name = getNameForIngredient('cocoa_v2');
            }

            cookedItems.push(newItem);
            player.holding = newUid;
            broadcastItem(newItem);
          }
        }
      }
    }

    // Exit delivery
    const heldItem = cookedItems.find(i => i.uid === player.holding);
    if (heldItem && isSpacePressed) {
      // interactRect를 사용하여 플레이어 주변의 zones 확인
      const exitZone = ZONES.find(zone =>
        zone.type === 'exit' && isRectIntersect(interactRect, zone)
      );

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
    };
  };
};