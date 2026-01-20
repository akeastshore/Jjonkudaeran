// src/MultiLobby.jsx
import React, { useState, useEffect } from 'react';
import { 
  Button, 
  RoomCode, 
  Timer, 
  Panel, 
  CharacterItem, 
  PlayerListItem 
} from './components/ui';

const MultiLobby = ({ socket, roomId, characters, onGameStart, setSelectedChar }) => {
  const [players, setPlayers] = useState({});
  const [myCharId, setMyCharId] = useState(null);
  
  // ★ 타이머 상태 (120초 = 2분)
  const [timeLeft, setTimeLeft] = useState(120); 

  useEffect(() => {
    if (!socket) return;

    // 처음 로드될 때 플레이어 정보 요청
    socket.emit('syncGame');

    socket.on('roomUpdate', (roomPlayers) => {
      setPlayers(roomPlayers);
      // 내 현재 선택 상태 동기화
      if (roomPlayers[socket.id]) {
        const charId = roomPlayers[socket.id].charId;
        setMyCharId(charId);
        if (charId) {
          setSelectedChar(charId); // gameState에도 동기화
        }
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

  // ★ 2분 카운트다운 (서버에서 자동 시작 처리)
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
    // 시간이 0이 되면 서버에서 자동으로 게임을 시작시킴
  }, [timeLeft]);

  const selectChar = (charId) => {
    if (players[socket.id]?.isReady) return; 
    setMyCharId(charId);
    setSelectedChar(charId); // gameState에도 저장
    socket.emit('selectCharacter', charId);
  };

  const toggleReady = () => {
    if (!myCharId) {
        return alert("캐릭터를 먼저 선택해주세요!");
    }
    socket.emit('toggleReady');
  };

  const startGame = () => {
    socket.emit('startGame');
  };

  // 모든 플레이어가 준비되었는지 확인
  const allReady = Object.values(players).every(p => p.isReady);
  const playerIds = Object.keys(players);
  const isHost = playerIds.length > 0 && socket.id === playerIds[0];

  return (
    <div className="lobby-page">
      <div className="lobby-wrap">
        {/* 상단 바 */}
        <div className="lobby-top">
          <RoomCode roomId={roomId} />
          <Timer timeLeft={timeLeft} warningThreshold={5} />
        </div>

        <div className="lobby-main">
          {/* 캐릭터 영역 */}
          <div className="char-grid">
            {characters.map(c => (
              <CharacterItem
                key={c.id}
                character={c}
                isSelected={myCharId === c.id}
                isDimmed={myCharId && myCharId !== c.id}
                isReady={players[socket.id]?.isReady}
                onClick={selectChar}
              />
            ))}
          </div>

          {/* 오른쪽 패널 */}
          <Panel title="플레이어 대기실">
            <div className="player-list">
              {Object.entries(players).length > 0 ? (
                Object.entries(players).map(([id, p]) => {
                  const charInfo = characters.find(c => c.id === p.charId);
                  const isMe = id === socket.id;

                  return (
                    <PlayerListItem
                      key={id}
                      playerName={p.nickname || (isMe ? '나' : '친구')}
                      avatarUrl={charInfo?.img}
                      isHost={id === Object.keys(players)[0]}
                      isReady={p.isReady}
                      isSelected={isMe}
                    />
                  );
                })
              ) : (
                <div className="waiting-status" style={{ marginTop: '20px' }}>
                  플레이어 정보를 불러오는 중...
                </div>
              )}
            </div>

            {allReady && isHost ? (
              <Button variant="start-game" onClick={startGame}>
                🎮 게임 시작!
              </Button>
            ) : allReady && !isHost ? (
              <Button 
                variant="ready" 
                disabled={true}
                style={{ opacity: 0.5, cursor: 'not-allowed' }}
              >
                준비 완료
              </Button>
            ) : (
              <Button 
                variant={players[socket.id]?.isReady ? 'cancel' : 'ready'}
                disabled={!myCharId && !players[socket.id]?.isReady}
                onClick={toggleReady}
              >
                {players[socket.id]?.isReady ? '준비 취소' : '준비 완료!'}
              </Button>
            )}
            
            <div className="panel-hint">
              {!myCharId
                ? '* 캐릭터를 선택하세요!'
                : allReady && isHost
                  ? '* 게임을 시작하세요!'
                  : allReady && !isHost
                    ? '방장이 게임을 시작할 때까지 대기 중...'
                    : '* 모든 플레이어가 준비하면 방장이 게임을 시작합니다.'}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
};

export default MultiLobby;
