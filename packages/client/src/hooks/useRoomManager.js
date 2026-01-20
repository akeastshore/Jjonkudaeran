// Room 생성/참가 관리 훅
import { useCallback } from 'react';

export const useRoomManager = (connectSocket, gameState, multiplayer, setupSocketListeners) => {
  const handleCreateRoom = useCallback((maxPlayers) => {
    const newSocket = connectSocket();
    multiplayer.setSocket(newSocket);
    newSocket.emit('createRoom', { maxPlayers, nickname: gameState.username });
    newSocket.on('roomCreated', (code) => {
      multiplayer.setRoomId(code);
      multiplayer.setGameMode('multi');
      gameState.setScreen('waiting_room');
    });
    setupSocketListeners(newSocket);
  }, [connectSocket, gameState.username, multiplayer, setupSocketListeners]);

  const handleJoinRoom = useCallback((code) => {
    if (!code) return alert("코드를 입력하세요");
    const newSocket = connectSocket();
    multiplayer.setSocket(newSocket);
    newSocket.emit('joinRoom', { roomId: code, nickname: gameState.username });
    setupSocketListeners(newSocket);
    multiplayer.setRoomId(code);
    multiplayer.setGameMode('multi');
    gameState.setScreen('waiting_room');
  }, [connectSocket, gameState.username, multiplayer, setupSocketListeners]);

  return { handleCreateRoom, handleJoinRoom };
};
