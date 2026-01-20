import React from 'react';

/**
 * 재사용 가능한 카운터 컴포넌트
 * @param {number} value - 현재 값
 * @param {function} onIncrement - 증가 핸들러
 * @param {function} onDecrement - 감소 핸들러
 * @param {number} min - 최소값
 * @param {number} max - 최대값
 * @param {object} style - 인라인 스타일
 */
const Counter = ({ 
  value, 
  onIncrement, 
  onDecrement, 
  min = 0, 
  max = Infinity,
  style = {}
}) => {
  const handleDecrement = () => {
    if (value > min && onDecrement) {
      onDecrement();
    }
  };

  const handleIncrement = () => {
    if (value < max && onIncrement) {
      onIncrement();
    }
  };

  return (
    <div className="mp-counter" style={style}>
      <button
        className="mp-counter-btn"
        onClick={handleDecrement}
        disabled={value <= min}
      >
        ◀
      </button>

      <span className="mp-count">{value}</span>

      <button
        className="mp-counter-btn"
        onClick={handleIncrement}
        disabled={value >= max}
      >
        ▶
      </button>
    </div>
  );
};

export default Counter;
