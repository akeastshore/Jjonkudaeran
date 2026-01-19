// src/GameCanvas.jsx (최종 수정)
import { useEffect, useRef } from 'react';
// import { io } from "socket.io-client";  <-- 이거 이제 필요 없음! (App에서 받아옴)

const GameCanvas = ({ selectedChar, isPlaying, onBurgerDelivered, score, isMultiplayer, roomId, socketProp }) => {
  const canvasRef = useRef(null);
  
  // 소켓 레퍼런스 (App에서 받은 걸 여기에 저장)
  const socketRef = useRef(null);
  
  // 다른 플레이어들 정보
  const otherPlayersRef = useRef({});

  // --- 상수 설정 ---
  const GRID_SIZE = 40; 
  const MAP_WIDTH = 800;  
  const MAP_HEIGHT = 600; 
  const PLAYER_SIZE = 40; 
  const ITEM_SIZE = 30;
  const MOVE_DELAY = 70; // 이동 딜레이 (ms)

  // --- [범례 데이터] ---
  const INGREDIENT_LEGEND = [
    { name: '피스타치오', color: '#93C572' },
    { name: '깐 피스타치오', color: '#90EE90' },
    { name: '피스타치오 스프레드', color: '#228B22' },
    { name: '카다이프', color: '#DAA520' },
    { name: '화이트초콜릿', color: '#FAF0E6' },
    { name: '녹은 화이트초콜릿', color: '#FFFFF0' },
    { name: '버터', color: '#F0E68C' },
    { name: '마시멜로', color: '#FFFAFA' },
    { name: '녹은 마시멜로', color: '#EEE' },
    { name: '탈지분유', color: '#FFF8DC' },
    { name: '코코아파우더', color: '#8B4513' },
    { name: '속', color: '#ADFF2F' },
    { name: '굳은 속', color: '#32CD32' },
    { name: '피', color: '#D2691E' },
    { name: '두쫀쿠(완성)', color: '#A0522D' },
    { name: '포장된 두쫀쿠', color: '#FF1493' },
  ];

  // --- [맵 레이아웃] ---
  const LAYOUT = [
    // [상단]
    { x: 3, y: 0, w: 2, h: 2, label: '까기', type: 'station', func: 'peel' },
    { x: 5, y: 0, w: 1, h: 2, label: '', type: 'wall' }, 
    { x: 6, y: 0, w: 2, h: 2, label: '믹서기', type: 'station', func: 'blend' },
    { x: 9, y: 0, w: 2, h: 2, label: '제출구', type: 'exit' },
    { x: 12, y: 0, w: 2, h: 2, label: '스프레드', type: 'station', func: 'spread' },
    { x: 14, y: 0, w: 1, h: 2, label: '', type: 'wall' }, 
    { x: 15, y: 0, w: 2, h: 2, label: '포장', type: 'station', func: 'package' },

    // [왼쪽 재료]
    { x: 0, y: 3, w: 2, h: 2, label: '', type: 'station', ingredient: 'pistachio' },
    { x: 0, y: 5, w: 2, h: 1, label: '', type: 'wall' },
    { x: 0, y: 6, w: 2, h: 2, label: '', type: 'station', ingredient: 'kadaif' },
    { x: 0, y: 8, w: 2, h: 1, label: '', type: 'wall' },
    { x: 0, y: 9, w: 2, h: 2, label: '', type: 'station', ingredient: 'whiteChoco' },

    // [오른쪽 재료]
    { x: 18, y: 3, w: 2, h: 2, label: '', type: 'station', ingredient: 'butter' },
    { x: 18, y: 5, w: 2, h: 1, label: '', type: 'wall' },
    { x: 18, y: 6, w: 2, h: 2, label: '', type: 'station', ingredient: 'marshmallow' },
    { x: 18, y: 8, w: 2, h: 1, label: '', type: 'wall' },
    { x: 18, y: 9, w: 2, h: 2, label: '', type: 'station', ingredient: 'milkPowder' },
    { x: 18, y: 11, w: 2, h: 1, label: '', type: 'wall' },
    { x: 18, y: 12, w: 2, h: 2, label: '', type: 'station', ingredient: 'cocoa' },

    // [하단]
    { x: 3, y: 13, w: 2, h: 2, label: '냉장고', type: 'station', func: 'fridge' },
    { x: 5, y: 13, w: 1, h: 2, label: '', type: 'wall' },
    { x: 6, y: 13, w: 2, h: 2, label: '전자레인지', type: 'station', func: 'microwave' }, 
    { x: 8, y: 13, w: 1, h: 2, label: '', type: 'wall' },
    { x: 9, y: 13, w: 2, h: 2, label: '섞기', type: 'station', func: 'mix' },
    { x: 12, y: 13, w: 2, h: 2, label: '불', type: 'station', func: 'fire' },
    { x: 14, y: 13, w: 1, h: 2, label: '', type: 'wall' },
    { x: 15, y: 13, w: 2, h: 2, label: '불', type: 'station', func: 'fire' },
  ];

  const ZONES = LAYOUT.map(z => ({
    ...z,
    px: z.x * GRID_SIZE,
    py: z.y * GRID_SIZE,
    pw: z.w * GRID_SIZE,
    ph: z.h * GRID_SIZE
  }));

  // 색상 매핑
  function getColorForIngredient(name) {
    const map = {
        pistachio: '#93C572', kadaif: '#DAA520', whiteChoco: '#FAF0E6',
        butter: '#F0E68C', marshmallow: '#FFFAFA', milkPowder: '#FFF8DC', cocoa: '#8B4513',
        peeledPistachio: '#90EE90', pistachioSpread: '#228B22', meltedWhiteChoco: '#FFFFF0',
        filling: '#ADFF2F', hardFilling: '#32CD32',
        meltedMarshmallow: '#EEE', dough: '#D2691E',
        finalCookie: '#A0522D', packagedCookie: '#FF1493'
    };
    return map[name] || '#FFF';
  }

  function getNameForIngredient(id) {
    const map = {
        pistachio: '피스타치오', kadaif: '카다이프', whiteChoco: '화이트초콜릿',
        butter: '버터', marshmallow: '마시멜로', milkPowder: '탈지분유', cocoa: '코코아파우더',
        peeledPistachio: '깐 피스타치오', pistachioSpread: '피스타치오 스프레드', meltedWhiteChoco: '녹은 화이트초콜릿',
        filling: '속', hardFilling: '굳은 속',
        meltedMarshmallow: '녹은 마시멜로', dough: '피',
        finalCookie: '두쫀쿠', packagedCookie: '포장된 두쫀쿠'
    };
    return map[id] || id;
  }

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

  const isRectIntersect = (r1, r2) => {
    const r2x = r2.px !== undefined ? r2.px : r2.x;
    const r2y = r2.py !== undefined ? r2.py : r2.y;
    const r2w = r2.pw !== undefined ? r2.pw : r2.w;
    const r2h = r2.ph !== undefined ? r2.ph : r2.h;
    return !(r2x > r1.x + r1.w || r2x + r2w < r1.x || r2y > r1.y + r1.h || r2y + r2h < r1.y);
  };
  
  const getFacingInfo = (player) => {
      let targetX = player.x;
      let targetY = player.y;

      if (player.direction === 'up') targetY -= GRID_SIZE;
      else if (player.direction === 'down') targetY += GRID_SIZE;
      else if (player.direction === 'left') targetX -= GRID_SIZE;
      else if (player.direction === 'right') targetX += GRID_SIZE;

      const checkRect = { x: targetX + 10, y: targetY + 10, w: 20, h: 20 };
      const zone = ZONES.find(z => isRectIntersect(checkRect, z));

      return { zone, rect: checkRect, x: targetX, y: targetY };
  };

  const centerItemInZone = (item, zone) => {
      item.x = zone.px + (zone.pw - item.w) / 2;
      item.y = zone.py + (zone.ph - item.h) / 2;
  };
  const centerItemOnGrid = (item, gridX, gridY) => {
      item.x = gridX + (GRID_SIZE - item.w) / 2;
      item.y = gridY + (GRID_SIZE - item.h) / 2;
  };

  // ★ [핵심 수정: 소켓 연결]
  useEffect(() => {
    if (!isMultiplayer || !socketProp) return;

    // ★ App에서 받은 소켓을 그대로 씁니다. (새로 연결 X, joinRoom X)
    socketRef.current = socketProp;
    const socket = socketRef.current;

    // 1. 게임 화면 로딩되자마자 "현재 방 상황 알려줘!" 요청
    socket.emit('syncGame'); 

    // 2. 누가 움직였을 때 처리 (★ 여기가 문제였음!)
    const handlePlayerMoved = (data) => {
      const { id, x, y, direction } = data;
      
      // 내 목록에 없는 사람이면? -> 새로 추가! (기존엔 무시했음)
      if (!otherPlayersRef.current[id]) {
        otherPlayersRef.current[id] = data; // 전체 데이터 저장 (nickname, color 포함됨)
      } else {
        // 이미 있으면? -> 위치만 업데이트
        otherPlayersRef.current[id].x = x;
        otherPlayersRef.current[id].y = y;
        otherPlayersRef.current[id].direction = direction;
      }
    };

    const handleNewPlayer = ({ id, player }) => {
      // 이미 있으면 덮어쓰기
      otherPlayersRef.current[id] = player;
    };

    const handlePlayerDisconnected = (id) => {
      delete otherPlayersRef.current[id];
    };
    
    // 방 업데이트(입장 시 기존 플레이어 목록 등)
    const handleRoomUpdate = (roomPlayers) => {
        otherPlayersRef.current = roomPlayers;
    };

    const handleUpdateFireState = (data) => {
       // data: { isOn, isPressing, turnOffTime ... }
       fireRef.current = { ...fireRef.current, ...data };
    };

    socket.on("playerMoved", handlePlayerMoved);
    socket.on("newPlayer", handleNewPlayer);
    socket.on("playerDisconnected", handlePlayerDisconnected);
    socket.on("roomUpdate", handleRoomUpdate);
    socket.on("updateFireState", handleUpdateFireState);

    // ★ [NEW] 다른 사람이 아이템을 건드리면 내 화면에도 반영
    const handleUpdateItemState = (itemData) => {
        // 1. 이미 있는 아이템인지 찾기
        let item = cookedItemsRef.current.find(i => i.uid === itemData.uid);
        
        // 2. 없으면? (새로 꺼낸 재료라면) -> 새로 만듦
        if (!item) {
            item = { ...itemData }; // 받은 데이터 그대로 생성
            cookedItemsRef.current.push(item);
        } else {
        // 3. 있으면? -> 상태 덮어쓰기 (위치, 상태, 누가 들고있는지 등)
            Object.assign(item, itemData);

            if (itemData.status === 'held' && itemData.holderId !== socket.id) {
            // 혹시 내가 들고 있었다면 놓게 만듦 (동시 집기 방지)
                if (playerRef.current.holding === item.uid) {
                    playerRef.current.holding = null;
                }
            }
        }
    };

    // ★ [NEW] 아이템 삭제 신호 처리
  const handleRemoveItem = (uid) => {
    // 해당 uid를 가진 아이템을 목록에서 제거
    const idx = cookedItemsRef.current.findIndex(i => i.uid === uid);
    if (idx > -1) {
      cookedItemsRef.current.splice(idx, 1);
    }
  };

    socket.on("roomUpdate", handleRoomUpdate);
    socket.on("updateItemState", handleUpdateItemState);
    socket.on("removeItem", handleRemoveItem); // 리스너 등록

    // ★ 정리: 리스너만 끕니다. (소켓 연결은 끊지 않음!)
    return () => {
      socket.off("playerMoved", handlePlayerMoved);
      socket.off("newPlayer", handleNewPlayer);
      socket.off("playerDisconnected", handlePlayerDisconnected);
      socket.off("roomUpdate", handleRoomUpdate);
      socket.off("updateItemState", handleUpdateItemState);
      socket.off("removeItem", handleRemoveItem);
      socket.off("updateFireState", handleUpdateFireState);
    };
  }, [isMultiplayer, socketProp]);

  // --- [게임 루프 및 로직] ---
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = MAP_WIDTH;
    canvas.height = MAP_HEIGHT;

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

    const handleKeyDown = (e) => { 
      if(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " ", "Space"].includes(e.key)) e.preventDefault();
      keysRef.current[e.key] = true; 
    };
    const handleKeyUp = (e) => { keysRef.current[e.key] = false; };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // 헬퍼: 아이템 생성
    const spawnItem = (id, zone) => {
        const newItem = {
            id: id,
            uid: `${id}_${Date.now()}_${Math.random()}`,
            x: 0, y: 0, w: 30, h: 30,
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
      const { zone: facingZone } = getFacingInfo(player);
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
             const currentZone = ZONES.find(z => isRectIntersect({x:item.x, y:item.y, w:item.w, h:item.h}, z));
             if(currentZone) centerItemInZone(item, currentZone);
        }
      });

      // Cooking
      if (fire.isOn) {
          const fireZones = ZONES.filter(z => z.func === 'fire');
          fireZones.forEach(zone => checkRecipe(zone, cookedItems, 'meltedMarshmallow', ['butter', 'marshmallow']));
      }
      const mixZone = ZONES.find(z => z.func === 'mix');
      if (mixZone) {
          checkRecipe(mixZone, cookedItems, 'filling', ['meltedWhiteChoco', 'pistachioSpread', 'kadaif']);
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
            const { zone: facingZone, x: facingX, y: facingY } = getFacingInfo(player);

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

                    if (facingZone.func === 'peel' && droppedItem.id === 'pistachio') setProcessing('peeledPistachio', 2000);
                    else if (facingZone.func === 'blend' && droppedItem.id === 'peeledPistachio') setProcessing('pistachioSpread', 2000);
                    else if (facingZone.func === 'microwave' && droppedItem.id === 'whiteChoco') setProcessing('meltedWhiteChoco', 2000);
                    else if (facingZone.func === 'fridge' && droppedItem.id === 'filling') setProcessing('hardFilling', 5000);
                    
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
        const { zone: facingZone, rect: facingRect } = getFacingInfo(player);
        const target = cookedItems
            .filter(i => i.status === 'ground' || i.status === 'cooking')
            .find(i => isRectIntersect(facingRect, i));

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
                cookedItems.push(newItem);
                player.holding = newUid;

                // ★ [추가] "새 아이템 만들어서 내가 들었어!" 알리기
                broadcastItem(newItem);
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
        updateMovement();
        updateGameLogic();
      }

      // ★ [NEW] 멀티플레이: 다른 사람이 들고 있는 아이템 위치 동기화
    if (isMultiplayer) {
       cookedItemsRef.current.forEach(item => {
          // 이 아이템을 누군가(holderId) 들고 있다면?
          if (item.status === 'held' && item.holderId && item.holderId !== socketRef.current?.id) {
             const holder = otherPlayersRef.current[item.holderId];
             if (holder) {
                // 그 사람의 위치로 아이템 강제 이동 (머리 위나 손 위치)
                if (holder.direction === 'up') { item.x = holder.x + 5; item.y = holder.y - 10; }
                else if (holder.direction === 'down') { item.x = holder.x + 5; item.y = holder.y + 10; }
                else if (holder.direction === 'left') { item.x = holder.x - 10; item.y = holder.y + 5; }
                else if (holder.direction === 'right') { item.x = holder.x + 20; item.y = holder.y + 5; }
             }
          }
       });
    }
      draw();
      animationFrameId = requestAnimationFrame(gameLoop);
    };

    // 이동 및 서버 전송
    // GameCanvas.jsx 내부의 updateMovement 함수 전체 교체

    const updateMovement = () => {
      const player = playerRef.current;
      const keys = keysRef.current;
      const cookedItems = cookedItemsRef.current;
      const now = Date.now();

      // 1. 움직이기 전 상태 기억 (비교용)
      const prevX = player.x;
      const prevY = player.y;
      const prevDir = player.direction;

      // 2. 방향키 입력 감지 및 방향 즉시 업데이트
      // (이동 딜레이와 상관없이 방향은 바로바로 바뀌어야 답답하지 않음)
      let intendedDirection = null;
      if (keys['w'] || keys['ArrowUp']) intendedDirection = 'up';
      else if (keys['s'] || keys['ArrowDown']) intendedDirection = 'down';
      else if (keys['a'] || keys['ArrowLeft']) intendedDirection = 'left';
      else if (keys['d'] || keys['ArrowRight']) intendedDirection = 'right';

      if (intendedDirection) {
          player.direction = intendedDirection;
      }

      // 3. 실제 이동 처리 (MOVE_DELAY 체크)
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
              if (nextX < 0 || nextX + player.w > MAP_WIDTH || nextY < 0 || nextY + player.h > MAP_HEIGHT) collided = true;
              if (!collided) {
                  for (const zone of ZONES) {
                      if (isRectIntersect(checkRect, zone)) { collided = true; break; }
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

      // 4. ★ 핵심 수정: 위치가 바뀌었거나 OR 방향이 바뀌었으면 전송
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
              if (player.direction === 'up') { target.x = player.x + 5; target.y = player.y - 10; }
              else if (player.direction === 'down') { target.x = player.x + 5; target.y = player.y + 10; }
              else if (player.direction === 'left') { target.x = player.x - 10; target.y = player.y + 5; }
              else if (player.direction === 'right') { target.x = player.x + 20; target.y = player.y + 5; }
          }
      }
    };

    const draw = () => {
      if (!canvasRef.current) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = '#EEE';
      for(let i=0; i<MAP_WIDTH/GRID_SIZE; i++) {
        for(let j=0; j<MAP_HEIGHT/GRID_SIZE; j++) ctx.strokeRect(i*GRID_SIZE, j*GRID_SIZE, GRID_SIZE, GRID_SIZE);
      }

      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ZONES.forEach(zone => {
        ctx.fillStyle = zone.type === 'exit' ? '#666' : (zone.type === 'wall' ? '#FFDAB9' : '#B0C4DE');
        if (zone.func === 'fire' && fireRef.current.isOn) ctx.fillStyle = '#FF4500';
        if (zone.func === 'package') ctx.fillStyle = '#FF69B4'; // 포장 구역 색

        ctx.fillRect(zone.px, zone.py, zone.pw, zone.ph);
        ctx.strokeStyle = '#fff'; ctx.strokeRect(zone.px, zone.py, zone.pw, zone.ph);
        
        ctx.fillStyle = '#000'; ctx.font = 'bold 12px Arial';
        ctx.fillText(zone.label, zone.px + zone.pw/2, zone.py + zone.ph/2);

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
          
          ctx.fillStyle = p.color || '#888'; 
          ctx.fillRect(p.x, p.y, PLAYER_SIZE, PLAYER_SIZE);
          
          // 눈
          ctx.fillStyle = 'white';
          const off = 8, sz = 6;
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
            ctx.font = '10px Arial';
            ctx.fillText(p.nickname, cx, p.y - 10);
          }
      });

      // 나 그리기
      const player = playerRef.current;
      ctx.fillStyle = player.color; ctx.fillRect(player.x, player.y, player.w, player.h);
      ctx.fillStyle = 'white';
      const off = 8, sz = 6;
      const cx = player.x + player.w/2, cy = player.y + player.h/2;
      let lx, ly, rx, ry;
      if (player.direction === 'up') { lx=cx-off; ly=cy-off; rx=cx+off; ry=cy-off; }
      else if (player.direction === 'down') { lx=cx-off; ly=cy+off; rx=cx+off; ry=cy+off; }
      else if (player.direction === 'left') { lx=cx-off; ly=cy-off; rx=cx-off; ry=cy+off; }
      else { lx=cx+off; ly=cy-off; rx=cx+off; ry=cy+off; }
      ctx.fillRect(lx, ly, sz, sz); ctx.fillRect(rx, ry, sz, sz);

      if (selectedChar && selectedChar.name) {
        ctx.fillStyle = 'black'; 
        ctx.fillText(selectedChar.name, player.x + player.w/2, player.y + player.h + 10);
      }

      const drawItem = (item) => {
          ctx.fillStyle = item.color;
          ctx.beginPath(); ctx.arc(item.x + item.w/2, item.y + item.h/2, item.w/2, 0, Math.PI*2); ctx.fill();
          if (item.status === 'processing') {
              ctx.fillStyle = 'red'; ctx.font = '10px Arial';
              const remain = Math.ceil((item.finishTime - Date.now())/1000);
              ctx.fillText(`${remain}s`, item.x + item.w/2, item.y - 5);
          }
      };

      Object.values(itemsRef.current).forEach(drawItem); 
      cookedItemsRef.current.forEach(drawItem); 
    };

    gameLoop();
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(animationFrameId);
    };
  }, [selectedChar, isPlaying, onBurgerDelivered, socketProp, isMultiplayer]);

  return (
    <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', justifyContent: 'center' }}>
      <canvas ref={canvasRef} style={{ border: '2px solid #333', backgroundColor: '#FAFAFA' }} />
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