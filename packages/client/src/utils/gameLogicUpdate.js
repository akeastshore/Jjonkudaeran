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

    // --- Fire Logic ---
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

    // Processing
    cookedItems.forEach(item => {
      if (item.status === 'processing' && now >= item.finishTime) {
        item.status = 'ground';
        item.id = item.nextId;
        item.name = getNameForIngredient(item.nextId);
        item.color = getColorForIngredient(item.nextId);
        item.holderId = null;

        const currentZone = ZONES.find(z => isRectIntersect({ x: item.x, y: item.y, w: item.w, h: item.h }, z));

        if (currentZone && (currentZone.func === 'microwave' || currentZone.func === 'fridge' ||
          currentZone.func === 'blend' || currentZone.func === 'peel' || currentZone.func === 'fire')) {
          placeItemInFrontOfZone(item, currentZone);
        } else if (currentZone) {
          centerItemInZone(item, currentZone);
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
    });

    // Cooking
    if (fire.isOn) {
      const fireZones = ZONES.filter(z => z.func === 'fire');
      fireZones.forEach(zone => {
        checkRecipe(zone, cookedItems, 'meltedMarshmallow', ['butter', 'marshmallow']);
        checkRecipe(zone, cookedItems, 'toastedKadaif', ['kadaif_v1', 'butter_v2']);
      });
    }

    const mixZone = ZONES.find(z => z.func === 'mix');
    if (mixZone) {
      checkRecipe(mixZone, cookedItems, 'whiteChoco_pistachio', ['meltedWhiteChoco', 'pistachioSpread']);
      checkRecipe(mixZone, cookedItems, 'innerpart', ['whiteChoco_pistachio', 'toastedKadaif']);
      checkRecipe(mixZone, cookedItems, 'innerpart', ['whiteChoco_pistachio', 'toastedKadaif']);
      checkRecipe(mixZone, cookedItems, 'innerpart', ['meltedWhiteChoco', 'pistachioSpread', 'toastedKadaif']);
    }



    // Drop
    if (player.holding && !isSpacePressed) {
      const heldUid = player.holding;
      let droppedItem = cookedItems.find(i => i.uid === heldUid);

      if (droppedItem) {
        const { zone: facingZone, x: facingX, y: facingY } = getFacingInfo(player, ZONES, true);

        if (facingZone) {
          if (facingZone.type === 'wall' || facingZone.ingredient) {
            droppedItem.status = 'ground';
            centerItemOnGrid(droppedItem, facingX, facingY);
          } else {
            const setProcessing = (nextId, duration) => {
              droppedItem.status = 'processing';
              droppedItem.finishTime = now + duration;
              droppedItem.nextId = nextId;
              centerItemInZone(droppedItem, facingZone);
            };

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
              }
            } else if (facingZone.func === 'blend' && droppedItem.id === 'peeledPistachio') {
              blenderRef.current.state = 'processing';
              blenderRef.current.finishTime = now + 2000;
              cookedItemsRef.current = cookedItemsRef.current.filter(item => item.uid !== droppedItem.uid);
              player.holding = null;
              return;
            } else if (facingZone.func === 'microwave' && droppedItem.id === 'whiteChoco') {
              setProcessing('meltedWhiteChoco', 2000);
            } else if (facingZone.func === 'fridge' && droppedItem.id === 'innerpart') {
              setProcessing('frozenInnerpart', 5000);

            } else if (facingZone.func === 'fire' && (droppedItem.id === 'butter_v2' || droppedItem.id === 'marshmallow' || droppedItem.id === 'milkPowder_v2' || droppedItem.id === 'cocoa_v2' || droppedItem.id === 'kadaif_v1')) {
              const burner = getBurnerState(facingZone);

              if (droppedItem.id === 'butter_v2') {
                if (burner.state === 'empty') {
                  burner.state = 'butter_processing';
                  burner.finishTime = now + 1000;
                  burner.items = ['butter_v2'];
                  cookedItemsRef.current = cookedItemsRef.current.filter(item => item.uid !== droppedItem.uid);
                  player.holding = null;
                  return;
                }
              } else if (droppedItem.id === 'marshmallow') {
                if (burner.state === 'butter_ready') {
                  burner.state = 'marshmallow_processing';
                  burner.finishTime = now + 2000;
                  burner.items.push('marshmallow');
                  cookedItemsRef.current = cookedItemsRef.current.filter(item => item.uid !== droppedItem.uid);
                  player.holding = null;
                  return;
                }
              } else if (droppedItem.id === 'kadaif_v1') {
                if (burner.state === 'empty') {
                  burner.state = 'kadaif_processing';
                  burner.finishTime = now + 3000;
                  burner.items = ['kadaif_v1'];
                  cookedItemsRef.current = cookedItemsRef.current.filter(item => item.uid !== droppedItem.uid);
                  player.holding = null;
                  return;
                }
              } else if (droppedItem.id === 'milkPowder_v2' || droppedItem.id === 'cocoa_v2') {
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
                  return;
                }
              }
            } else if (facingZone.func === 'package' && droppedItem.id === 'finalCookie') {
              setProcessing('packagedCookie', 1000);
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

    // Pickup
    if (!player.holding && isSpacePressed) {
      const { zone: facingZone, x: facingX, y: facingY } = getFacingInfo(player, ZONES, true);

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
      } else if (facingZone && facingZone.func === 'fire') {
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
        } else if (burner.state === 'kadaif_ready') {
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
          burner.state = 'empty';
          burner.items = [];
          broadcastItem(newItem);
        }
      } else {
        const pickupRange = {
          x: facingX,
          y: facingY,
          w: GRID_SIZE,
          h: GRID_SIZE
        };

        const target = cookedItems
          .filter(i => i.status === 'ground' || i.status === 'cooking')
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
    if (heldItem && isSpacePressed && nearbyZone && nearbyZone.type === 'exit') {
      if (heldItem.id === 'packagedCookie') {
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
