import React from 'react';

/**
 * 재사용 가능한 방 코드 표시 컴포넌트
 * @param {string} roomId - 방 코드
 * @param {string} label - 레이블 텍스트 (기본: 'Room')
 * @param {string} className - 추가 CSS 클래스
 */
const RoomCode = ({ roomId, label = 'Room', className = '' }) => {
  return (
    <div className={`lobby-room-code ${className}`.trim()}>
      {label} <span className="code">{roomId}</span>
    </div>
  );
};

export default RoomCode;
