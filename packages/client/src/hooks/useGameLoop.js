// 게임 루프 로직을 관리하는 커스텀 훅
import { useEffect } from 'react';
import {
  GRID_SIZE,
  MAP_WIDTH,
  MAP_HEIGHT,
  PLAYER_SIZE,
} from '../constants/gameConstants';
import { getBurnerState as getBurnerStateUtil, createSpawnItemFunction, createCheckRecipeFunction } from '../utils/gameMechanics';
import { updateMovement as updatePlayerMovement } from '../utils/playerMovement';
import { createDrawFunction } from '../utils/gameRenderer';
import { createGameLogicUpdate } from '../utils/gameLogicUpdate';
import { syncOtherPlayersItems } from '../utils/multiplayerSync';

export const useGameLoop = ({
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
  trayStatesRef,
  burnerStatesRef,
  INITIAL_INGREDIENTS,
  ZONES,
}) => {
  const getBurnerState = (zone) => getBurnerStateUtil(burnerStatesRef, zone);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    canvas.width = MAP_WIDTH;
    canvas.height = MAP_HEIGHT;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // 게임이 시작되지 않았을 때 초기화
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

    // 아이템 생성 및 레시피 체크 함수 생성
    const spawnItem = createSpawnItemFunction(cookedItemsRef, isMultiplayer, socketRef);
    const checkRecipe = createCheckRecipeFunction(cookedItemsRef, isMultiplayer, socketRef, spawnItem);

    // 게임 로직 업데이트
    const updateGameLogic = createGameLogicUpdate(
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
    );

    // 렌더링 함수
    const draw = createDrawFunction(
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
    );

    // 게임 루프
    let animationFrameId;
    const gameLoop = () => {
      if (isPlaying) {
        updatePlayerMovement(playerRef, keysRef, cookedItemsRef, ZONES, socketRef);
        updateGameLogic();
      }

      // 멀티플레이어: 다른 플레이어가 들고 있는 아이템 위치 동기화
      if (isMultiplayer) {
        syncOtherPlayersItems(cookedItemsRef, otherPlayersRef, socketRef);
      }

      draw();
      animationFrameId = requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [
    isPlaying,
    onBurgerDelivered,
    score,
    isMultiplayer,
    canvasRef,
    imagesRef,
    socketRef,
    otherPlayersRef,
    keysRef,
    playerRef,
    itemsRef,
    cookedItemsRef,
    fireRef,
    blenderRef,
    trayStatesRef,
    burnerStatesRef,
    INITIAL_INGREDIENTS,
    ZONES
  ]);
};
