// src/GameCanvas.jsx (최종 수정)
import { useEffect, useRef } from 'react';

const GameCanvas = ({ selectedChar, isPlaying, onBurgerDelivered, score, isMultiplayer, roomId, socketProp }) => {
  const canvasRef = useRef(null);
  
  // 소켓 레퍼런스 (App에서 받은 걸 여기에 저장)
  const socketRef = useRef(null);
  
  // 다른 플레이어들 정보
  const otherPlayersRef = useRef({});

  // 이미지 캐시
  const imagesRef = useRef({});

  // --- 상수 설정 ---
  const GRID_SIZE = 40; 
  const MAP_WIDTH = 800;  
  const MAP_HEIGHT = 600; 
  const PLAYER_SIZE = 60; // 캐릭터 크기 증가 (40 → 60)
  const ITEM_SIZE = 90; // 재료 이미지 크기 증가 (70 → 90)
  const MOVE_DELAY = 70; // 이동 딜레이 (ms)

  // --- [재료 이미지 경로 매핑] ---
  const INGREDIENT_IMAGES = {
    pistachio: '/assets/ingredients/pistachio_v1.png',
    peeledPistachio: '/assets/ingredients/pistachio_v2.png',
    pistachioSpread: '/assets/ingredients/pistachio_spread.png',
    kadaif: '/assets/ingredients/kadaif.png',
    kadaif_v1: '/assets/ingredients/kadaif_v1.png', // 집은 카다이프
    toastedKadaif: '/assets/ingredients/kadaif_toasted.png', // 볶은 카다이프
    whiteChoco: '/assets/ingredients/white_chocolate.png',
    meltedWhiteChoco: '/assets/ingredients/white_chocolate_melted.png', // 녹은 화이트초콜릿
    whiteChoco_pistachio: '/assets/ingredients/whitechocolate_pistachiospread.png', // 화이트초콜릿 + 피스타치오
    butter: '/assets/ingredients/butter.png',
    butter_v2: '/assets/ingredients/butter_v2.png', // 집은 버터
    marshmallow: '/assets/ingredients/marshmallow.png',
    meltedMarshmallow: '/assets/tools/marshmallow_melted.png', // 녹은 마시멜로우
    milkPowder: '/assets/ingredients/milk_powder.png',
    milkPowder_v2: '/assets/ingredients/milk_powder_v2.png', // 집은 탈지분유
    cocoa: '/assets/ingredients/cocoa_powder.png',
    cocoa_v2: '/assets/ingredients/cocoa_powder_v2.png', // 집은 코코아파우더
    filling: '/assets/ingredients/pistachio_spread.png', // 임시로 스프레드 사용
    hardFilling: '/assets/ingredients/pistachio_spread.png', // 임시로 스프레드 사용
    dough: '/assets/ingredients/dujjonku.png',
    panWithDough: '/assets/tools/burner_final.png', // 도우가 든 후라이팬 (완성 상태)
    finalCookie: '/assets/ingredients/dujjonku_fianl.png',
    packagedCookie: '/assets/ingredients/dujjonku_fianl.png',
  };

  // --- [도구 이미지 경로 매핑] ---
  const TOOL_IMAGES = {
    fridge: '/assets/tools/freezer.png',      // 냉장고
    microwave: '/assets/tools/microwave.png',  // 전자레인지
    fire: '/assets/tools/burner.png',          // 불
    blend: '/assets/tools/blender_closed.png', // 믹서기
    peel: '/assets/tools/tray.png',            // 까기
    package: '/assets/tools/wrapper.png',      // 포장대
    mix: '/assets/tools/bowl.png',            // 믹싱볼
  };

  // --- [범례 데이터] ---
  const INGREDIENT_LEGEND = [
    { name: '피스타치오', color: '#93C572' },
    { name: '깐 피스타치오', color: '#90EE90' },
    { name: '피스타치오 스프레드', color: '#228B22' },
    { name: '카다이프', color: '#DAA520' },
    { name: '볶은 카다이프', color: '#CD853F' },
    { name: '화이트초콜릿', color: '#FAF0E6' },
    { name: '녹은 화이트초콜릿', color: '#FFFFF0' },
    { name: '초코+피스타치오 믹스', color: '#9ACD32' },
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
    { x: 3, y: 0, w: 2, h: 2, label: '', type: 'station', func: 'peel' },
    { x: 5, y: 0, w: 2, h: 2, label: '', type: 'station', func: 'counter' }, // 조리대 - 트레이와 믹서기 사이
    { x: 7, y: 0, w: 2, h: 2, label: '', type: 'station', func: 'blend' },
    { x: 9, y: 0, w: 2, h: 2, label: '', type: 'exit' },
    { x: 11, y: 0, w: 2, h: 2, label: '', type: 'station', func: 'spread' },
    { x: 13, y: 0, w: 2, h: 2, label: '', type: 'station', func: 'package' },

    // [왼쪽 재료]
    { x: 0, y: 3, w: 2, h: 2, label: '', type: 'station', ingredient: 'pistachio' },
    { x: 0, y: 5, w: 2, h: 2, label: '', type: 'station', ingredient: 'kadaif' },
    { x: 0, y: 7, w: 2, h: 2, label: '', type: 'station', ingredient: 'whiteChoco' },

    // [오른쪽 재료]
    { x: 18, y: 3, w: 2, h: 2, label: '', type: 'station', ingredient: 'butter' },
    { x: 18, y: 5, w: 2, h: 2, label: '', type: 'station', ingredient: 'marshmallow' },
    { x: 18, y: 7, w: 2, h: 2, label: '', type: 'station', ingredient: 'milkPowder' },
    { x: 18, y: 9, w: 2, h: 2, label: '', type: 'station', ingredient: 'cocoa' },

    // [하단]
    { x: 3, y: 13, w: 2, h: 2, label: '', type: 'station', func: 'fridge' },
    { x: 5, y: 13, w: 2, h: 2, label: '', type: 'station', func: 'microwave' }, 
    { x: 7, y: 13, w: 2, h: 2, label: '', type: 'station', func: 'mix' },
    { x: 11, y: 13, w: 2, h: 2, label: '', type: 'station', func: 'fire' },
    { x: 13, y: 13, w: 2, h: 2, label: '', type: 'station', func: 'fire' },
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
        pistachio: '#93C572', kadaif: '#DAA520', kadaif_v1: '#D4AF37', toastedKadaif: '#CD853F', whiteChoco: '#FAF0E6',
        butter: '#F0E68C', butter_v2: '#FFE87C', marshmallow: '#FFFAFA', 
        milkPowder: '#FFF8DC', milkPowder_v2: '#FFFACD', 
        cocoa: '#8B4513', cocoa_v2: '#A0522D',
        peeledPistachio: '#90EE90', pistachioSpread: '#228B22', meltedWhiteChoco: '#FFFFF0',
        filling: '#ADFF2F', hardFilling: '#32CD32',
        meltedMarshmallow: '#EEE', dough: '#D2691E', panWithDough: '#C0C0C0',
        finalCookie: '#A0522D', packagedCookie: '#FF1493', whiteChoco_pistachio: '#9ACD32',
    };
    return map[name] || '#FFF';
  }

  function getNameForIngredient(id) {
    const map = {
        pistachio: '피스타치오', kadaif: '카다이프', kadaif_v1: '집은 카다이프', toastedKadaif: '볶은 카다이프', whiteChoco: '화이트초콜릿',
        butter: '버터', butter_v2: '집은 버터', marshmallow: '마시멜로', 
        milkPowder: '탈지분유', milkPowder_v2: '집은 탈지분유',
        cocoa: '코코아파우더', cocoa_v2: '집은 코코아파우더',
        peeledPistachio: '깐 피스타치오', pistachioSpread: '피스타치오 스프레드', meltedWhiteChoco: '녹은 화이트초콜릿',
        filling: '속', hardFilling: '굳은 속',
        meltedMarshmallow: '녹은 마시멜로', dough: '피', panWithDough: '피든 후라이팬',
        finalCookie: '두쫀쿠', packagedCookie: '포장된 두쫀쿠', whiteChoco_pistachio: '초코+피스타치오',
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

  const blenderRef = useRef({
    state: 'empty', // 'empty', 'processing', 'ready'
    finishTime: 0
  });

  // 각 화구마다 독립적인 상태 관리 (위치를 키로 사용)
  const burnerStatesRef = useRef({});
  
  // 화구 상태 가져오기 헬퍼 함수
  const getBurnerState = (zone) => {
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

  const isRectIntersect = (r1, r2) => {
    const r2x = r2.px !== undefined ? r2.px : r2.x;
    const r2y = r2.py !== undefined ? r2.py : r2.y;
    const r2w = r2.pw !== undefined ? r2.pw : r2.w;
    const r2h = r2.ph !== undefined ? r2.ph : r2.h;
    return !(r2x > r1.x + r1.w || r2x + r2w < r1.x || r2y > r1.y + r1.h || r2y + r2h < r1.y);
  };
  
  const getFacingInfo = (player, useWideRange = false) => {
      let targetX = player.x;
      let targetY = player.y;

      if (player.direction === 'up') targetY -= GRID_SIZE;
      else if (player.direction === 'down') targetY += GRID_SIZE;
      else if (player.direction === 'left') targetX -= GRID_SIZE;
      else if (player.direction === 'right') targetX += GRID_SIZE;

      // 기본은 작은 범위, 필요시 넓은 범위 사용
      const checkRect = useWideRange 
        ? { x: targetX, y: targetY, w: GRID_SIZE, h: GRID_SIZE }
        : { x: targetX + 10, y: targetY + 10, w: 20, h: 20 };
      
      // 여러 zone이 감지되면 중앙에서 가장 가까운 것 선택
      const matchingZones = ZONES.filter(z => isRectIntersect(checkRect, z));
      let zone = null;
      
      if (matchingZones.length > 0) {
        // 바라보는 칸의 중앙 좌표
        const centerX = targetX + GRID_SIZE / 2;
        const centerY = targetY + GRID_SIZE / 2;
        
        // 가장 가까운 zone 찾기
        zone = matchingZones.reduce((closest, current) => {
          const currentCenterX = current.px + current.pw / 2;
          const currentCenterY = current.py + current.ph / 2;
          const currentDist = Math.hypot(centerX - currentCenterX, centerY - currentCenterY);
          
          const closestCenterX = closest.px + closest.pw / 2;
          const closestCenterY = closest.py + closest.ph / 2;
          const closestDist = Math.hypot(centerX - closestCenterX, centerY - closestCenterY);
          
          return currentDist < closestDist ? current : closest;
        });
      }

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
  
  // processing이 끝난 아이템을 zone 앞쪽으로 배치 (캐릭터가 집기 쉬운 위치)
  const placeItemInFrontOfZone = (item, zone) => {
      // zone의 중앙 좌표
      const zoneCenterX = zone.px + zone.pw / 2;
      const zoneCenterY = zone.py + zone.ph / 2;
      
      // 캔버스 중앙 좌표
      const canvasCenterX = CANVAS_WIDTH / 2;
      const canvasCenterY = CANVAS_HEIGHT / 2;
      
      // zone 앞 1칸에 배치 (캐릭터와 zone 사이에 배치되도록)
      if (zoneCenterY < canvasCenterY / 2) {
          // 상단 zone -> 아이템을 1칸 아래에 배치
          item.x = zoneCenterX - item.w / 2;
          item.y = zone.py + zone.ph + GRID_SIZE / 2; // zone과 캐릭터 중간
      } else if (zoneCenterY > canvasCenterY * 1.5) {
          // 하단 zone (전자레인지 등) -> 아이템을 1칸 위에 배치
          item.x = zoneCenterX - item.w / 2;
          item.y = zone.py - GRID_SIZE + (GRID_SIZE - item.h) / 2; // zone 바로 앞 칸 중앙
      } else if (zoneCenterX < canvasCenterX) {
          // 좌측 zone -> 아이템을 1칸 오른쪽에 배치
          item.x = zone.px + zone.pw + GRID_SIZE / 2; // zone과 캐릭터 중간
          item.y = zoneCenterY - item.h / 2;
      } else {
          // 우측 zone -> 아이템을 1칸 왼쪽에 배치
          item.x = zone.px - GRID_SIZE + (GRID_SIZE - item.w) / 2; // zone 바로 앞 칸 중앙
          item.y = zoneCenterY - item.h / 2;
      }
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

  // --- [이미지 로드] ---
  useEffect(() => {
    // 재료 이미지 로드
    Object.entries(INGREDIENT_IMAGES).forEach(([key, src]) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        // 이미지 로드 완료, 자동으로 다음 프레임에 렌더링됨
      };
      img.onerror = () => {
        console.warn(`이미지 로드 실패: ${src}`);
      };
      imagesRef.current[key] = img;
    });

    // 도구 이미지 로드
    Object.entries(TOOL_IMAGES).forEach(([key, src]) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        // 이미지 로드 완료
      };
      img.onerror = () => {
        console.warn(`도구 이미지 로드 실패: ${src}`);
      };
      imagesRef.current[`tool_${key}`] = img;
    });

    // 캐릭터 이미지 로드 (방향별로 4개)
    if (selectedChar) {
      const directions = ['front', 'back', 'left', 'right'];
      directions.forEach(dir => {
        const imgKey = `img${dir.charAt(0).toUpperCase() + dir.slice(1)}`;
        if (selectedChar[imgKey]) {
          const charImg = new Image();
          charImg.src = selectedChar[imgKey];
          charImg.onload = () => {
            // 이미지 로드 완료
          };
          charImg.onerror = () => {
            console.warn(`캐릭터 이미지 로드 실패: ${selectedChar[imgKey]}`);
          };
          imagesRef.current[`playerChar_${dir}`] = charImg;
        }
      });
    }
  }, [selectedChar]);

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
            const { zone: facingZone, x: facingX, y: facingY } = getFacingInfo(player, true);

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
        const { zone: facingZone } = getFacingInfo(player, true);
        
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
              // 캐릭터 중앙 기준으로 아이템 배치
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
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
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