// src/App.jsx
import { useState, useEffect, useRef } from 'react';
import GameCanvas from './GameCanvas';
import './App.css';
import MultiLobby from './MultiLobby'; 
// import { io } from "socket.io-client"; // ★ 삭제 (Context가 대신함)
import { useGameContext } from './context/GameContext'; // ★ 추가

function App() {
  // ★ Context에서 함수 가져오기
  const { connectSocket, disconnectSocket, getServerUrl } = useGameContext();

  // --- 상태 관리 ---
  const [username, setUsername] = useState('');
  const [screen, setScreen] = useState('login'); 

  // 게임 데이터
  const [selectedChar, setSelectedChar] = useState(null);
  
  // 게임 진행 관련
  const [countDown, setCountDown] = useState(3);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120);
  const [score, setScore] = useState(0);

  // 멀티플레이 관련
  const [socket, setSocket] = useState(null); 
  const [roomId, setRoomId] = useState(''); 
  const [gameMode, setGameMode] = useState('single'); 
  const [waitingInfo, setWaitingInfo] = useState({ current: 0, max: 0, members: [] });
  
  const [lobbyCapacity, setLobbyCapacity] = useState(2);

  const timerRef = useRef(null);
  const [resultTimeLeft, setResultTimeLeft] = useState(10);
  const [roomPlayers, setRoomPlayers] = useState({});

  const characters = [
    { id: 1, name: '전사 셰프', img: 'https://via.placeholder.com/300/FF5733/FFFFFF?text=Chef+W' },
    { id: 2, name: '마법사 셰프', img: 'https://via.placeholder.com/300/33FF57/FFFFFF?text=Chef+M' },
    { id: 3, name: '궁수 셰프', img: 'https://via.placeholder.com/300/3357FF/FFFFFF?text=Chef+A' },
    { id: 4, name: '도적 셰프', img: 'https://via.placeholder.com/300/F3FF33/000000?text=Chef+R' },
    { id: 5, name: '성직자 셰프', img: 'https://via.placeholder.com/300/FF33F3/FFFFFF?text=Chef+P' },
  ];

  // ------------------------------------------------
  // 1. 방 만들기 (방장)
  // ------------------------------------------------
  const handleCreateRoom = (maxPlayers) => {
    // ★ Context를 통해 소켓 연결 (주소 자동 결정)
    const newSocket = connectSocket();
    setSocket(newSocket); // 기존 로직 유지를 위해 state에도 저장

    // 서버에 "방 만들어줘" 요청
    newSocket.emit('createRoom', { maxPlayers, nickname: username });

    // 내 방 코드를 받음
    newSocket.on('roomCreated', (code) => {
      setRoomId(code);
      setGameMode('multi');
      setScreen('waiting_room'); 
    });

    setupSocketListeners(newSocket);
  };

  // ------------------------------------------------
  // 2. 방 참가하기 (참가자)
  // ------------------------------------------------
  const handleJoinRoom = (code) => {
    if (!code) return alert("코드를 입력하세요");
    
    // ★ Context를 통해 소켓 연결
    const newSocket = connectSocket();
    setSocket(newSocket);

    // 서버에 "들여보내줘" 요청
    newSocket.emit('joinRoom', { roomId: code, nickname: username });

    setupSocketListeners(newSocket);
    setRoomId(code);
    setGameMode('multi');
    setScreen('waiting_room'); 
  };

  // 공통 소켓 리스너
  const setupSocketListeners = (s) => {
    // 에러 처리
    s.on('error', (msg) => {
      alert(msg);
      disconnectSocket(); // ★ Context 함수 사용
      setSocket(null);
      setScreen('lobby');
    });

    // 대기실 인원 현황 업데이트
    s.on('waitingUpdate', (info) => {
      setWaitingInfo(info);
    });

    // 전원 입장 완료 -> 캐릭터 선택창
    s.on('allPlayersJoined', () => {
      setScreen('multi_lobby'); 
    });

    s.on('updateScore', (serverScore) => {
      setScore(serverScore); 
    });
    
    s.on('restartGame', () => {
      setScore(0);
      setTimeLeft(120);
      setCountDown(3);
      setIsPlaying(false);
      setScreen('gameplay');
    });
    
    s.on('playerLeft', () => {
        alert("플레이어가 퇴장하여 방이 사라졌습니다.");
        window.location.reload();
    });

    s.on('roomUpdate', (playersData) => {
        setRoomPlayers(playersData); 
        const members = Object.values(playersData).map(p => p.nickname);
        setWaitingInfo({ 
          current: Object.keys(playersData).length, 
          max: 0, 
          members: members 
        });
    });
  };

  // --- [구글 로그인 핸들러] ---
  const handleGoogleLogin = () => {
    // ★ 서버 주소 동적 할당 (Localhost vs KCLOUD)
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

  useEffect(() => {
    const handleMessage = async (event) => {
      if (event.data.type !== 'LOGIN_SUCCESS') return;
      console.log("✅ 팝업에서 로그인 성공 신호를 받았습니다!");

      try {
        // ★ API 주소 동적 할당
        const res = await fetch(`${getServerUrl()}/api/me`, {
          method: 'GET',
          credentials: 'include',
        });

        if (res.ok) {
          const userData = await res.json();
          console.log("👤 내 정보:", userData);
          if (userData) {
            setUsername(userData.name || userData.displayName);
            setScreen('home');
          }
        }
      } catch (err) {
        console.error("❌ 내 정보 가져오기 실패:", err);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []); // eslint-disable-next-line

  // ★ 결과 화면 10초 카운트다운 & 자동 퇴장
  useEffect(() => {
    if (screen === 'result') {
      setResultTimeLeft(10); 

      const timer = setInterval(() => {
        setResultTimeLeft(prev => {
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
  }, [screen]);

  // 홈으로 가는 함수 (소켓 정리 포함)
  const handleGoHome = () => {
    disconnectSocket(); // ★ Context 함수로 소켓 정리
    setSocket(null);
    setGameMode('single');
    setRoomId('');
    setScreen('home');
  };

  // --- [게임 로직] ---
  useEffect(() => {
    if (screen === 'gameplay') {
      setCountDown(3);
      setIsPlaying(false);
      setTimeLeft(120);
      setScore(0);

      const countInterval = setInterval(() => {
        setCountDown((prev) => {
          if (prev === 1) {
            clearInterval(countInterval);
            setIsPlaying(true); 
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(countInterval);
    }
  }, [screen]);

  useEffect(() => {
    if (isPlaying && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsPlaying(false);
            setScreen('result');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [isPlaying, timeLeft]);

  const handleBurgerDelivered = () => {
    setScore(prev => prev + 1);
  };

  const handleStartGame = () => {
    if (selectedChar === null) { alert("캐릭터를 선택해주세요!"); return; }
    setScreen('gameplay');
  };

  // --- [화면 렌더링] ---
  const renderScreen = () => {
    switch (screen) {
      case 'login':
        return (
          <div className="login-screen">
            <h1>두바이 쫀득 쿠키 게임</h1>
            <button onClick={handleGoogleLogin} style={{ padding: '15px 30px', fontSize: '18px', cursor: 'pointer', backgroundColor: '#4f4f4f', border: '1px solid #ccc', borderRadius: '5px' }}>
              🌏 구글 계정으로 시작하기
            </button>
          </div>
        );

      case 'home':
        return (
          <div className="game-screen">
            <h1>Welcome Chef {username}!</h1>
            <div className="menu-container">
              <button className="menu-button" onClick={() => setScreen('single')}>싱글플레이</button>
              <button className="menu-button" onClick={() => setScreen('lobby')}>멀티플레이</button>
              <button className="menu-button" onClick={() => setScreen('tutorial')}>튜토리얼</button>
            </div>
            <button className="back-btn" onClick={() => setScreen('login')}>로그아웃</button>
          </div>
        );

      case 'lobby':
        return (
          <div className="game-screen">
             <h2>멀티플레이</h2>
             <div style={{ display:'flex', gap:'20px', justifyContent:'center', alignItems:'flex-start' }}>
                
                {/* 방 만들기 */}
                <div style={{ background: '#444', padding:'30px', borderRadius:'15px', width:'250px' }}>
                    <h3>방 만들기</h3>
                    <p style={{marginBottom:'20px'}}>인원 수 설정</p>
                    
                    <div style={{ 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', 
                      marginBottom: '20px', background: '#333', padding: '10px', borderRadius: '10px' 
                    }}>
                      <button 
                        className="menu-button" 
                        style={{ padding: '5px 15px', fontSize: '1.2rem', background: '#666' }}
                        onClick={() => setLobbyCapacity(prev => Math.max(2, prev - 1))}
                      >
                        ◀
                      </button>
                      
                      <span style={{ fontSize: '2rem', fontWeight: 'bold', color: '#FFD700', minWidth:'30px' }}>
                        {lobbyCapacity}
                      </span>
                      
                      <button 
                        className="menu-button" 
                        style={{ padding: '5px 15px', fontSize: '1.2rem', background: '#666' }}
                        onClick={() => setLobbyCapacity(prev => Math.min(4, prev + 1))}
                      >
                        ▶
                      </button>
                    </div>

                    <button 
                      className="menu-button" 
                      style={{ width: '100%', background: '#4CAF50' }}
                      onClick={() => handleCreateRoom(lobbyCapacity)} 
                    >
                      방 만들기
                    </button>
                </div>

                {/* 방 참가하기 */}
                <div style={{ background: '#555', padding:'30px', borderRadius:'15px', width:'250px' }}>
                    <h3>방 참가하기</h3>
                    <p style={{marginBottom:'20px'}}>초대 코드를 입력하세요</p>
                    <input id="joinCode" placeholder="CODE" style={{padding:'15px', width:'100%', marginBottom:'20px', fontSize:'1.2rem', textAlign:'center', textTransform:'uppercase'}}/>
                    <button className="menu-button" style={{backgroundColor:'#2196F3', width: '100%'}}
                        onClick={() => handleJoinRoom(document.getElementById('joinCode').value.toUpperCase())}>
                        입장하기
                    </button>
                </div>
             </div>
             <button className="back-btn" onClick={() => setScreen('home')}>뒤로가기</button>
          </div>
        );

      case 'waiting_room':
        return (
          <div className="game-screen">
             <h1>⏳ 대기실</h1>
             <div style={{ background: '#222', padding: '40px', borderRadius: '20px', border: '2px solid #555' }}>
                <h2 style={{ color: '#FFD700', fontSize: '3rem', letterSpacing: '5px' }}>{roomId}</h2>
                <p style={{ color: '#aaa' }}>친구에게 위 코드를 알려주세요!</p>
                
                <hr style={{borderColor:'#444', margin:'20px 0'}}/>
                
                <div style={{ fontSize: '1.5rem', marginBottom: '20px' }}>
                   현재 인원: <b style={{color:'#4CAF50'}}>{waitingInfo.current}</b> / {waitingInfo.max}
                </div>

                <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                    {waitingInfo.members.map((mem, idx) => (
                        <div key={idx} style={{background:'#444', padding:'10px', borderRadius:'5px'}}>
                            👤 {mem} {idx === 0 && '👑(방장)'}
                        </div>
                    ))}
                </div>

                {waitingInfo.current < waitingInfo.max && (
                    <div className="loading-dots" style={{marginTop:'30px', color:'#888'}}>
                       참가자를 기다리는 중...
                    </div>
                )}
             </div>
          </div>
        );

      case 'multi_lobby':
        return (
          <MultiLobby 
            socket={socket}
            roomId={roomId}
            characters={characters}
            onGameStart={() => setScreen('gameplay')}
          />
        );

      case 'single': 
        return ( 
          <div className="char-select-screen">
            <h2>캐릭터 선택</h2>
            <div className="char-list">
              {characters.map(c => (
                <div key={c.id} className={`char-card ${selectedChar===c.id?'selected':''}`} onClick={()=>setSelectedChar(c.id)}>
                  <img src={c.img} className="char-img" alt={c.name}/>
                  <div>{c.name}</div>
                </div>
              ))}
            </div>
            <div className="action-buttons">
              <button className="back-btn" onClick={() => setScreen('home')}>뒤로가기</button>
              <button onClick={handleStartGame}>게임 시작</button>
            </div>
          </div> 
        );

      case 'gameplay':
        const myCharacter = characters.find(c => c.id === selectedChar) || characters[0];
        return (
          <div className="game-screen-wrapper" style={{ position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '800px', margin: '0 auto 10px', color: '#fff', fontSize: '1.2rem' }}>
              <span>Chef: <b>{username}</b></span>
              <span style={{ color: timeLeft <= 5 ? '#ff4444' : '#FFD700', fontWeight: 'bold' }}>
                ⏰ {timeLeft}s
              </span>
              <span style={{ color: '#4CAF50', fontWeight: 'bold', fontSize: '1.5rem' }}>
                🍔 {score}
              </span>
            </div>

            <GameCanvas 
              selectedChar={myCharacter} 
              isPlaying={isPlaying} 
              onBurgerDelivered={handleBurgerDelivered}
              isMultiplayer={gameMode === 'multi'} 
              roomId={roomId}
              socketProp={socket}
            />

            {countDown > 0 && (
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '10rem', color: 'white', textShadow: '0 0 10px black' }}>
                {countDown}
              </div>
            )}
          </div>
        );

      case 'result':
        const amIVoted = socket && roomPlayers[socket.id]?.wantsRestart;

        return (
          <div className="game-screen">
            <h1 style={{ fontSize: '3rem', color: '#FFD700' }}>👨‍🍳 영업 종료!</h1>
            
            <div style={{ background: '#333', padding: '30px', borderRadius: '15px', marginTop: '10px', minWidth: '400px' }}>
              <h2>최종 스코어</h2>
              <p style={{ fontSize: '4rem', fontWeight: 'bold', margin: '10px 0', color: '#4CAF50' }}>
                🍔 {score}개
              </p>
              <p style={{color:'#ccc'}}>{username} 셰프님 수고하셨습니다!</p>
              
              <hr style={{ borderColor: '#555', margin: '20px 0' }} />

              {gameMode === 'multi' && (
                <div style={{ marginBottom: '20px' }}>
                   <h3>재도전 대기 중... ({resultTimeLeft}초)</h3>
                   <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '10px' }}>
                      {Object.values(roomPlayers).map((p, idx) => (
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
                   <p style={{fontSize:'0.8rem', color:'#aaa', marginTop:'5px'}}>
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
                  if (gameMode === 'multi' && socket) {
                     socket.emit('voteRestart'); 
                  } else {
                     setScreen('gameplay'); 
                  }
                }}>
                {gameMode === 'multi' 
                  ? (amIVoted ? '다시 하기 취소' : '다시 하기 투표') 
                  : '다시 하기'}
              </button>
              
              <button className="menu-button" onClick={handleGoHome}>
                홈으로
              </button>
            </div>
          </div>
        );

      default: return <div>Error: Unknown Screen</div>;
    }
  };

  return <div className="app-container">{renderScreen()}</div>;
}

export default App;