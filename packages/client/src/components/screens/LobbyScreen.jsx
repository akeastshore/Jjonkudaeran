import React from 'react';
import { Button, Card, Counter, Input } from '../ui';

// 멀티플레이 로비 화면 - 방 만들기/참가하기
const LobbyScreen = ({ 
  lobbyCapacity, 
  setLobbyCapacity, 
  onCreateRoom, 
  onJoinRoom, 
  onBack 
}) => {
  const handleJoinRoom = () => {
    const code = document.getElementById('joinCode').value.toUpperCase();
    onJoinRoom(code);
  };

  return (
    <div className="multiplayer-page">
      <div className="mp-wrap">
        <h1 className="mp-title">멀티플레이</h1>
        
        <div className="mp-cards">
          {/* 방 만들기 */}
          <Card>
            <h2>방 만들기</h2>
            <p>인원 수 설정</p>

            <Counter
              value={lobbyCapacity}
              min={2}
              max={4}
              onIncrement={() => setLobbyCapacity(prev => Math.min(4, prev + 1))}
              onDecrement={() => setLobbyCapacity(prev => Math.max(2, prev - 1))}
              style={{ marginTop: '25px' }}
            />

            <Button
              variant="create"
              onClick={() => onCreateRoom(lobbyCapacity)}
            >
              방 만들기
            </Button>
          </Card>

          {/* 방 참가하기 */}
          <Card>
            <h2>참가하기</h2>
            <p>초대 코드를 입력하세요</p>
            
            <Input
              id="joinCode"
              placeholder="CODE"
              style={{ marginTop: '25px' }}
            />
            
            <Button
              variant="join"
              onClick={handleJoinRoom}
            >
              입장하기
            </Button>
          </Card>
        </div>

        <div className="mp-back">
          <button onClick={onBack}>뒤로가기</button>
        </div>
      </div>
    </div>
  );
};

export default LobbyScreen;
