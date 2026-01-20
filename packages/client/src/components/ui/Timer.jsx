import React from 'react';

/**
 * 재사용 가능한 타이머 컴포넌트
 * @param {number} timeLeft - 남은 시간 (초)
 * @param {number} warningThreshold - 경고 표시 기준 시간 (초, 기본: 5)
 * @param {string} className - 추가 CSS 클래스
 */
const Timer = ({ timeLeft, warningThreshold = 5, className = '' }) => {
  return (
    <div className={`timer-pill ${className}`.trim()}>
      <span>⏱</span>
      <span className={`num ${timeLeft <= warningThreshold ? 'warning' : ''}`}>
        {timeLeft}
      </span>
    </div>
  );
};

export default Timer;
