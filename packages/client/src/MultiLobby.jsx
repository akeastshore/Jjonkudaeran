// src/MultiLobby.jsx
import React, { useState, useEffect } from 'react';

const MultiLobby = ({ socket, roomId, characters, onGameStart }) => {
  const [players, setPlayers] = useState({});
  const [myCharId, setMyCharId] = useState(null);
  
  // ★ 타이머 상태 (15초)
  const [timeLeft, setTimeLeft] = useState(15); 

  useEffect(() => {
    if (!socket) return;

    socket.on('roomUpdate', (roomPlayers) => {
      setPlayers(roomPlayers);
      // 내 현재 선택 상태 동기화
      if (roomPlayers[socket.id]) {
        setMyCharId(roomPlayers[socket.id].charId);
      }
    });

    socket.on('gameStart', () => {
      console.log("게임 시작 신호 받음!");
      onGameStart(); // 모두 준비되면 게임 시작!
    });

    return () => {
      socket.off('roomUpdate');
      socket.off('gameStart');
    };
  }, [socket, onGameStart]);

  // ★ 15초 카운트다운 및 자동 시작 로직
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else {
      // 시간 0초 되면 자동 실행
      handleTimeOver();
    }
  }, [timeLeft]);

  const handleTimeOver = () => {
    if (players[socket.id]?.isReady) return; // 이미 준비했으면 패스

    console.log("시간 종료! 자동 준비합니다.");
    
    // 캐릭터 안 골랐으면 1번 캐릭터(전사)로 강제 선택
    let finalCharId = myCharId;
    if (!finalCharId) {
       finalCharId = characters[0].id;
       setMyCharId(finalCharId);
       socket.emit('selectCharacter', finalCharId);
    }

    // 서버 처리 시간 고려해 0.5초 뒤 준비 신호 발사
    setTimeout(() => {
        socket.emit('toggleReady');
    }, 500);
  };

  const selectChar = (charId) => {
    if (players[socket.id]?.isReady) return; 
    setMyCharId(charId);
    socket.emit('selectCharacter', charId);
  };

  const toggleReady = () => {
    if (!myCharId) {
        return alert("캐릭터를 먼저 선택해주세요!");
    }
    socket.emit('toggleReady');
  };

  return (
    <div className="game-screen">
      {/* 상단 정보 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '90%', margin: '0 auto' }}>
        <h2>Room: {roomId}</h2>
        <div style={{ 
          fontSize: '2rem', fontWeight: 'bold', 
          color: timeLeft <= 5 ? '#ff4444' : 'white',
          border: '2px solid white', padding: '5px 15px', borderRadius: '10px'
        }}>
          ⏱ {timeLeft}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', width: '90%', margin:'20px auto' }}>
        
        {/* 캐릭터 목록 */}
        <div style={{ flex: 2 }}>
          <div className="char-list" style={{ justifyContent: 'center' }}>
            {characters.map(c => (
              <div 
                key={c.id} 
                className={`char-card ${myCharId === c.id ? 'selected' : ''}`} 
                style={{ opacity: players[socket.id]?.isReady ? 0.5 : 1 }}
                onClick={() => selectChar(c.id)}
              >
                <img src={c.img} className="char-img" alt={c.name}/>
                <div>{c.name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 접속자 현황 */}
        <div style={{ flex: 1, background: '#444', padding: '20px', borderRadius: '15px', color:'white' }}>
          <h3>플레이어 대기실</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {Object.entries(players).map(([id, p]) => {
              const charInfo = characters.find(c => c.id === p.charId);
              const isMe = id === socket.id;

              return (
                <div key={id} style={{ 
                  background: p.isReady ? '#2E7D32' : (isMe ? '#1976D2' : '#666'), 
                  padding: '10px', borderRadius: '10px',
                  display: 'flex', alignItems: 'center', gap: '10px',
                  border: isMe ? '2px solid yellow' : '1px solid #555',
                  transition: 'background 0.3s'
                }}>
                  <div style={{ width: '40px', height: '40px', background: '#fff', borderRadius: '50%', overflow: 'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    {charInfo ? <img src={charInfo.img} style={{width:'100%'}}/> : '?'}
                  </div>
                  <div style={{ textAlign: 'left', flex: 1 }}>
                    <div style={{ fontWeight: 'bold', fontSize:'0.9rem' }}>
                        {p.nickname || (isMe ? '나' : '친구')} 
                        {p.isReady && <span style={{color:'yellow', marginLeft:'5px'}}>⚡READY</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button 
            className="menu-button" 
            style={{ 
                marginTop: '20px', width: '100%', 
                backgroundColor: players[socket.id]?.isReady ? '#f44336' : '#FF9800', 
                opacity: myCharId ? 1 : 0.5
            }}
            onClick={toggleReady}
          >
            {players[socket.id]?.isReady ? '준비 취소' : '준비 완료!'}
          </button>
          
          <div style={{marginTop:'10px', fontSize:'0.8rem', color:'#aaa'}}>
            * 모든 플레이어가 준비하면 게임이 시작됩니다.
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiLobby;