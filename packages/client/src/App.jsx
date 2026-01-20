// src/App.jsx - 완전히 간소화된 버전
import './App.css';
import { useEffect } from 'react';
import { useGameContext } from './context/GameContext';
import { useGameState } from './hooks/useGameState';
import { useMultiplayer } from './hooks/useMultiplayer';
import { useSocketManager } from './hooks/useSocketManager';
import { useRoomManager } from './hooks/useRoomManager';
import { useAuth } from './hooks/useAuth';
import { useGameTimer } from './hooks/useGameTimer';
import AppRouter from './components/AppRouter';

function App() {
  const { connectSocket, disconnectSocket, getServerUrl } = useGameContext();
  
  // 상태 관리 훅
  const gameState = useGameState();
  const multiplayer = useMultiplayer();
  
  // 비즈니스 로직 훅
  const { setupSocketListeners } = useSocketManager(gameState, multiplayer, disconnectSocket);
  const { handleCreateRoom, handleJoinRoom } = useRoomManager(connectSocket, gameState, multiplayer, setupSocketListeners);
  const { handleGoogleLogin } = useAuth(getServerUrl, gameState);
  const { handleGoHome, handleBurgerDelivered, handleStartGame } = useGameTimer(gameState, disconnectSocket, multiplayer);

  // ★ 중요: 소켓이 변경될 때마다 리스너 설정
  useEffect(() => {
    console.log('🔧 [App] useEffect 실행, socket:', multiplayer.socket?.id);
    if (multiplayer.socket) {
      console.log('🔧 [App] 소켓 리스너 설정 시작');
      setupSocketListeners(multiplayer.socket);
      console.log('✅ [App] 소켓 리스너 설정 완료');
    }
  }, [multiplayer.socket]);

  // 모든 핸들러를 하나의 객체로
  const handlers = {
    handleGoogleLogin,
    handleCreateRoom,
    handleJoinRoom,
    handleGoHome,
    handleBurgerDelivered,
    handleStartGame,
  };

  return (
    <div className="app-container">
      <AppRouter 
        screen={gameState.screen} 
        gameState={gameState} 
        multiplayer={multiplayer} 
        handlers={handlers} 
      />
    </div>
  );
}

export default App;
