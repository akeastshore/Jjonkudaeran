// Socket 이벤트 리스너 관리 훅
import { useCallback } from 'react';

export const useSocketManager = (gameState, multiplayer, disconnectSocket) => {
  const setupSocketListeners = useCallback((socket) => {
    socket.on('error', (msg) => {
      alert(msg);
      disconnectSocket();
      multiplayer.setSocket(null);
      gameState.setScreen('lobby');
    });

    socket.on('waitingUpdate', (info) => {
      multiplayer.setWaitingInfo(info);
    });

    socket.on('allPlayersJoined', () => {
      gameState.setScreen('multi_lobby');
    });

    socket.on('updateScore', (serverScore) => {
      gameState.setScore(serverScore);
    });

    socket.on('restartGame', () => {
      gameState.resetGameState();
      gameState.setScreen('gameplay');
    });

    socket.on('playerLeft', () => {
      alert("플레이어가 퇴장하여 방이 사라졌습니다.");
      window.location.reload();
    });

    socket.on('roomUpdate', (playersData) => {
      multiplayer.setRoomPlayers(playersData);
      const members = Object.values(playersData).map(p => p.nickname);
      multiplayer.setWaitingInfo({
        current: Object.keys(playersData).length,
        max: 0,
        members: members
      });
    });
  }, [gameState, multiplayer, disconnectSocket]);

  return { setupSocketListeners };
};
