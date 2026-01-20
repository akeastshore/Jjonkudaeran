import React from 'react';
import { Button, PlayerListItem } from '../ui';

// 대기실 화면
const WaitingRoomScreen = ({ roomId, waitingInfo, socket, username }) => {
  // 방장은 members 배열의 첫 번째 사람
  const isHost = waitingInfo.members.length > 0 && waitingInfo.members[0] === username;
  const isFull = waitingInfo.current === waitingInfo.max;

  const handleStartPreparation = () => {
    if (socket && isFull) {
      socket.emit('startPreparation');
    }
  };

  return (
    <div className="waiting-page">
      <div className="waiting-wrap">
        <h1 className="waiting-title">⏳ 대기실</h1>
        
        <div className="waiting-panel">
          <div className="room-code">{roomId}</div>
          <p className="room-hint">친구에게 위 코드를 알려주세요!</p>

          <div className="waiting-divider"></div>

          <div className="room-count">
            현재 인원: <span className="current">{waitingInfo.current}</span> / <span className="max">{waitingInfo.max}</span>
          </div>

          <div className="player-list">
            {waitingInfo.members.map((mem, idx) => (
              <PlayerListItem
                key={idx}
                playerName={`👤 ${mem}`}
                isHost={idx === 0}
              />
            ))}
          </div>

          {isFull && isHost && (
            <Button
              variant="start-game"
              onClick={handleStartPreparation}
              style={{ marginTop: '14px' }}
            >
              🎮 게임 시작!
            </Button>
          )}

          {!isFull && (
            <div className="waiting-status">
              참가자를 기다리는 중...
            </div>
          )}

          {isFull && !isHost && (
            <div className="waiting-status">
              방장이 게임 준비를 시작할 때까지 대기 중...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WaitingRoomScreen;
