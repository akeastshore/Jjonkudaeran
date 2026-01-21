import {
  GRID_SIZE,
  MAP_WIDTH,
  MAP_HEIGHT,
  PLAYER_SIZE,
  ITEM_SIZE,
  TOOL_IMAGES
} from '../constants/gameConstants';

export const createDrawFunction = (
  canvasRef,
  imagesRef,
  ZONES,
  playerRef,
  otherPlayersRef,
  itemsRef,
  cookedItemsRef,
  fireRef,
  blenderRef,
  trayStatesRef,
  getBurnerState
) => {
  return () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d', { alpha: false });

    // 1. 배경
    // 1. 배경
    const bgImg = imagesRef.current['gameBackground'];
    if (bgImg && bgImg.complete && bgImg.naturalHeight !== 0) {
      ctx.drawImage(bgImg, 0, 0, MAP_WIDTH, MAP_HEIGHT);
      // 배경 어둡게 처리
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
    } else {
      // 이미지 로드 전 임시 배경 (체커보드)
      for (let row = 0; row < MAP_HEIGHT / GRID_SIZE; row++) {
        for (let col = 0; col < MAP_WIDTH / GRID_SIZE; col++) {
          const isEven = (row + col) % 2 === 0;
          ctx.fillStyle = isEven ? '#A8C5B0' : '#F5E6D3';
          ctx.fillRect(col * GRID_SIZE, row * GRID_SIZE, GRID_SIZE, GRID_SIZE);
        }
      }
    }

    // 2. 그리드선
    ctx.strokeStyle = '#D4C5B0';
    for (let i = 0; i < MAP_WIDTH / GRID_SIZE; i++) {
      for (let j = 0; j < MAP_HEIGHT / GRID_SIZE; j++) {
        ctx.strokeRect(i * GRID_SIZE, j * GRID_SIZE, GRID_SIZE, GRID_SIZE);
      }
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 3. Zones 렌더링
    ZONES.forEach(zone => {
      // 배경색
      ctx.fillStyle = zone.type === 'exit' ? '#666' : (zone.type === 'wall' ? '#FFDAB9' : '#E8B878');
      ctx.fillRect(zone.px, zone.py, zone.pw, zone.ph);

      // (1) 재료 이미지
      if (zone.ingredient) {
        const ingredientImg = imagesRef.current[zone.ingredient];
        if (ingredientImg && ingredientImg.complete && ingredientImg.naturalHeight !== 0) {

          let scale = 0.95;

          if (zone.ingredient === 'milkPowder') scale = 1.4;
          else if (zone.ingredient === 'kadaif') scale = 1.3;
          else if (zone.ingredient.includes('pistachio')) {
            scale = 0.7;
          }

          const imgSize = zone.pw * scale;
          const imgX = zone.px + (zone.pw - imgSize) / 2;
          const imgY = zone.py + (zone.ph - imgSize) / 2;
          ctx.drawImage(ingredientImg, imgX, imgY, imgSize, imgSize);
        }
      }

      // 제출구 텍스트 추가
      if (zone.type === 'exit') {
        ctx.fillStyle = 'white';
        ctx.font = 'bold 20px Arial';
        ctx.fillText('제출구', zone.px + zone.pw / 2, zone.py + zone.ph / 2);
      }

      // (2) 도구 이미지 (여기서 화덕/Burner가 1차로 그려짐)
      if (zone.func && TOOL_IMAGES[zone.func]) {
        let toolImgSrc = TOOL_IMAGES[zone.func];

        if (zone.func === 'blend') {
          if (blenderRef.current.state === 'processing') {
            toolImgSrc = '/assets/tools/blender_closed_pistachio.png';
          } else if (blenderRef.current.state === 'ready') {
            toolImgSrc = '/assets/tools/blender_pistachio_spread.png';
          }
        }

        if (zone.func === 'tray') {
          const key = `${zone.x}_${zone.y}`;
          const trayState = trayStatesRef.current[key];
          if (trayState) {
            if (trayState.state === 'dough') {
              toolImgSrc = '/assets/ingredients/dough_spreaded.png';
            } else if (trayState.state === 'cocoa') {
              toolImgSrc = '/assets/ingredients/cocoapowder_spreaded.png';
            }
          }
        }

        // 믹싱볼(mix)에 피스타치오 스프레드가 있으면 이미지 변경
        if (zone.func === 'mix') {
          const hasSpread = cookedItemsRef.current.some(item =>
            (item.id === 'pistachioSpread' || item.id === 'pistachioSpread_in_bowl') &&
            (item.status === 'cooking' || item.status === 'ground' || item.status === 'placed') &&
            item.x + item.w > zone.px && item.x < zone.px + zone.pw &&
            item.y + item.h > zone.py && item.y < zone.py + zone.ph
          );
          if (hasSpread) {
            toolImgSrc = '/assets/ingredients/pistachio_spread_bowl.png';
          }
        }

        const toolImg = new Image();
        toolImg.src = toolImgSrc;

        if (toolImg.complete && toolImg.naturalHeight !== 0) {
          ctx.save();
          ctx.beginPath();
          ctx.rect(zone.px, zone.py, zone.pw, zone.ph);

          if (zone.func !== 'blend') {
            ctx.clip();
          }

          let toolScale = 1.5; // 전체적으로 아이콘 크기 증가
          if (zone.func === 'blend') {
            toolScale = 2.5;
          } else if (zone.func === 'microwave') {
            toolScale = 1.2; // 전자레인지 크기 줄임
          } else if (zone.func === 'fridge') {
            toolScale = 1.2; // 냉장고 크기 줄임
          }

          // 피스타치오 스프레드 담긴 볼 크기 키우기
          if (toolImgSrc.includes('pistachio_spread_bowl')) {
            toolScale = 1.8;
          }

          const imgRatio = toolImg.width / toolImg.height;
          const zoneRatio = zone.pw / zone.ph;
          let imgWidth, imgHeight, imgX, imgY;

          if (imgRatio > zoneRatio) {
            imgHeight = zone.ph * toolScale;
            imgWidth = imgHeight * imgRatio;
          } else {
            imgWidth = zone.pw * toolScale;
            imgHeight = imgWidth / imgRatio;
          }

          imgX = zone.px + (zone.pw - imgWidth) / 2;
          imgY = zone.py + (zone.ph - imgHeight) / 2;

          ctx.drawImage(toolImg, imgX, imgY, imgWidth, imgHeight);
          ctx.restore();

          // (3) 화덕 위 프라이팬 처리 [여기가 핵심 수정!]
          if (zone.func === 'fire') {
            const burner = getBurnerState(zone);

            // ★ [수정] 기본 이미지를 '화덕'이 아니라 '프라이팬(flyingpan_top)'으로 변경!
            let panImgSrc = '/assets/tools/flyingpan_top.png';

            // 요리 상태별 이미지 변경
            if (burner.state.includes('marshmallow') || burner.state === 'mixing') {
              panImgSrc = '/assets/tools/burner_marshmallow_top.png';
            } else if (burner.state.includes('butter')) {
              panImgSrc = '/assets/tools/burner_butter_top.png';
            } else if (burner.state.includes('final')) {
              panImgSrc = burner.state === 'final_ready'
                ? '/assets/tools/burner_final_top.png'
                : '/assets/tools/burner_mid_top.png';
            } else if (burner.state === 'kadaif_processing') {
              panImgSrc = '/assets/ingredients/kadaif_flyingpan.png';
            } else if (burner.state === 'kadaif_ready') {
              panImgSrc = '/assets/ingredients/kadaif_toasted_flyingpan.png';
            }
            // 뭔가 요리 중이거나 재료가 있으면 요리 중인 팬 이미지 사용
            else if (burner.state !== 'empty' && burner.state !== 'waiting') {
              panImgSrc = '/assets/tools/burner_mid_top.png';
            }
            // (waiting 상태나 empty 상태일 때는 위의 기본값 flyingpan_top.png가 유지됨)

            const panImg = new Image();
            panImg.src = panImgSrc;

            if (panImg.complete && panImg.naturalHeight !== 0) {

              // ★ [수정] 프라이팬은 언제나 2.0배로 큼직하게 고정
              let panScale = 2.0;

              const panRatio = panImg.width / panImg.height;
              let panWidth, panHeight, panX, panY;

              if (panRatio > zoneRatio) {
                panHeight = zone.ph * panScale;
                panWidth = panHeight * panRatio;
              } else {
                panWidth = zone.pw * panScale;
                panHeight = panWidth / panRatio;
              }

              panX = zone.px + zone.pw / 2 - panWidth / 2;
              panY = zone.py + zone.ph / 2 - panHeight / 2;

              ctx.drawImage(panImg, panX, panY, panWidth, panHeight);

              // 팬 위에 있는 재료 렌더링 (Waiting 상태)
              if (burner.state === 'waiting' && burner.items && burner.items.length > 0) {
                burner.items.forEach((itemId, idx) => {
                  const itemImg = imagesRef.current[itemId];
                  if (itemImg && itemImg.complete && itemImg.naturalHeight !== 0) {
                    const itemSize = panWidth * 0.4;
                    const itemX = panX + (panWidth - itemSize) / 2 + (idx === 0 ? -10 : 10);
                    const itemY = panY + (panHeight - itemSize) / 2 - 10;
                    ctx.drawImage(itemImg, itemX, itemY, itemSize, itemSize);
                  }
                });
              }


            }
          }
        }
      }

      // 테두리
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 2;
      ctx.strokeRect(zone.px, zone.py, zone.pw, zone.ph);

      // 타이머 표시
      if (zone.func === 'blend') {
        if (blenderRef.current.state === 'processing') {
          ctx.fillStyle = 'white';
          ctx.strokeStyle = 'black';
          ctx.lineWidth = 3;
          ctx.font = 'bold 20px Arial';
          const remain = Math.ceil((blenderRef.current.finishTime - Date.now()) / 1000);
          const timerX = zone.px + zone.pw / 2;
          const timerY = zone.py + zone.ph / 2;
          ctx.strokeText(`${remain}s`, timerX, timerY);
          ctx.fillText(`${remain}s`, timerX, timerY);
        }
      }

      // 불 게이지
      if (zone.func === 'fire' && fireRef.current.isFacing && !fireRef.current.isOn) {
        const progress = Math.min((Date.now() - fireRef.current.facingStartTime) / 2000, 1);
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(zone.px + 5, zone.py + zone.ph - 8, (zone.pw - 10) * progress, 5);
        ctx.strokeStyle = 'black';
        ctx.strokeRect(zone.px + 5, zone.py + zone.ph - 8, zone.pw - 10, 5);
      }

      // 화덕 메시지 표시 (탔을 때)
      if (zone.func === 'fire') {
        const burner = getBurnerState(zone);
        const now = Date.now();

        // 메시지가 있고, 2초(2000ms)가 아직 안 지났다면 그리기
        if (burner.message && (now - burner.messageStartTime < 2000)) {

          // 1. 진행률 계산 (0.0 ~ 1.0)
          // 시간이 지날수록 0에서 1에 가까워집니다.
          const elapsed = now - burner.messageStartTime;
          const progress = elapsed / 2000;

          // 2. 위로 올라가는 거리 계산 (총 50px만큼 위로 이동)
          // 시작 위치(-20)에서 시간이 지날수록 더 위(-20 - 50)로 갑니다.
          const moveUpDistance = 50;
          const yOffset = 10 + (moveUpDistance * progress);

          // 3. 투명도 적용 (점점 투명해지게)
          // progress가 1이 되면(2초 끝), alpha는 0(완전 투명)이 됩니다.
          const alpha = 1 - progress;

          // --- 그리기 시작 ---
          ctx.save(); // 다른 그림에 영향 안 주게 설정 저장
          ctx.globalAlpha = alpha; // 투명도 적용

          ctx.fillStyle = 'red';
          ctx.font = 'bold 18px Arial';
          ctx.textAlign = 'center'; // 좌우 가운데 정렬 확실하게

          // zone.py - yOffset : 시간이 지날수록 Y값이 작아져서 위로 올라감
          ctx.fillText(burner.message, zone.px + zone.pw / 2, zone.py - yOffset);

          ctx.restore(); // 설정 복구 (중요!)
        }
      }
    });

    // 4. 다른 플레이어
    Object.keys(otherPlayersRef.current).forEach(id => {
      const p = otherPlayersRef.current[id];
      if (!p) return;

      ctx.fillStyle = p.color || '#888';
      ctx.fillRect(p.x, p.y, PLAYER_SIZE, PLAYER_SIZE);

      // 눈
      ctx.fillStyle = 'white';
      const off = 12, sz = 8;
      const cx = p.x + PLAYER_SIZE / 2, cy = p.y + PLAYER_SIZE / 2;
      let lx, ly, rx, ry;

      if (p.direction === 'up') { lx = cx - off; ly = cy - off; rx = cx + off; ry = cy - off; }
      else if (p.direction === 'down') { lx = cx - off; ly = cy + off; rx = cx + off; ry = cy + off; }
      else if (p.direction === 'left') { lx = cx - off; ly = cy; rx = cx + off / 2; ry = cy; }
      else { lx = cx - off / 2; ly = cy; rx = cx + off; ry = cy; }

      ctx.beginPath(); ctx.arc(lx, ly, sz, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(rx, ry, sz, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = 'black';
      const pupilSize = sz * 0.5;
      if (p.direction === 'up') { ly -= sz * 0.3; ry -= sz * 0.3; }
      else if (p.direction === 'down') { ly += sz * 0.3; ry += sz * 0.3; }
      else if (p.direction === 'left') { lx -= sz * 0.3; rx -= sz * 0.3; }
      else { lx += sz * 0.3; rx += sz * 0.3; }

      ctx.beginPath(); ctx.arc(lx, ly, pupilSize, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(rx, ry, pupilSize, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = 'white';
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 3;
      ctx.font = 'bold 16px Arial';
      ctx.strokeText(p.nickname || 'Player', p.x + PLAYER_SIZE / 2, p.y - 10);
      ctx.fillText(p.nickname || 'Player', p.x + PLAYER_SIZE / 2, p.y - 10);
    });

    // 5. 내 플레이어
    const player = playerRef.current;
    const playerDirection = player.direction || 'down';
    const directionMap = { 'down': 'front', 'up': 'back', 'left': 'left', 'right': 'right' };
    const charDirection = directionMap[playerDirection] || 'front';
    const charImg = imagesRef.current[`playerChar_${charDirection}`];

    const playerScale = 1.2;

    if (charImg && charImg.complete && charImg.naturalHeight !== 0) {
      const drawW = player.w;
      const drawH = player.h * playerScale;
      const drawX = player.x;
      const drawY = player.y - (drawH - player.h) / 2;

      ctx.drawImage(charImg, drawX, drawY, drawW, drawH);
    } else {
      ctx.fillStyle = player.color;
      ctx.fillRect(player.x, player.y, player.w, player.h);
    }

    // 6. 들고 있는 아이템
    if (player.holding) {
      const heldItem = cookedItemsRef.current.find(item => item.uid === player.holding);
      if (heldItem) {
        let heldScale = 1.0; // 기본 크기
        if (heldItem.id === 'pistachio') {
          heldScale = 0.5; // 피스타치오만 50% 크기로 줄임
        }

        // 배율이 적용된 실제 그리기 크기 계산
        const drawW = heldItem.w * heldScale;
        const drawH = heldItem.h * heldScale;
        let itemOffsetX = 0;
        if (playerDirection === 'left') itemOffsetX = -15;
        else if (playerDirection === 'right') itemOffsetX = 15;

        const itemX = player.x + (player.w - heldItem.w) / 2 + itemOffsetX;
        const itemY = player.y + 30;

        const ingredientImg = imagesRef.current[heldItem.id];
        if (ingredientImg && ingredientImg.complete && ingredientImg.naturalHeight !== 0) {
          ctx.drawImage(ingredientImg, itemX, itemY, heldItem.w, heldItem.h);
        } else {
          ctx.fillStyle = heldItem.color;
          ctx.beginPath();
          ctx.arc(itemX + heldItem.w / 2, itemY + heldItem.h / 2, heldItem.w / 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // 7. 바닥 아이템
    const mixZone = ZONES.find(z => z.func === 'mix');
    const fireZones = ZONES.filter(z => z.func === 'fire');

    const drawItem = (item) => {
      if (item.status === 'held') return;

      // 2. ★ [핵심 수정] 믹싱볼(Mix) 영역 안에 있는 피스타치오 스프레드는 무조건 숨김!
      // (ID가 바뀌었든 안 바뀌었든, 믹싱볼 위에 올라가 있으면 그리지 않음)
      if (mixZone) {
        // 아이템이 믹싱볼 영역과 겹치는지 확인
        const isInMixer =
          item.x + item.w > mixZone.px && item.x < mixZone.px + mixZone.pw &&
          item.y + item.h > mixZone.py && item.y < mixZone.py + mixZone.ph;

        if (isInMixer) {
          // 스프레드 종류면 그리지 않고 함수 종료 (숨김)
          if (item.id === 'pistachioSpread' || item.id === 'pistachioSpread_in_bowl') {
            return;
          }
        }
      }

      // 3. 화덕(Fire) 위에 있는 카다이프 숨김
      const onFireZone = fireZones.find(z =>
        item.x + item.w > z.px && item.x < z.px + z.pw &&
        item.y + item.h > z.py && item.y < z.py + z.ph
      );
      if (onFireZone) {
        const burner = getBurnerState(onFireZone);
        if (burner.state === 'kadaif_processing' && item.id.includes('kadaif')) return;
        if (burner.state === 'kadaif_ready' && item.id.includes('toasted')) return;
      }

      // 4. 크기 조절 (피스타치오 등)
      let sizeMultiplier = 1.0;
      if (item.status === 'cooking' || item.status === 'processing') {
        sizeMultiplier = 1.0;
      }

      if (item.id.includes('pistachio')) {
        sizeMultiplier = 0.8; // 피스타치오만 80% 크기로 줄임 (0.7 -> 0.8)
      } else if (item.id === 'peeledPistachio') {
        sizeMultiplier = 2.0;
      } else if (item.id === 'packagedCookie') {
        sizeMultiplier = 1.5; // 패키징된 쿠키(wrapped_dujjonku) 크기 확대
      } else if (item.id === 'whiteChoco_pistachio') {
        sizeMultiplier = 2.5; // 화이트 초콜릿 피스타치오 스프레드 엄청 확대
      }

      // 5. 실제 그리기
      const ingredientImg = imagesRef.current[item.id];
      if (ingredientImg && ingredientImg.complete && ingredientImg.naturalHeight !== 0) {
        const imgSize = item.w * sizeMultiplier;
        const imgX = item.x + (item.w - imgSize) / 2;
        const imgY = item.y + (item.h - imgSize) / 2;
        ctx.drawImage(ingredientImg, imgX, imgY, imgSize, imgSize);
      } else {
        ctx.fillStyle = item.color;
        ctx.beginPath();
        ctx.arc(item.x + item.w / 2, item.y + item.h / 2, (item.w / 2) * sizeMultiplier, 0, Math.PI * 2);
        ctx.fill();
      }

      // 6. 타이머 표시
      if (item.status === 'processing') {
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 3;
        ctx.font = 'bold 16px Arial';
        const remain = Math.ceil((item.finishTime - Date.now()) / 1000);
        ctx.strokeText(`${remain}s`, item.x + item.w / 2, item.y - 10);
        ctx.fillText(`${remain}s`, item.x + item.w / 2, item.y - 10);
      }
    };

    Object.values(itemsRef.current).forEach(drawItem);
    cookedItemsRef.current.forEach(drawItem);
  };
};