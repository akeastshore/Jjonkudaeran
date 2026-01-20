// 게임 타이머 관리 훅
import { useEffect, useRef, useCallback } from 'react';

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
      gameState.setTimeLeft(120);
      gameState.setScore(0);

      const countInterval = setInterval(() => {
        gameState.setCountDown((prev) => {
          if (prev === 1) {
            clearInterval(countInterval);
            gameState.setIsPlaying(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(countInterval);
    }
  }, [gameState.screen]);

  // Game Timer
  useEffect(() => {
    if (gameState.isPlaying && gameState.timeLeft > 0) {
      timerRef.current = setInterval(() => {
        gameState.setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            gameState.setIsPlaying(false);
            gameState.setScreen('result');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [gameState.isPlaying, gameState.timeLeft]);

  const handleBurgerDelivered = useCallback(() => {
    gameState.setScore(prev => prev + 1);
  }, [gameState]);

  const handleStartGame = useCallback(() => {
    if (gameState.selectedChar === null) {
      alert("캐릭터를 선택해주세요!");
      return;
    }
    gameState.setScreen('gameplay');
  }, [gameState]);

  return { handleGoHome, handleBurgerDelivered, handleStartGame };
};
