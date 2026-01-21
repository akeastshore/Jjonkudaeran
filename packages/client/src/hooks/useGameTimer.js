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
        // 실제 게임 경과 시간 = (현재시간 - 시작시간) - 3초(카운트다운)
        const totalElapsed = (now - startTime) / 1000;
        const gameElapsed = totalElapsed - 3;

        const remain = Math.max(0, Math.ceil(GAME_DURATION - gameElapsed));

        gameState.setTimeLeft(remain);

        if (remain <= 0) {
          clearInterval(timerRef.current);
          gameState.setIsPlaying(false);
          gameState.setScreen('result');
        }
      }, 500); // 0.5초마다 갱신 (화면은 remain 계산값으로 표시)
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
    // [NEW] 서버 시작 시간 저장
    if (serverStartTime) {
      gameState.setGameStartTime(serverStartTime);
    } else {
      gameState.setGameStartTime(Date.now());
    }
    gameState.setScreen('gameplay');
  }, [gameState]);

  return { handleGoHome, handleBurgerDelivered, handleStartGame };
};
