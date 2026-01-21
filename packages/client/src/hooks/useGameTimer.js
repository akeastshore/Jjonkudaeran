// 게임 타이머 관리 훅
import { useEffect, useRef, useCallback } from 'react';

import {
  GAME_DURATION,
} from '../constants/gameConstants';

export const useGameTimer = (gameState, disconnectSocket, multiplayer) => {
  const timerRef = useRef(null);

  const handleGoHome = useCallback(() => {
    disconnectSocket();
    multiplayer.resetMultiplayerState();
    gameState.setScreen('home');
  }, [disconnectSocket, multiplayer, gameState]);

  // Result Screen Timer
  useEffect(() => {
    if (gameState.screen === 'result') {
      gameState.setResultTimeLeft(10);

      const timer = setInterval(() => {
        gameState.setResultTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            handleGoHome();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [gameState.screen, handleGoHome]);

  // Game Countdown
  useEffect(() => {
    if (gameState.screen === 'gameplay') {
      gameState.setCountDown(3);
      gameState.setIsPlaying(false);
      gameState.setTimeLeft(GAME_DURATION);
      gameState.setScore(0);

      // [NEW] 서버 시간 기반 카운트다운 (gameStartTime이 있으면 사용)
      const startTime = gameState.gameStartTime || Date.now();

      const countInterval = setInterval(() => {
        const now = Date.now();
        const elapsed = (now - startTime) / 1000;

        // 3초 카운트다운
        if (elapsed < 3) {
          gameState.setCountDown(Math.ceil(3 - elapsed));
        } else {
          gameState.setCountDown(0);
          gameState.setIsPlaying(true);
          clearInterval(countInterval);
        }
      }, 100);

      return () => clearInterval(countInterval);
    }
  }, [gameState.screen, gameState.gameStartTime]);

  // Game Timer
  useEffect(() => {
    if (gameState.isPlaying) {
      // [NEW] 서버 시간 기반 게임 타이머
      const startTime = gameState.gameStartTime || Date.now(); // fallback

      timerRef.current = setInterval(() => {
        const now = Date.now();
        // 3초 카운트다운 후 GAME_DURATION 초 진행
        const totalElapsed = (now - startTime) / 1000;
        const gameElapsed = totalElapsed - 3;

        const remain = Math.max(0, Math.ceil(GAME_DURATION - gameElapsed));

        // [DEBUG] Monitor timer values
        if (Math.random() < 0.05) { // Log occasionally to avoid spam
          console.log(`[Timer Debug] Now: ${now}, Start: ${startTime}, Elapsed: ${totalElapsed}, GameElapsed: ${gameElapsed}, Remain: ${remain}`);
        }

        gameState.setTimeLeft(remain);

        if (remain <= 0) {
          clearInterval(timerRef.current);
          gameState.setIsPlaying(false);
          gameState.setScreen('result');
        }
      }, 100); // 0.1초마다 갱신하여 반응성 향상
    }
    return () => clearInterval(timerRef.current);
  }, [gameState.isPlaying, gameState.gameStartTime]);

  const handleBurgerDelivered = useCallback(() => {
    gameState.setScore(prev => prev + 1);
  }, [gameState]);

  const handleStartGame = useCallback((serverStartTime) => {
    if (gameState.selectedChar === null) {
      alert("캐릭터를 선택해주세요!");
      return;
    }
    // [NEW] 서버 시작 시간 저장 (숫자일 때만 저장, 이벤트 객체 방지)
    if (serverStartTime && typeof serverStartTime === 'number') {
      gameState.setGameStartTime(serverStartTime);
    } else {
      gameState.setGameStartTime(Date.now());
    }
    gameState.setScreen('gameplay');
  }, [gameState]);

  return { handleGoHome, handleBurgerDelivered, handleStartGame };
};
