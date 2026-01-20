// src/App.jsx
import { useEffect, useRef } from 'react';
import GameCanvas from './GameCanvas';
import './App.css';
import MultiLobby from './MultiLobby';
import { useGameContext } from './context/GameContext';
import { useGameState } from './hooks/useGameState';
import { useMultiplayer } from './hooks/useMultiplayer';
import { CHARACTERS } from './constants/characters';

// Screen Components
import LoginScreen from './components/screens/LoginScreen';
import HomeScreen from './components/screens/HomeScreen';
import CharacterSelection from './components/screens/CharacterSelection';

function App() {
  const { connectSocket, disconnectSocket, getServerUrl } = useGameContext();
  
  // Custom Hooks
  const gameState = useGameState();
  const multiplayer = useMultiplayer();
  
  const timerRef = useRef(null);

  // Socket Listeners Setup
  const setupSocketListeners = (s) => {
    s.on('error', (msg) => {
      alert(msg);
      disconnectSocket();
      multiplayer.setSocket(null);
      gameState.setScreen('lobby');
    });

    s.on('waitingUpdate', (info) => {
      multiplayer.setWaitingInfo(info);
    });

    s.on('allPlayersJoined', () => {
      gameState.setScreen('multi_lobby');
    });

    s.on('updateScore', (serverScore) => {
      gameState.setScore(serverScore);
    });

    s.on('restartGame', () => {
      gameState.resetGameState();
      gameState.setScreen('gameplay');
    });

    s.on('playerLeft', () => {
      alert("플레이어가 퇴장하여 방이 사라졌습니다.");
      window.location.reload();
    });

    s.on('roomUpdate', (playersData) => {
      multiplayer.setRoomPlayers(playersData);
      const members = Object.values(playersData).map(p => p.nickname);
      multiplayer.setWaitingInfo({
        current: Object.keys(playersData).length,
        max: 0,
        members: members
      });
    });
  };

  // Room Handlers
  const handleCreateRoom = (maxPlayers) => {
    const newSocket = connectSocket();
    multiplayer.setSocket(newSocket);
    newSocket.emit('createRoom', { maxPlayers, nickname: gameState.username });
    newSocket.on('roomCreated', (code) => {
      multiplayer.setRoomId(code);
      multiplayer.setGameMode('multi');
      gameState.setScreen('waiting_room');
    });
    setupSocketListeners(newSocket);
  };

  const handleJoinRoom = (code) => {
    if (!code) return alert("코드를 입력하세요");
    const newSocket = connectSocket();
    multiplayer.setSocket(newSocket);
    newSocket.emit('joinRoom', { roomId: code, nickname: gameState.username });
    setupSocketListeners(newSocket);
    multiplayer.setRoomId(code);
    multiplayer.setGameMode('multi');
    gameState.setScreen('waiting_room');
  };

  // Auth Handler
  const handleGoogleLogin = () => {
    const backendUrl = `${getServerUrl()}/auth/google?popup=true`;
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      backendUrl,
      "google_login_popup",
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`
    );

    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      alert("팝업 차단이 감지되었습니다. 팝업을 허용해주세요!");
    }
  };

  // Google Login Success Handler
  useEffect(() => {
    const handleMessage = async (event) => {
      if (event.data.type !== 'LOGIN_SUCCESS') return;
      console.log("✅ 팝업에서 로그인 성공 신호를 받았습니다!");

      try {
        const res = await fetch(`${getServerUrl()}/api/me`, {
          method: 'GET',
          credentials: 'include',
        });

        if (res.ok) {
          const userData = await res.json();
          console.log("👤 내 정보:", userData);
          if (userData) {
            gameState.setUsername(userData.name || userData.displayName);
            gameState.setScreen('home');
          }
        }
      } catch (err) {
        console.error("❌ 내 정보 가져오기 실패:", err);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

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
  }, [gameState.screen]);

  // Go Home Handler
  const handleGoHome = () => {
    disconnectSocket();
    multiplayer.resetMultiplayerState();
    gameState.setScreen('home');
  };

  // Game Logic - Countdown
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

  // Game Logic - Timer
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

  const handleBurgerDelivered = () => {
    gameState.setScore(prev => prev + 1);
  };

  const handleStartGame = () => {
    if (gameState.selectedChar === null) {
      alert("캐릭터를 선택해주세요!");
      return;
    }
    gameState.setScreen('gameplay');
  };

  // Screen Rendering
  const renderScreen = () => {
    switch (gameState.screen) {
      case 'login':
        return (
          <LoginScreen
            username={gameState.username}
            setUsername={gameState.setUsername}
            setScreen={gameState.setScreen}
            handleGoogleLogin={handleGoogleLogin}
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
          <div className="game-screen">
            <h2>멀티플레이</h2>
            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', alignItems: 'flex-start' }}>
              {/* 방 만들기 */}
              <div style={{ background: '#444', padding: '30px', borderRadius: '15px', width: '250px' }}>
                <h3>방 만들기</h3>
                <p style={{ marginBottom: '20px' }}>인원 수 설정</p>

                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px',
                  marginBottom: '20px', background: '#333', padding: '10px', borderRadius: '10px'
                }}>
                  <button
                    className="menu-button"
                    style={{ padding: '5px 15px', fontSize: '1.2rem', background: '#666' }}
                    onClick={() => multiplayer.setLobbyCapacity(prev => Math.max(2, prev - 1))}
                  >
                    ◀
                  </button>

                  <span style={{ fontSize: '2rem', fontWeight: 'bold', color: '#FFD700', minWidth: '30px' }}>
                    {multiplayer.lobbyCapacity}
                  </span>

                  <button
                    className="menu-button"
                    style={{ padding: '5px 15px', fontSize: '1.2rem', background: '#666' }}
                    onClick={() => multiplayer.setLobbyCapacity(prev => Math.min(4, prev + 1))}
                  >
                    ▶
                  </button>
                </div>

                <button
                  className="menu-button"
                  style={{ width: '100%', background: '#4CAF50' }}
                  onClick={() => handleCreateRoom(multiplayer.lobbyCapacity)}
                >
                  방 만들기
                </button>
              </div>

              {/* 방 참가하기 */}
              <div style={{ background: '#555', padding: '30px', borderRadius: '15px', width: '250px' }}>
                <h3>방 참가하기</h3>
                <p style={{ marginBottom: '20px' }}>초대 코드를 입력하세요</p>
                <input id="joinCode" placeholder="CODE" style={{ padding: '15px', width: '100%', marginBottom: '20px', fontSize: '1.2rem', textAlign: 'center', textTransform: 'uppercase' }} />
                <button className="menu-button" style={{ backgroundColor: '#2196F3', width: '100%' }}
                  onClick={() => handleJoinRoom(document.getElementById('joinCode').value.toUpperCase())}>
                  입장하기
                </button>
              </div>
            </div>
            <button className="back-btn" onClick={() => gameState.setScreen('home')}>뒤로가기</button>
          </div>
        );

      case 'waiting_room':
        return (
          <div className="game-screen">
            <h1>⏳ 대기실</h1>
            <div style={{ background: '#222', padding: '40px', borderRadius: '20px', border: '2px solid #555' }}>
              <h2 style={{ color: '#FFD700', fontSize: '3rem', letterSpacing: '5px' }}>{multiplayer.roomId}</h2>
              <p style={{ color: '#aaa' }}>친구에게 위 코드를 알려주세요!</p>

              <hr style={{ borderColor: '#444', margin: '20px 0' }} />

              <div style={{ fontSize: '1.5rem', marginBottom: '20px' }}>
                현재 인원: <b style={{ color: '#4CAF50' }}>{multiplayer.waitingInfo.current}</b> / {multiplayer.waitingInfo.max}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {multiplayer.waitingInfo.members.map((mem, idx) => (
                  <div key={idx} style={{ background: '#444', padding: '10px', borderRadius: '5px' }}>
                    👤 {mem} {idx === 0 && '👑(방장)'}
                  </div>
                ))}
              </div>

              {multiplayer.waitingInfo.current < multiplayer.waitingInfo.max && (
                <div className="loading-dots" style={{ marginTop: '30px', color: '#888' }}>
                  참가자를 기다리는 중...
                </div>
              )}
            </div>
          </div>
        );

      case 'multi_lobby':
        return (
          <MultiLobby
            socket={multiplayer.socket}
            roomId={multiplayer.roomId}
            characters={CHARACTERS}
            onGameStart={() => gameState.setScreen('gameplay')}
          />
        );

      case 'single':
        return (
          <CharacterSelection
            selectedChar={gameState.selectedChar}
            setSelectedChar={gameState.setSelectedChar}
            setScreen={gameState.setScreen}
            handleStartGame={handleStartGame}
          />
        );

      case 'gameplay':
        const myCharacter = CHARACTERS.find(c => c.id === gameState.selectedChar) || CHARACTERS[0];
        return (
          <div className="game-screen-wrapper" style={{ position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '800px', margin: '0 auto 10px', color: '#fff', fontSize: '1.2rem' }}>
              <span>Chef: <b>{gameState.username}</b></span>
              <span style={{ color: gameState.timeLeft <= 5 ? '#ff4444' : '#FFD700', fontWeight: 'bold' }}>
                ⏰ {gameState.timeLeft}s
              </span>
              <span style={{ color: '#4CAF50', fontWeight: 'bold', fontSize: '1.5rem' }}>
                🍔 {gameState.score}
              </span>
            </div>

            <GameCanvas
              selectedChar={myCharacter}
              isPlaying={gameState.isPlaying}
              onBurgerDelivered={handleBurgerDelivered}
              isMultiplayer={multiplayer.gameMode === 'multi'}
              roomId={multiplayer.roomId}
              socketProp={multiplayer.socket}
            />

            {gameState.countDown > 0 && (
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '10rem', color: 'white', textShadow: '0 0 10px black' }}>
                {gameState.countDown}
              </div>
            )}
          </div>
        );

      case 'result':
        const amIVoted = multiplayer.socket && multiplayer.roomPlayers[multiplayer.socket.id]?.wantsRestart;

        return (
          <div className="game-screen">
            <h1 style={{ fontSize: '3rem', color: '#FFD700' }}>👨‍🍳 영업 종료!</h1>

            <div style={{ background: '#333', padding: '30px', borderRadius: '15px', marginTop: '10px', minWidth: '400px' }}>
              <h2>최종 스코어</h2>
              <p style={{ fontSize: '4rem', fontWeight: 'bold', margin: '10px 0', color: '#4CAF50' }}>
                🍔 {gameState.score}개
              </p>
              <p style={{ color: '#ccc' }}>{gameState.username} 셰프님 수고하셨습니다!</p>

              <hr style={{ borderColor: '#555', margin: '20px 0' }} />

              {multiplayer.gameMode === 'multi' && (
                <div style={{ marginBottom: '20px' }}>
                  <h3>재도전 대기 중... ({gameState.resultTimeLeft}초)</h3>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '10px' }}>
                    {Object.values(multiplayer.roomPlayers).map((p, idx) => (
                      <div key={idx} style={{
                        padding: '10px 20px',
                        borderRadius: '20px',
                        background: p.wantsRestart ? '#4CAF50' : '#555',
                        color: 'white',
                        border: '2px solid white',
                        opacity: p.wantsRestart ? 1 : 0.5
                      }}>
                        {p.nickname} {p.wantsRestart ? '✅' : '...'}
                      </div>
                    ))}
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#aaa', marginTop: '5px' }}>
                    * 전원이 동의해야 게임이 시작됩니다.
                  </p>
                </div>
              )}
            </div>

            <div className="menu-container" style={{ marginTop: '20px', flexDirection: 'row', justifyContent: 'center' }}>
              <button
                className="menu-button"
                style={{
                  backgroundColor: amIVoted ? '#f44336' : '#2196F3',
                  minWidth: '150px'
                }}
                onClick={() => {
                  if (multiplayer.gameMode === 'multi' && multiplayer.socket) {
                    multiplayer.socket.emit('voteRestart');
                  } else {
                    gameState.setScreen('gameplay');
                  }
                }}>
                {multiplayer.gameMode === 'multi'
                  ? (amIVoted ? '다시 하기 취소' : '다시 하기 투표')
                  : '다시 하기'}
              </button>

              <button className="menu-button" onClick={handleGoHome}>
                홈으로
              </button>
            </div>
          </div>
        );

      default:
        return <div>Error: Unknown Screen</div>;
    }
  };

  return <div className="app-container">{renderScreen()}</div>;
}

export default App;
