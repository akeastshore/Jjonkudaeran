// 앱 라우터 컴포넌트 - 화면 렌더링 관리
import { CHARACTERS } from '../constants/characters';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import CharacterSelection from './screens/CharacterSelection';
import LobbyScreen from './screens/LobbyScreen';
import WaitingRoomScreen from './screens/WaitingRoomScreen';
import GameplayScreen from './screens/GameplayScreen';
import ResultScreen from './screens/ResultScreen';
import MultiLobby from '../MultiLobby';

const AppRouter = ({ 
  screen, 
  gameState, 
  multiplayer, 
  handlers 
}) => {
  switch (screen) {
    case 'login':
      return (
        <LoginScreen
          username={gameState.username}
          setUsername={gameState.setUsername}
          setScreen={gameState.setScreen}
          handleGoogleLogin={handlers.handleGoogleLogin}
        />
      );

    case 'home':
      return (
        <HomeScreen
          setScreen={gameState.setScreen}
          showSettings={gameState.showSettings}
          setShowSettings={gameState.setShowSettings}
        />
      );

    case 'lobby':
      return (
        <LobbyScreen
          lobbyCapacity={multiplayer.lobbyCapacity}
          setLobbyCapacity={multiplayer.setLobbyCapacity}
          onCreateRoom={handlers.handleCreateRoom}
          onJoinRoom={handlers.handleJoinRoom}
          onBack={() => gameState.setScreen('home')}
        />
      );

    case 'waiting_room':
      return (
        <WaitingRoomScreen
          roomId={multiplayer.roomId}
          waitingInfo={multiplayer.waitingInfo}
          socket={multiplayer.socket}
          username={gameState.username}
        />
      );

    case 'multi_lobby':
      return (
        <MultiLobby
          socket={multiplayer.socket}
          roomId={multiplayer.roomId}
          characters={CHARACTERS}
          onGameStart={() => gameState.setScreen('gameplay')}
          setSelectedChar={gameState.setSelectedChar}
        />
      );

    case 'single':
      return (
        <CharacterSelection
          selectedChar={gameState.selectedChar}
          setSelectedChar={gameState.setSelectedChar}
          setScreen={gameState.setScreen}
          handleStartGame={handlers.handleStartGame}
        />
      );

    case 'gameplay':
      const myCharacter = CHARACTERS.find(c => c.id === gameState.selectedChar) || CHARACTERS[0];
      return (
        <GameplayScreen
          username={gameState.username}
          timeLeft={gameState.timeLeft}
          score={gameState.score}
          selectedChar={myCharacter}
          isPlaying={gameState.isPlaying}
          onBurgerDelivered={handlers.handleBurgerDelivered}
          isMultiplayer={multiplayer.gameMode === 'multi'}
          roomId={multiplayer.roomId}
          socket={multiplayer.socket}
          countDown={gameState.countDown}
        />
      );

    case 'result':
      const resultCharacter = CHARACTERS.find(c => c.id === gameState.selectedChar) || CHARACTERS[0];
      return (
        <ResultScreen
          score={gameState.score}
          username={gameState.username}
          gameMode={multiplayer.gameMode}
          roomPlayers={multiplayer.roomPlayers}
          socket={multiplayer.socket}
          resultTimeLeft={gameState.resultTimeLeft}
          onRestart={() => {
            if (multiplayer.gameMode === 'multi' && multiplayer.socket) {
              console.log('🔵 [클라이언트] voteRestart 이벤트 전송');
              multiplayer.socket.emit('voteRestart');
            } else {
              gameState.setScreen('gameplay');
            }
          }}
          onGoHome={handlers.handleGoHome}
          selectedChar={resultCharacter}
        />
      );

    default:
      return <div>Error: Unknown Screen</div>;
  }
};

export default AppRouter;
