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
  getBurnerState
) => {
  return () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d', { alpha: false });
    
    // 배경을 체크무늬 타일로 채우기
    for (let row = 0; row < MAP_HEIGHT / GRID_SIZE; row++) {
      for (let col = 0; col < MAP_WIDTH / GRID_SIZE; col++) {
        const isEven = (row + col) % 2 === 0;
        ctx.fillStyle = isEven ? '#A8C5B0' : '#F5E6D3';
        ctx.fillRect(col * GRID_SIZE, row * GRID_SIZE, GRID_SIZE, GRID_SIZE);
      }
    }

    // 그리드선
    ctx.strokeStyle = '#D4C5B0';
    for(let i=0; i<MAP_WIDTH/GRID_SIZE; i++) {
      for(let j=0; j<MAP_HEIGHT/GRID_SIZE; j++) {
        ctx.strokeRect(i*GRID_SIZE, j*GRID_SIZE, GRID_SIZE, GRID_SIZE);
      }
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Zones 렌더링
    ZONES.forEach(zone => {
      // 배경색
      ctx.fillStyle = zone.type === 'exit' ? '#666' : (zone.type === 'wall' ? '#FFDAB9' : '#E8B878');
      ctx.fillRect(zone.px, zone.py, zone.pw, zone.ph);
      
      // 재료 이미지
      if (zone.ingredient) {
        const ingredientImg = imagesRef.current[zone.ingredient];
        if (ingredientImg && ingredientImg.complete && ingredientImg.naturalHeight !== 0) {
          let scale = 0.95;
          if (zone.ingredient === 'milkPowder') scale = 1.4;
          else if (zone.ingredient === 'kadaif') scale = 1.3;
          else if (zone.ingredient === 'pistachio') scale = 1.2;
          
          const imgSize = zone.pw * scale;
          const imgX = zone.px + (zone.pw - imgSize) / 2;
          const imgY = zone.py + (zone.ph - imgSize) / 2;
          ctx.drawImage(ingredientImg, imgX, imgY, imgSize, imgSize);
        }
      }
      
      // 도구 이미지
      if (zone.func && TOOL_IMAGES[zone.func]) {
        let toolImgSrc = TOOL_IMAGES[zone.func];
        if (zone.func === 'blend') {
          if (blenderRef.current.state === 'processing') {
            toolImgSrc = '/assets/tools/blender_closed_pistachio.png';
          } else if (blenderRef.current.state === 'ready') {
            toolImgSrc = '/assets/tools/blender_pistachio_spread.png';
          }
        }
        
        const toolImg = new Image();
        toolImg.src = toolImgSrc;
        if (toolImg.complete && toolImg.naturalHeight !== 0) {
          ctx.save();
          ctx.beginPath();
          ctx.rect(zone.px, zone.py, zone.pw, zone.ph);
          ctx.clip();
          
          const imgRatio = toolImg.width / toolImg.height;
          const zoneRatio = zone.pw / zone.ph;
          let imgWidth, imgHeight, imgX, imgY;
          
          if (imgRatio > zoneRatio) {
            imgHeight = zone.ph;
            imgWidth = imgHeight * imgRatio;
          } else {
            imgWidth = zone.pw;
            imgHeight = imgWidth / imgRatio;
          }
          
          imgX = zone.px + (zone.pw - imgWidth) / 2;
          imgY = zone.py + (zone.ph - imgHeight) / 2;
          
          ctx.drawImage(toolImg, imgX, imgY, imgWidth, imgHeight);
          ctx.restore();
          
          // 불 처리
          if (zone.func === 'fire') {
            const burner = getBurnerState(zone);
            let panImgSrc = '/assets/tools/burner.png';
            
            if (burner.state === 'marshmallow_processing' || burner.state === 'marshmallow_ready' || burner.state === 'mixing') {
              panImgSrc = '/assets/tools/burner_marshmallow.png';
            } else if (burner.state === 'final_processing') {
              panImgSrc = '/assets/tools/burner_mid.png';
            } else if (burner.state === 'final_ready') {
              panImgSrc = '/assets/tools/burner_final.png';
            }
            
            const panImg = new Image();
            panImg.src = panImgSrc;
            if (panImg.complete && panImg.naturalHeight !== 0) {
              let panScale = 1.6;
              if (burner.state !== 'empty') panScale = 2.0;
              
              const panRatio = panImg.width / panImg.height;
              let panWidth, panHeight, panX, panY;
              
              if (panRatio > zoneRatio) {
                panHeight = zone.ph * panScale;
                panWidth = panHeight * panRatio;
              } else {
                panWidth = zone.pw * panScale;
                panHeight = panWidth / panRatio;
              }
              
              panX = zone.px + zone.pw / 2 - panWidth / 2 + 10;
              panY = zone.py + zone.ph / 2 - panHeight / 2;
              
              ctx.drawImage(panImg, panX, panY, panWidth, panHeight);
            }
            
            if (fireRef.current.isOn) {
              ctx.globalAlpha = 1.0;
            }
          }
        }
      }
      
      // 테두리
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 2;
      ctx.strokeRect(zone.px, zone.py, zone.pw, zone.ph);
      
      // Processing 타이머
      if (zone.func === 'microwave' || zone.func === 'blend') {
        const processingItem = cookedItemsRef.current.find(item => {
          if (item.status !== 'processing') return false;
          const r1 = { x: item.x, y: item.y, w: item.w, h: item.h };
          const r2 = zone;
          return !(r2.px > r1.x + r1.w || r2.px + r2.pw < r1.x || r2.py > r1.y + r1.h || r2.py + r2.ph < r1.y);
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

      // 불 게이지
      if (zone.func === 'fire' && fireRef.current.isFacing && !fireRef.current.isOn) {
        const progress = Math.min((Date.now() - fireRef.current.facingStartTime) / 2000, 1);
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(zone.px + 5, zone.py + zone.ph - 8, (zone.pw - 10) * progress, 5);
        ctx.strokeStyle = 'black';
        ctx.strokeRect(zone.px + 5, zone.py + zone.ph - 8, zone.pw - 10, 5);
      }
    });

    // 다른 플레이어
    Object.keys(otherPlayersRef.current).forEach(id => {
      const p = otherPlayersRef.current[id];
      if (!p) return;
      
      ctx.fillStyle = p.color || '#888';
      ctx.fillRect(p.x, p.y, PLAYER_SIZE, PLAYER_SIZE);
      
      // 눈
      ctx.fillStyle = 'white';
      const off = 12, sz = 8;
      const cx = p.x + PLAYER_SIZE/2, cy = p.y + PLAYER_SIZE/2;
      let lx, ly, rx, ry;

      if (p.direction === 'up') { lx=cx-off; ly=cy-off; rx=cx+off; ry=cy-off; }
      else if (p.direction === 'down') { lx=cx-off; ly=cy+off; rx=cx+off; ry=cy+off; }
      else if (p.direction === 'left') { lx=cx-off; ly=cy; rx=cx+off/2; ry=cy; }
      else { lx=cx-off/2; ly=cy; rx=cx+off; ry=cy; }

      ctx.beginPath(); ctx.arc(lx, ly, sz, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(rx, ry, sz, 0, Math.PI*2); ctx.fill();

      ctx.fillStyle = 'black';
      const pupilSize = sz*0.5;
      if (p.direction === 'up') { ly -= sz*0.3; ry -= sz*0.3; }
      else if (p.direction === 'down') { ly += sz*0.3; ry += sz*0.3; }
      else if (p.direction === 'left') { lx -= sz*0.3; rx -= sz*0.3; }
      else { lx += sz*0.3; rx += sz*0.3; }

      ctx.beginPath(); ctx.arc(lx, ly, pupilSize, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(rx, ry, pupilSize, 0, Math.PI*2); ctx.fill();

      // 닉네임
      ctx.fillStyle = 'white';
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 3;
      ctx.font = 'bold 16px Arial';
      ctx.strokeText(p.nickname || 'Player', p.x + PLAYER_SIZE/2, p.y - 10);
      ctx.fillText(p.nickname || 'Player', p.x + PLAYER_SIZE/2, p.y - 10);
    });

    // 플레이어
    const player = playerRef.current;
    const charDirection = player.direction || 'down';
    const charImg = imagesRef.current[`playerChar_${charDirection}`];
    
    if (charImg && charImg.complete && charImg.naturalHeight !== 0) {
      ctx.drawImage(charImg, player.x, player.y, player.w, player.h);
    } else {
      ctx.fillStyle = player.color;
      ctx.fillRect(player.x, player.y, player.w, player.h);
    }

    // 아이템 그리기
    const drawItem = (item) => {
      if (item.status === 'held') return;
      
      let sizeMultiplier = 1.0;
      if (item.status === 'cooking' || item.status === 'processing') {
        sizeMultiplier = 0.7;
      }
      
      const ingredientImg = imagesRef.current[item.id];
      if (ingredientImg && ingredientImg.complete && ingredientImg.naturalHeight !== 0) {
        const imgSize = item.w * sizeMultiplier;
        const imgX = item.x + (item.w - imgSize) / 2;
        const imgY = item.y + (item.h - imgSize) / 2;
        ctx.drawImage(ingredientImg, imgX, imgY, imgSize, imgSize);
      } else {
        ctx.fillStyle = item.color;
        ctx.beginPath();
        ctx.arc(item.x + item.w/2, item.y + item.h/2, (item.w/2) * sizeMultiplier, 0, Math.PI*2);
        ctx.fill();
      }
      
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
};
