// src/GameCanvas.jsx (리팩토링)
import { useEffect, useRef } from 'react';
import {
  GRID_SIZE,
  MAP_WIDTH,
  MAP_HEIGHT,
  PLAYER_SIZE,
  ITEM_SIZE,
  MOVE_DELAY,
  INGREDIENT_IMAGES,
  TOOL_IMAGES,
  INGREDIENT_LEGEND,
  createZones,
} from './constants/gameConstants';
import {
  isRectIntersect,
  getFacingInfo,
  centerItemInZone,
  centerItemOnGrid,
  placeItemInFrontOfZone,
  generateUID,
} from './utils/gameUtils';
import { getColorForIngredient, getNameForIngredient } from './utils/ingredientHelpers';
import { useImageLoader } from './hooks/useImageLoader';
import { useMultiplayerSync } from './hooks/useMultiplayerSync';
import { usePlayerControls } from './hooks/usePlayerControls';
import { spawnItem, checkRecipe, getBurnerState as getBurnerStateUtil } from './utils/gameMechanics';
import { updateMovement as updatePlayerMovement } from './utils/playerMovement';
import { createDrawFunction } from './utils/gameRenderer';

const GameCanvas = ({ selectedChar, isPlaying, onBurgerDelivered, score, isMultiplayer, roomId, socketProp }) => {
  const canvasRef = useRef(null);

  // Zones 생성
  const ZONES = createZones();

  // --- [초기화] ---
  const INITIAL_INGREDIENTS = {};
  ZONES.forEach(zone => {
    if (zone.ingredient) {
      INITIAL_INGREDIENTS[zone.ingredient] = {
        id: zone.ingredient,
        uid: `${zone.ingredient}_base`,
        x: zone.px + zone.pw/2 - ITEM_SIZE/2,
        y: zone.py + zone.ph/2 - ITEM_SIZE/2,
        w: ITEM_SIZE, h: ITEM_SIZE,
        color: getColorForIngredient(zone.ingredient),
        status: 'spawn', 
        name: getNameForIngredient(zone.ingredient)
      };
    }
  });

  const playerRef = useRef({
    x: Math.floor((MAP_WIDTH / 2 - PLAYER_SIZE / 2) / GRID_SIZE) * GRID_SIZE,
    y: Math.floor((MAP_HEIGHT / 2) / GRID_SIZE) * GRID_SIZE,
    w: PLAYER_SIZE, h: PLAYER_SIZE,
    color: '#646cff', 
    holding: null, 
    direction: 'down',
    lastMoveTime: 0
  });

  const itemsRef = useRef(JSON.parse(JSON.stringify(INITIAL_INGREDIENTS)));
  const cookedItemsRef = useRef([]); 
  const keysRef = useRef({});

  const fireRef = useRef({
    isOn: false, turnOffTime: 0, pressStartTime: 0, isPressing: false
  });

  const blenderRef = useRef({
    state: 'empty', // 'empty', 'processing', 'ready'
    finishTime: 0
  });

  // 각 화구마다 독립적인 상태 관리 (위치를 키로 사용)
  const burnerStatesRef = useRef({});
  
  // 화구 상태 가져오기 (유틸리티 함수 사용)
  const getBurnerState = (zone) => getBurnerStateUtil(burnerStatesRef, zone);

  // 커스텀 훅 사용
  const imagesRef = useImageLoader(selectedChar);
  const { socketRef, otherPlayersRef } = useMultiplayerSync(
    isMultiplayer,
    socketProp,
    playerRef,
    fireRef,
    cookedItemsRef
  );
  usePlayerControls(keysRef);

  // --- [게임 루프 및 로직] ---
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: false }); // 성능 향상
    canvas.width = MAP_WIDTH;
    canvas.height = MAP_HEIGHT;
    
    // 이미지 렌더링 품질 설정
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    if (!isPlaying) {
       itemsRef.current = JSON.parse(JSON.stringify(INITIAL_INGREDIENTS));
       cookedItemsRef.current = []; 
       playerRef.current.holding = null;
       fireRef.current = { 
           isOn: false, 
           isFacing: false, 
           facingStartTime: 0 
       };
       
       let startX = MAP_WIDTH / 2 - PLAYER_SIZE / 2;
       let startY = MAP_HEIGHT / 2;
       playerRef.current.x = Math.floor(startX / GRID_SIZE) * GRID_SIZE; 
       playerRef.current.y = Math.floor(startY / GRID_SIZE) * GRID_SIZE;
    }

    // 키보드 컨트롤은 usePlayerControls 훅에서 처리됨

    // 헬퍼: 아이템 생성
    const spawnItem = (id, zone) => {
        const newItem = {
            id: id,
            uid: `${id}_${Date.now()}_${Math.random()}`,
            x: 0, y: 0, w: ITEM_SIZE, h: ITEM_SIZE,
            color: getColorForIngredient(id),
            status: 'ground',
            name: getNameForIngredient(id)
        };
        centerItemInZone(newItem, zone);
        cookedItemsRef.current.push(newItem);
        if (isMultiplayer && socketRef.current) {
            socketRef.current.emit('updateItemState', newItem);
        }
    };

    const checkRecipe = (zone, ingredients, outputId, recipeIds) => {
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

    const updateGameLogic = () => {
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

      // --- Fire Logic (안정화 버전) ---
      
      // --- Fire Logic (시선 고정 로직) ---
      const fire = fireRef.current;
      
      // 1. 내가 불을 쳐다보고 있는지 확인 (facingZone 활용)
      const { zone: facingZone } = getFacingInfo(player, ZONES);
      const isFacingFire = facingZone && facingZone.func === 'fire';

      if (isFacingFire) {
          // A. 처음 쳐다봤을 때 (카운트 시작)
          if (!fire.isFacing) {
              fire.isFacing = true;
              fire.facingStartTime = now;
              fire.isOn = false; // 아직은 꺼져있음

              // [전송] "나 쳐다보기 시작했어!"
              if (isMultiplayer && socketRef.current) {
                  socketRef.current.emit('updateFireState', { 
                      isFacing: true, 
                      facingStartTime: now, 
                      isOn: false 
                  });
              }
          } 
          // B. 계속 쳐다보는 중 (2초 체크)
          else {
              // 2초가 지났고, 아직 불이 안 켜졌다면 -> 점화!
              if (!fire.isOn && now - fire.facingStartTime > 2000) {
                  fire.isOn = true;
                  
                  // [전송] "불 켜졌어!"
                  if (isMultiplayer && socketRef.current) {
                      socketRef.current.emit('updateFireState', { 
                          isFacing: true, 
                          facingStartTime: fire.facingStartTime, 
                          isOn: true 
                      });
                  }
              }
          }
      } 
      // 2. 다른 곳을 보거나 이동함 (즉시 리셋)
      else {
          if (fire.isFacing || fire.isOn) {
              fire.isFacing = false;
              fire.isOn = false; // 불 꺼짐
              fire.facingStartTime = 0;

              // [전송] "나 딴데 봐. 불 꺼."
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
             item.holderId = null; // 다시 집을 수 있도록 리셋
             
             const currentZone = ZONES.find(z => isRectIntersect({x:item.x, y:item.y, w:item.w, h:item.h}, z));
             
             // 특정 기계(전자레인지, 냉장고, 믹서기, 까기, 후라이팬)에서 나온 아이템은 앞쪽에 배치
             if (currentZone && (currentZone.func === 'microwave' || currentZone.func === 'fridge' || 
                 currentZone.func === 'blend' || currentZone.func === 'peel' || currentZone.func === 'fire')) {
                 placeItemInFrontOfZone(item, currentZone);
             } else if (currentZone) {
                 centerItemInZone(item, currentZone);
             }
             
             // 서버에 변경사항 알림
             broadcastItem(item);
        }
      });

      // 믹서기 상태 업데이트
      const blender = blenderRef.current;
      if (blender.state === 'processing' && now >= blender.finishTime) {
        blender.state = 'ready'; // 완성됨
      }

      // 모든 후라이팬 상태 업데이트
      const fireZones = ZONES.filter(z => z.func === 'fire');
      fireZones.forEach(zone => {
        const burner = getBurnerState(zone);
        if (burner.state === 'marshmallow_processing' && now >= burner.finishTime) {
          burner.state = 'marshmallow_ready'; // 마시멜로우 녹음 완료
        } else if (burner.state === 'final_processing' && now >= burner.finishTime) {
          burner.state = 'final_ready'; // 도우 완성
        }
      });

      // Cooking
      if (fire.isOn) {
          const fireZones = ZONES.filter(z => z.func === 'fire');
          fireZones.forEach(zone => {
              checkRecipe(zone, cookedItems, 'meltedMarshmallow', ['butter', 'marshmallow']);
              checkRecipe(zone, cookedItems, 'toastedKadaif', ['kadaif_v1', 'butter_v2']); // 카다이프 + 버터 = 볶은 카다이프
          });
      }
      const mixZone = ZONES.find(z => z.func === 'mix');
      if (mixZone) {
          // ✅ [신규 1단계] 녹은 초콜릿 + 피스타치오 스프레드 = 초코피스타치오 믹스
          checkRecipe(mixZone, cookedItems, 'whiteChoco_pistachio', ['meltedWhiteChoco', 'pistachioSpread']);

          // ✅ [신규 2단계] 초코피스타치오 믹스 + 볶은 카다이프 = 속(filling) 완성
          checkRecipe(mixZone, cookedItems, 'filling', ['whiteChoco_pistachio', 'toastedKadaif']);

          // (도우 만드는 레시피는 그대로 유지)
          checkRecipe(mixZone, cookedItems, 'dough', ['meltedMarshmallow', 'milkPowder', 'cocoa']);
      }
      const spreadZone = ZONES.find(z => z.func === 'spread');
      if (spreadZone) {
          checkRecipe(spreadZone, cookedItems, 'finalCookie', ['dough', 'hardFilling', 'cocoa']);
      }

      // Drop
      if (player.holding && !isSpacePressed) {
        const heldUid = player.holding;
        let droppedItem = cookedItems.find(i => i.uid === heldUid);
        
        if (droppedItem) {
            // 아이템을 놓을 때는 넓은 범위로 zone 체크
            const { zone: facingZone, x: facingX, y: facingY } = getFacingInfo(player, ZONES, true);

            if (facingZone) {
                if (facingZone.type === 'wall' || facingZone.ingredient) {
                    droppedItem.status = 'ground';
                    centerItemOnGrid(droppedItem, facingX, facingY);
                } 
                else {
                    const setProcessing = (nextId, duration) => {
                        droppedItem.status = 'processing';
                        droppedItem.finishTime = now + duration;
                        droppedItem.nextId = nextId;
                        centerItemInZone(droppedItem, facingZone);
                    };

                    if (facingZone.func === 'peel' && droppedItem.id === 'pistachio') setProcessing('peeledPistachio', 1000);
                    else if (facingZone.func === 'blend' && droppedItem.id === 'peeledPistachio') {
                      // 믹서기에 피스타치오 넣기
                      blenderRef.current.state = 'processing';
                      blenderRef.current.finishTime = now + 2000;
                      // 아이템 제거
                      cookedItemsRef.current = cookedItemsRef.current.filter(item => item.uid !== droppedItem.uid);
                      player.holding = null;
                      return; // 더 이상 처리하지 않음
                    }
                    else if (facingZone.func === 'microwave' && droppedItem.id === 'whiteChoco') setProcessing('meltedWhiteChoco', 2000);
                    else if (facingZone.func === 'fridge' && droppedItem.id === 'filling') setProcessing('hardFilling', 5000);
                    
                    // 후라이팬 요리 로직
                    else if (facingZone.func === 'fire' && (droppedItem.id === 'marshmallow' || droppedItem.id === 'milkPowder_v2' || droppedItem.id === 'cocoa_v2')) {
                      const burner = getBurnerState(facingZone); // 해당 화구의 상태 가져오기
                      
                      // 마시멜로우를 넣는 경우
                      if (droppedItem.id === 'marshmallow') {
                        if (burner.state === 'empty') {
                          burner.state = 'marshmallow_processing';
                          burner.finishTime = now + 1000; // 1초
                          burner.items = ['marshmallow'];
                          // 아이템 제거
                          cookedItemsRef.current = cookedItemsRef.current.filter(item => item.uid !== droppedItem.uid);
                          player.holding = null;
                          return;
                        }
                      }
                      // 탈지분유나 코코아를 넣는 경우 (marshmallow_ready 또는 mixing 상태에서)
                      else if (droppedItem.id === 'milkPowder_v2' || droppedItem.id === 'cocoa_v2') {
                        if (burner.state === 'marshmallow_ready' || burner.state === 'mixing') {
                          burner.items.push(droppedItem.id);
                          // 아이템 제거
                          cookedItemsRef.current = cookedItemsRef.current.filter(item => item.uid !== droppedItem.uid);
                          player.holding = null;
                          
                          // 탈지분유와 코코아가 모두 들어갔는지 확인
                          if (burner.items.includes('milkPowder_v2') && burner.items.includes('cocoa_v2')) {
                            burner.state = 'final_processing';
                            burner.finishTime = now + 1000; // 1초
                          } else {
                            burner.state = 'mixing'; // 아직 다 안 들어감
                          }
                          return;
                        }
                      }
                    }
                    
                    // 포장 로직
                    else if (facingZone.func === 'package' && droppedItem.id === 'finalCookie') {
                      setProcessing('packagedCookie', 1000); 
                    }

                    else {
                        droppedItem.status = 'cooking'; 
                        centerItemInZone(droppedItem, facingZone);
                    }
                }
            } else {
                droppedItem.status = 'ground';
                centerItemOnGrid(droppedItem, facingX, facingY);
            }

            // ★ [추가] 중요: 이제 내가 안 들고 있으니 holderId 제거
            droppedItem.holderId = null; 
            
            // ★ [추가] 서버에 알리기!
            broadcastItem(droppedItem);
        }
        player.holding = null;
      }

      // Pickup
      if (!player.holding && isSpacePressed) {
        // 재료 칸 감지를 위해 넓은 범위로 zone 체크
        const { zone: facingZone } = getFacingInfo(player, ZONES, true);
        
        // 믹서기가 ready 상태면 pistachioSpread 꺼내기
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
          blenderRef.current.state = 'empty'; // 믹서기 비우기
          broadcastItem(newItem);
        }
        // 후라이팬이 final_ready 상태면 후라이팬(도우 포함) 집기
        else if (facingZone && facingZone.func === 'fire') {
          const burner = getBurnerState(facingZone); // 해당 화구의 상태 가져오기
          if (burner.state === 'final_ready') {
            const newUid = `panWithDough_${now}_${Math.random()}`;
            const newItem = {
              id: 'panWithDough',
              uid: newUid,
              x: player.x,
              y: player.y,
              w: ITEM_SIZE,
              h: ITEM_SIZE,
              color: getColorForIngredient('panWithDough'),
              name: getNameForIngredient('panWithDough'),
              status: 'held',
              holderId: socketRef.current?.id
            };
            cookedItemsRef.current.push(newItem);
            player.holding = newUid;
            burner.state = 'empty'; // 후라이팬 비우기
            burner.items = [];
            broadcastItem(newItem);
          }
        }
        else {
          // 플레이어 주변의 넓은 범위에서 아이템 찾기
          const pickupRange = {
              x: player.x - GRID_SIZE,
              y: player.y - GRID_SIZE,
              w: player.w + GRID_SIZE * 2,
              h: player.h + GRID_SIZE * 2
          };
          
        const target = cookedItems
            .filter(i => i.status === 'ground' || i.status === 'cooking')
              .find(i => isRectIntersect(pickupRange, i));

        if (target) {
            target.status = 'held';
            target.holderId = socketRef.current?.id; // ★ [추가] "이거 내가 들었어!" 표시
            player.holding = target.uid;

            // ★ [추가] 서버에 알리기
            broadcastItem(target);
        } 
        else if (facingZone && facingZone.ingredient) {
            const baseItem = items[facingZone.ingredient];
            if (baseItem.status === 'spawn') {
                const newUid = `${baseItem.id}_${now}_${Math.random()}`;
                const newItem = { ...baseItem, uid: newUid, x: player.x, y: player.y, status: 'held', holderId: socketRef.current?.id };
                
                // 카다이프를 집으면 kadaif_v1으로 변경
                if (newItem.id === 'kadaif') {
                  newItem.id = 'kadaif_v1';
                  newItem.color = getColorForIngredient('kadaif_v1');
                  newItem.name = getNameForIngredient('kadaif_v1');
                }
                
                // 버터를 집으면 butter_v2로 변경
                if (newItem.id === 'butter') {
                  newItem.id = 'butter_v2';
                  newItem.color = getColorForIngredient('butter_v2');
                  newItem.name = getNameForIngredient('butter_v2');
                }
                
                // 탈지분유를 집으면 milkPowder_v2로 변경
                if (newItem.id === 'milkPowder') {
                  newItem.id = 'milkPowder_v2';
                  newItem.color = getColorForIngredient('milkPowder_v2');
                  newItem.name = getNameForIngredient('milkPowder_v2');
                }
                
                // 코코아파우더를 집으면 cocoa_v2로 변경
                if (newItem.id === 'cocoa') {
                  newItem.id = 'cocoa_v2';
                  newItem.color = getColorForIngredient('cocoa_v2');
                  newItem.name = getNameForIngredient('cocoa_v2');
                }
                
                cookedItems.push(newItem);
                player.holding = newUid;

                // ★ [추가] "새 아이템 만들어서 내가 들었어!" 알리기
                broadcastItem(newItem);
            }
            }
        }
      }
      
      const heldItem = cookedItems.find(i => i.uid === player.holding);
      if (heldItem && isSpacePressed && nearbyZone && nearbyZone.type === 'exit') {
          if (heldItem.id === 'packagedCookie') { 
              // 1. 점수 올리기 (내 화면)
              onBurgerDelivered(); 
              
              // 2. 아이템 삭제 (내 화면)
              const idx = cookedItems.indexOf(heldItem);
              if (idx > -1) cookedItems.splice(idx, 1);
              player.holding = null;

              // 3. ★ [멀티플레이] 서버에 알리기
              if (isMultiplayer && socketRef.current) {
                  // "이 아이템 삭제해!"
                  socketRef.current.emit('removeItem', heldItem.uid);
                  
                  // "점수 1점 올렸어!" (현재 점수 + 1)
                  // 주의: onBurgerDelivered가 비동기라 score가 아직 안 올랐을 수 있으므로 score + 1을 보냄
                  socketRef.current.emit('updateScore', score + 1);
              }
          }
      }
    };

    let animationFrameId;
    const gameLoop = () => {
      if (isPlaying) {
        updatePlayerMovement(playerRef, keysRef, cookedItemsRef, ZONES, socketRef);
        updateGameLogic();
      }

      // ★ [NEW] 멀티플레이: 다른 사람이 들고 있는 아이템 위치 동기화
    if (isMultiplayer) {
       cookedItemsRef.current.forEach(item => {
          // 이 아이템을 누군가(holderId) 들고 있다면?
          if (item.status === 'held' && item.holderId && item.holderId !== socketRef.current?.id) {
             const holder = otherPlayersRef.current[item.holderId];
             if (holder) {
                // 그 사람의 위치로 아이템 강제 이동 (캐릭터 크기에 맞춰 조정)
                const centerOffset = (PLAYER_SIZE - ITEM_SIZE) / 2;
                if (holder.direction === 'up') { 
                  item.x = holder.x + centerOffset; 
                  item.y = holder.y - ITEM_SIZE - 20; 
                }
                else if (holder.direction === 'down') { 
                  item.x = holder.x + centerOffset; 
                  item.y = holder.y + PLAYER_SIZE + 20; 
                }
                else if (holder.direction === 'left') { 
                  item.x = holder.x - ITEM_SIZE - 20; 
                  item.y = holder.y + centerOffset; 
                }
                else if (holder.direction === 'right') { 
                  item.x = holder.x + PLAYER_SIZE + 20; 
                  item.y = holder.y + centerOffset; 
                }
             }
          }
       });
    }
      draw();
      animationFrameId = requestAnimationFrame(gameLoop);
    };

    // 이동 및 서버 전송
    // GameCanvas.jsx 내부의 updateMovement 함수 전체 교체

    // updateMovement는 utils/playerMovement.js에서 import됨

    const draw = () => {
      if (!canvasRef.current) return;
      
      // 배경을 체크무늬 타일로 채우기 (민트색과 아이보리색)
      for (let row = 0; row < MAP_HEIGHT / GRID_SIZE; row++) {
        for (let col = 0; col < MAP_WIDTH / GRID_SIZE; col++) {
          const isEven = (row + col) % 2 === 0;
          ctx.fillStyle = isEven ? '#A8C5B0' : '#F5E6D3'; // 민트색과 아이보리색
          ctx.fillRect(col * GRID_SIZE, row * GRID_SIZE, GRID_SIZE, GRID_SIZE);
        }
      }

      ctx.strokeStyle = '#D4C5B0'; // 그리드선
      for(let i=0; i<MAP_WIDTH/GRID_SIZE; i++) {
        for(let j=0; j<MAP_HEIGHT/GRID_SIZE; j++) ctx.strokeRect(i*GRID_SIZE, j*GRID_SIZE, GRID_SIZE, GRID_SIZE);
      }

      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ZONES.forEach(zone => {
        // 먼저 배경색 그리기
        ctx.fillStyle = zone.type === 'exit' ? '#666' : (zone.type === 'wall' ? '#FFDAB9' : '#E8B878');
        ctx.fillRect(zone.px, zone.py, zone.pw, zone.ph);
        
        // 재료 칸이면 재료 이미지 표시
        if (zone.ingredient) {
          const ingredientImg = imagesRef.current[zone.ingredient];
          if (ingredientImg && ingredientImg.complete && ingredientImg.naturalHeight !== 0) {
            // 재료별 크기 배율 적용
            let scale = 0.95;
            if (zone.ingredient === 'milkPowder') {
              scale = 1.4; // 탈지분유는 더 크게 (칸을 넘어서도 표시)
            } else if (zone.ingredient === 'kadaif') {
              scale = 1.3; // 카다이프도 크게
            } else if (zone.ingredient === 'pistachio') {
              scale = 1.2; // 안 깐 피스타치오도 크게
            }
            
            const imgSize = zone.pw * scale;
            const imgX = zone.px + (zone.pw - imgSize) / 2;
            const imgY = zone.py + (zone.ph - imgSize) / 2;
            ctx.drawImage(ingredientImg, imgX, imgY, imgSize, imgSize);
          }
        }
        
        // 도구 이미지가 있으면 배경 위에 이미지 표시
        if (zone.func && TOOL_IMAGES[zone.func]) {
          // 믹서기는 상태에 따라 다른 이미지 사용
          let toolImgSrc = TOOL_IMAGES[zone.func];
          if (zone.func === 'blend') {
            if (blenderRef.current.state === 'processing') {
              toolImgSrc = '/assets/tools/blender_closed_pistachio.png';
            } else if (blenderRef.current.state === 'ready') {
              toolImgSrc = '/assets/tools/blender_pistachio_spread.png';
            }
          }
          
          // 화구는 항상 burner.png 사용 (변경되지 않음)
          // 후라이팬만 상태에 따라 변경됨
          
          // 이미지를 즉시 로드 (간단한 구현)
          let toolImg = imagesRef.current[`tool_${zone.func}`];
          if (zone.func === 'blend' && blenderRef.current.state !== 'empty') {
            toolImg = new Image();
            toolImg.src = toolImgSrc;
          }
          
          if (toolImg && toolImg.complete && toolImg.naturalHeight !== 0) {
            // 불이 켜져있으면 빨간색 오버레이
            if (zone.func === 'fire' && fireRef.current.isOn) {
              ctx.fillStyle = '#FF4500';
        ctx.fillRect(zone.px, zone.py, zone.pw, zone.ph);
              ctx.globalAlpha = 0.6;
            }
            
            // 이미지를 크게 확대해서 4칸을 꽉 채우기
            let scale = 1.8;
            if (zone.func === 'microwave') scale = 1.3; // 전자레인지는 1.3배
            else if (zone.func === 'fridge') scale = 1.0; // 냉동고는 1.0배
            else if (zone.func === 'fire') scale = 1.5; // 화구는 1.5배
            else if (zone.func === 'peel') scale = 1.5; // 트레이는 1.5배
            else if (zone.func === 'blend') scale = 2.3; // 믹서기는 상태 관계없이 2.3배
            else if (zone.func === 'package') scale = 1.0; // 칸에 딱 맞게! (원하면 1.1 등 조절)
            else if (zone.func === 'mix') scale = 1.2;
            const imgRatio = toolImg.width / toolImg.height;
            const zoneRatio = zone.pw / zone.ph;
            
            let drawWidth, drawHeight, offsetX, offsetY;
            
            if (imgRatio > zoneRatio) {
              // 이미지가 zone보다 넓음 -> 높이를 맞추고 폭을 자름
              drawHeight = zone.ph * scale;
              drawWidth = drawHeight * imgRatio;
              offsetX = zone.px + zone.pw / 2 - drawWidth / 2;
              offsetY = zone.py + zone.ph / 2 - drawHeight / 2;
            } else {
              // 이미지가 zone보다 높음 -> 폭을 맞추고 높이를 자름
              drawWidth = zone.pw * scale;
              drawHeight = drawWidth / imgRatio;
              offsetX = zone.px + zone.pw / 2 - drawWidth / 2;
              offsetY = zone.py + zone.ph / 2 - drawHeight / 2;
            }
            
            // zone 영역만 잘라내기 위해 clip 사용
            ctx.save();
            ctx.beginPath();
            ctx.rect(zone.px, zone.py, zone.pw, zone.ph);
            ctx.clip();
            
            ctx.drawImage(toolImg, offsetX, offsetY, drawWidth, drawHeight);
            
            ctx.restore();
            
            // 화구 위에 팬 이미지 추가 (항상 표시, 상태에 따라 이미지 변경)
            if (zone.func === 'fire') {
              const burner = getBurnerState(zone); // 해당 화구의 상태 가져오기
              
              // 후라이팬 이미지를 상태에 따라 선택
              let panImgSrc = '/assets/tools/flyingpan.png'; // 기본 후라이팬
              if (burner.state === 'marshmallow_processing' || burner.state === 'marshmallow_ready' || burner.state === 'mixing') {
                panImgSrc = '/assets/tools/burner_marshmallow.png'; // 마시멜로우 넣은 후라이팬 (재료 하나만 넣었을 때도 유지)
              } else if (burner.state === 'final_processing') {
                panImgSrc = '/assets/tools/burner_mid.png'; // 재료 둘 다 넣음 (섞는 중)
              } else if (burner.state === 'final_ready') {
                panImgSrc = '/assets/tools/burner_final.png'; // 완성된 도우
              }
              
              const panImg = new Image();
              panImg.src = panImgSrc;
              if (panImg.complete && panImg.naturalHeight !== 0) {
                // 상태에 따라 다른 크기 적용 (손잡이가 잘리지 않도록)
                let panScale = 1.6; // 기본 후라이팬
                if (burner.state !== 'empty') {
                  panScale = 2.0; // 재료가 들어간 후라이팬은 더 크게
                }
                
                const panRatio = panImg.width / panImg.height;
                let panWidth, panHeight, panX, panY;
                
                if (panRatio > zoneRatio) {
                  panHeight = zone.ph * panScale;
                  panWidth = panHeight * panRatio;
                } else {
                  panWidth = zone.pw * panScale;
                  panHeight = panWidth / panRatio;
                }
                
                panX = zone.px + zone.pw / 2 - panWidth / 2 + 10; // 오른쪽으로 10픽셀 이동
                panY = zone.py + zone.ph / 2 - panHeight / 2;
                
                // 후라이팬은 clip 없이 그려서 손잡이가 잘리지 않도록
                ctx.drawImage(panImg, panX, panY, panWidth, panHeight);
              }
              
              if (fireRef.current.isOn) {
                ctx.globalAlpha = 1.0;
              }
            }
          }
        }
        
        // 테두리는 나중에 그려서 이미지 위에 표시
        ctx.strokeStyle = '#888'; 
        ctx.lineWidth = 2;
        ctx.strokeRect(zone.px, zone.py, zone.pw, zone.ph);
        
        // 믹서기와 전자레인지에서 processing 중인 아이템이 있으면 타이머 표시
        if (zone.func === 'microwave' || zone.func === 'blend') {
          const processingItem = cookedItemsRef.current.find(item => {
            if (item.status !== 'processing') return false;
            return isRectIntersect(
              {x: item.x, y: item.y, w: item.w, h: item.h}, 
              zone
            );
          });
          
          if (processingItem) {
            ctx.fillStyle = 'white'; 
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 3;
            ctx.font = 'bold 20px Arial';
            const remain = Math.ceil((processingItem.finishTime - Date.now())/1000);
            const timerX = zone.px + zone.pw / 2;
            const timerY = zone.py + zone.ph / 2;
            ctx.strokeText(`${remain}s`, timerX, timerY);
            ctx.fillText(`${remain}s`, timerX, timerY);
          }
        }

        if (zone.func === 'fire' && fireRef.current.isFacing && !fireRef.current.isOn) {
            const progress = Math.min((Date.now() - fireRef.current.facingStartTime) / 2000, 1);
            
            // 칸 하단에 차오르는 바 그리기
            ctx.fillStyle = '#FFD700'; // 골드색
            ctx.fillRect(zone.px + 5, zone.py + zone.ph - 8, (zone.pw - 10) * progress, 5);
            
            // 테두리
            ctx.strokeStyle = 'black';
            ctx.strokeRect(zone.px + 5, zone.py + zone.ph - 8, zone.pw - 10, 5);
        }
      });

      // 다른 플레이어 그리기
      Object.keys(otherPlayersRef.current).forEach(id => {
          if (socketRef.current && id === socketRef.current.id) return; 
          const p = otherPlayersRef.current[id];
          if (!p) return;
          
          // 사각형으로 플레이어 그리기 (멀티플레이어는 간단하게 유지)
          ctx.fillStyle = p.color || '#888'; 
          ctx.fillRect(p.x, p.y, PLAYER_SIZE, PLAYER_SIZE);
          
          // 눈 (캐릭터 크기에 맞춰 조정)
          ctx.fillStyle = 'white';
          const off = 12, sz = 8; // 크기 증가
          const cx = p.x + PLAYER_SIZE/2, cy = p.y + PLAYER_SIZE/2;
          let lx, ly, rx, ry;

          if (p.direction === 'up') { lx=cx-off; ly=cy-off; rx=cx+off; ry=cy-off; }
          else if (p.direction === 'down') { lx=cx-off; ly=cy+off; rx=cx+off; ry=cy+off; }
          else if (p.direction === 'left') { lx=cx-off; ly=cy-off; rx=cx-off; ry=cy+off; }
          else { lx=cx+off; ly=cy-off; rx=cx+off; ry=cy+off; }
          ctx.fillRect(lx, ly, sz, sz); ctx.fillRect(rx, ry, sz, sz);

          // 닉네임 표시
          if (p.nickname) {
            ctx.fillStyle = 'black';
            ctx.font = '12px Arial';
            ctx.fillText(p.nickname, cx, p.y - 12);
          }
      });

      // 나 그리기
      const player = playerRef.current;
      
      // 방향에 따라 적절한 이미지 선택
      let playerImgKey = 'playerChar_front'; // 기본값
      if (player.direction === 'up') playerImgKey = 'playerChar_back';
      else if (player.direction === 'down') playerImgKey = 'playerChar_front';
      else if (player.direction === 'left') playerImgKey = 'playerChar_left';
      else if (player.direction === 'right') playerImgKey = 'playerChar_right';
      
      const playerImg = imagesRef.current[playerImgKey];
      
      if (playerImg && playerImg.complete && playerImg.naturalHeight !== 0) {
          // 이미지가 로드되었으면 이미지 렌더링
          ctx.drawImage(playerImg, player.x, player.y, player.w, player.h);
      } else {
          // 이미지가 없으면 기존 사각형 + 눈 렌더링
          ctx.fillStyle = player.color; 
          ctx.fillRect(player.x, player.y, player.w, player.h);
          
      ctx.fillStyle = 'white';
          const off = 12, sz = 8; // 크기 증가
      const cx = player.x + player.w/2, cy = player.y + player.h/2;
      let lx, ly, rx, ry;
      if (player.direction === 'up') { lx=cx-off; ly=cy-off; rx=cx+off; ry=cy-off; }
      else if (player.direction === 'down') { lx=cx-off; ly=cy+off; rx=cx+off; ry=cy+off; }
      else if (player.direction === 'left') { lx=cx-off; ly=cy-off; rx=cx-off; ry=cy+off; }
      else { lx=cx+off; ly=cy-off; rx=cx+off; ry=cy+off; }
      ctx.fillRect(lx, ly, sz, sz); ctx.fillRect(rx, ry, sz, sz);
      }

      if (selectedChar && selectedChar.name) {
        ctx.fillStyle = 'black'; 
        ctx.font = 'bold 14px Arial';
        ctx.fillText(selectedChar.name, player.x + player.w/2, player.y + player.h + 15);
      }

      const drawItem = (item) => {
          // spawn 상태의 아이템은 재료 칸 배경에 이미 그려져 있으므로 그리지 않음
          if (item.status === 'spawn') {
              return;
          }
          
          // processing 중인 아이템이 어느 zone에 있는지 확인
          if (item.status === 'processing') {
              const itemZone = ZONES.find(z => isRectIntersect(
                  {x: item.x, y: item.y, w: item.w, h: item.h}, 
                  z
              ));
              
              // 전자레인지, 냉장고, 믹서기 안에서는 아이템을 안 보이게 (트레이는 보이게)
              if (itemZone && (itemZone.func === 'microwave' || itemZone.func === 'fridge' || itemZone.func === 'blend')) {
                  return; // 렌더링하지 않음
              }
          }
          
          // 특정 재료는 더 크게 표시
          let sizeMultiplier = 1.0;
          if (item.id === 'milkPowder_v2') {
            sizeMultiplier = 0.8; // 집은 탈지분유는 작게
          } else if (item.id === 'cocoa_v2') {
            sizeMultiplier = 1.0; // 집은 코코아파우더는 기본 크기
          } else if (item.id === 'pistachio') {
            sizeMultiplier = 0.8; // 집은 피스타치오는 작게
          } else if (item.id === 'marshmallow') {
            sizeMultiplier = 0.9; // 집은 마시멜로는 0.9배
          } else if (item.id === 'panWithDough') {
            sizeMultiplier = 1.5; // 후라이팬은 1.5배
          } else if (item.id === 'kadaif_v1') {
            sizeMultiplier = 1.3; // 집은 카다이프는 1.3배
          } else if (item.id === 'peeledPistachio') {
            sizeMultiplier = 1.8; // 깐 피스타치오는 1.8배 (더 크게)
          } else if (item.id === 'milkPowder') {
            sizeMultiplier = 2.5; // 재료 칸 탈지분유는 2.5배
          } else if (item.id === 'kadaif') {
            sizeMultiplier = 2.2; // 재료 칸 카다이프는 2.2배
          } else if (
            item.id === 'cocoa' || item.id === 'meltedMarshmallow'
          ) {
            sizeMultiplier = 1.5; // 다른 재료들은 크게
          }
          const drawWidth = item.w * sizeMultiplier;
          const drawHeight = item.h * sizeMultiplier;
          const drawX = item.x - (drawWidth - item.w) / 2;
          const drawY = item.y - (drawHeight - item.h) / 2;
          
          // 이미지가 있으면 이미지 렌더링, 없으면 색상 원 렌더링
          const img = imagesRef.current[item.id];
          if (img && img.complete && img.naturalHeight !== 0) {
              ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
          } else {
              // 이미지가 로드되지 않았으면 기존 색상 원으로 표시
          ctx.fillStyle = item.color;
              ctx.beginPath(); 
              ctx.arc(item.x + item.w/2, item.y + item.h/2, (item.w/2) * sizeMultiplier, 0, Math.PI*2); 
              ctx.fill();
          }
          
          // 처리 중 타이머 표시 (보이는 경우에만)
          if (item.status === 'processing') {
              ctx.fillStyle = 'white'; 
              ctx.strokeStyle = 'black';
              ctx.lineWidth = 3;
              ctx.font = 'bold 16px Arial';
              const remain = Math.ceil((item.finishTime - Date.now())/1000);
              ctx.strokeText(`${remain}s`, item.x + item.w/2, item.y - 10);
              ctx.fillText(`${remain}s`, item.x + item.w/2, item.y - 10);
          }
      };

      Object.values(itemsRef.current).forEach(drawItem); 
      cookedItemsRef.current.forEach(drawItem); 
    };

    gameLoop();
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [selectedChar, isPlaying, onBurgerDelivered, socketProp, isMultiplayer]);

  return (
    <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', justifyContent: 'center' }}>
      <canvas ref={canvasRef} style={{ border: '2px solid #333', backgroundColor: '#A8C5B0' }} />
      <div style={{ background: '#333', padding: '20px', borderRadius: '10px', color: 'white', minWidth: '200px' }}>
        <h3 style={{ borderBottom: '1px solid #555', paddingBottom: '10px', marginTop: 0 }}>재료 설명</h3>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 5px' }}>
          <tbody>
            {INGREDIENT_LEGEND.map((item, idx) => (
              <tr key={idx}>
                <td style={{ width: '20px' }}>
                  <div style={{ width: '15px', height: '15px', borderRadius: '50%', backgroundColor: item.color, border: '1px solid #fff' }} />
                </td>
                <td style={{ textAlign: 'left', fontSize: '0.8rem' }}>{item.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GameCanvas;