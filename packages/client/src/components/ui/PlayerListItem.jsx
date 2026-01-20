import React from 'react';

/**
 * 재사용 가능한 플레이어 목록 아이템 컴포넌트
 * @param {string} playerName - 플레이어 이름
 * @param {string} avatarUrl - 아바타 이미지 URL (없으면 기본 아이콘 표시)
 * @param {boolean} isHost - 방장 여부
 * @param {boolean} isReady - 준비 완료 여부
 * @param {boolean} isSelected - 선택된 플레이어 (나) 여부
 * @param {string} className - 추가 CSS 클래스
 */
const PlayerListItem = ({ 
  playerName, 
  avatarUrl, 
  isHost = false, 
  isReady = false,
  isSelected = false,
  className = ''
}) => {
  return (
    <div className={`player-row ${isSelected ? 'selected' : ''} ${className}`.trim()}>
      <div className="player-left">
        <div className="player-avatar">
          {avatarUrl ? <img src={avatarUrl} alt="avatar" /> : '?'}
        </div>
        <span>
          {playerName}
          {isReady && <span style={{ color: '#E8C36A', marginLeft: '8px' }}>⚡</span>}
        </span>
      </div>
      {isHost && <span className="host-badge">방장</span>}
    </div>
  );
};

export default PlayerListItem;
