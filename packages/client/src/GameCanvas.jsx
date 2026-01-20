// 게임 캔버스 메인 컴포넌트 - 컴포넌트 기반 구조로 리팩토링
import { useRef, useMemo } from 'react';
import {
  GRID_SIZE,
  MAP_WIDTH,
  MAP_HEIGHT,
  PLAYER_SIZE,
  createZones,
} from './constants/gameConstants';
import { createInitialIngredients } from './utils/ingredientInitializer';
import { useImageLoader } from './hooks/useImageLoader';
import { useMultiplayerSync } from './hooks/useMultiplayerSync';
import { usePlayerControls } from './hooks/usePlayerControls';
import { useGameLoop } from './hooks/useGameLoop';
import GameContainer from './components/game/GameContainer';

const GameCanvas = ({ 
  selectedChar, 
  isPlaying, 
  onBurgerDelivered, 
  score, 
  isMultiplayer, 
  roomId, 
  socketProp 
}) => {
  const canvasRef = useRef(null);
  const keysRef = useRef({});

  // Zones 및 초기 재료 생성 (메모이제이션)
  const ZONES = useMemo(() => createZones(), []);
  const INITIAL_INGREDIENTS = useMemo(() => createInitialIngredients(ZONES), [ZONES]);

  // 게임 상태 refs 중앙 관리
  const playerRef = useRef({
    x: Math.floor((MAP_WIDTH / 2 - PLAYER_SIZE / 2) / GRID_SIZE) * GRID_SIZE,
    y: Math.floor((MAP_HEIGHT / 2) / GRID_SIZE) * GRID_SIZE,
    w: PLAYER_SIZE, 
    h: PLAYER_SIZE,
    color: '#646cff', 
    holding: null, 
    direction: 'down',
    lastMoveTime: 0
  });

  const itemsRef = useRef(JSON.parse(JSON.stringify(INITIAL_INGREDIENTS)));
  const cookedItemsRef = useRef([]); 

  const fireRef = useRef({
    isOn: false, 
    turnOffTime: 0, 
    pressStartTime: 0, 
    isPressing: false
  });

  const blenderRef = useRef({
    state: 'empty',
    finishTime: 0
  });

  const burnerStatesRef = useRef({});

  // 커스텀 훅으로 로직 분리
  const imagesRef = useImageLoader(selectedChar);
  const { socketRef, otherPlayersRef } = useMultiplayerSync(
    isMultiplayer,
    socketProp,
    playerRef,
    fireRef,
    cookedItemsRef
  );
  usePlayerControls(keysRef);

  // 게임 루프 실행
  useGameLoop({
    canvasRef,
    imagesRef,
    isPlaying,
    onBurgerDelivered,
    score,
    isMultiplayer,
    socketRef,
    otherPlayersRef,
    keysRef,
    playerRef,
    itemsRef,
    cookedItemsRef,
    fireRef,
    blenderRef,
    burnerStatesRef,
    INITIAL_INGREDIENTS,
    ZONES,
  });

  return <GameContainer canvasRef={canvasRef} />;
};

export default GameCanvas;