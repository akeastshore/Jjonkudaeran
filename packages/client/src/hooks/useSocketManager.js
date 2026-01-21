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
    // 기존 리스너 모두 제거 (중복 방지)
    socket.removeAllListeners('error');
    socket.removeAllListeners('waitingUpdate');
    socket.removeAllListeners('allPlayersJoined');
    socket.removeAllListeners('updateScore');
    socket.removeAllListeners('restartGame');
    socket.removeAllListeners('playerLeft');
    socket.removeAllListeners('roomUpdate');

    const handleError = (msg) => {
      alert(msg);
      disconnectSocketRef.current();
      multiplayerRef.current.setSocket(null);
      gameStateRef.current.setScreen('lobby');
    };

    const handleWaitingUpdate = (info) => {
      multiplayerRef.current.setWaitingInfo(info);
    };

    const handleAllPlayersJoined = () => {
      gameStateRef.current.setScreen('multi_lobby');
    };

    const handleUpdateScore = (serverScore) => {
      gameStateRef.current.setScore(serverScore);
    };

    const handleRestartGame = () => {
      gameStateRef.current.resetGameState();
      gameStateRef.current.setScreen('multi_lobby');
    };

    const handlePlayerLeft = () => {
      alert("플레이어가 퇴장하여 방이 사라졌습니다.");
      window.location.reload();
    };

    const handleRoomUpdate = (playersData) => {
      multiplayerRef.current.setRoomPlayers(playersData);
      const members = Object.values(playersData).map(p => p.nickname);
      multiplayerRef.current.setWaitingInfo({
        current: Object.keys(playersData).length,
        max: 0,
        members: members
      });
    };

    // 리스너 등록
    socket.on('error', handleError);
    socket.on('waitingUpdate', handleWaitingUpdate);
    socket.on('allPlayersJoined', handleAllPlayersJoined);
    socket.on('updateScore', handleUpdateScore);
    socket.on('restartGame', handleRestartGame);
    socket.on('playerLeft', handlePlayerLeft);
    socket.on('roomUpdate', handleRoomUpdate);

    // cleanup 함수 반환
    return () => {
      socket.off('error', handleError);
      socket.off('waitingUpdate', handleWaitingUpdate);
      socket.off('allPlayersJoined', handleAllPlayersJoined);
      socket.off('updateScore', handleUpdateScore);
      socket.off('restartGame', handleRestartGame);
      socket.off('playerLeft', handlePlayerLeft);
      socket.off('roomUpdate', handleRoomUpdate);
    };
  }, []);

  return { setupSocketListeners };
};
