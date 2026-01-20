// Socket 이벤트 리스너 관리 훅
import { useCallback, useRef, useEffect } from 'react';

export const useSocketManager = (gameState, multiplayer, disconnectSocket) => {
  // 최신 값을 참조하기 위한 ref
  const gameStateRef = useRef(gameState);
  const multiplayerRef = useRef(multiplayer);
  const disconnectSocketRef = useRef(disconnectSocket);

  useEffect(() => {
    gameStateRef.current = gameState;
    multiplayerRef.current = multiplayer;
    disconnectSocketRef.current = disconnectSocket;
  }, [gameState, multiplayer, disconnectSocket]);

  const setupSocketListeners = useCallback((socket) => {
    socket.on('error', (msg) => {
      alert(msg);
      disconnectSocketRef.current();
      multiplayerRef.current.setSocket(null);
      gameStateRef.current.setScreen('lobby');
    });

    socket.on('waitingUpdate', (info) => {
      multiplayerRef.current.setWaitingInfo(info);
    });

    socket.on('allPlayersJoined', () => {
      gameStateRef.current.setScreen('multi_lobby');
    });

    socket.on('updateScore', (serverScore) => {
      gameStateRef.current.setScore(serverScore);
    });

    socket.on('restartGame', () => {
      gameStateRef.current.resetGameState();
      gameStateRef.current.setScreen('multi_lobby');
    });

    socket.on('playerLeft', () => {
      alert("플레이어가 퇴장하여 방이 사라졌습니다.");
      window.location.reload();
    });

    socket.on('roomUpdate', (playersData) => {
      console.log('📥 [클라이언트] roomUpdate 수신:', 
        Object.values(playersData).map(p => ({ nickname: p.nickname, wantsRestart: p.wantsRestart }))
      );
      console.log('🔧 [클라이언트] setRoomPlayers 호출 전');
      multiplayerRef.current.setRoomPlayers(playersData);
      console.log('✅ [클라이언트] setRoomPlayers 호출 완료');
      const members = Object.values(playersData).map(p => p.nickname);
      multiplayerRef.current.setWaitingInfo({
        current: Object.keys(playersData).length,
        max: 0,
        members: members
      });
    });
  }, []); // 의존성 배열 비움

  return { setupSocketListeners };
};
