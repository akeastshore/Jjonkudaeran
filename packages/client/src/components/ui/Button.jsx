import React from 'react';

/**
 * 재사용 가능한 버튼 컴포넌트
 * @param {string} variant - 버튼 스타일 ('primary', 'create', 'join', 'ready', 'start-game', 'cancel', 'back')
 * @param {function} onClick - 클릭 핸들러
 * @param {boolean} disabled - 비활성화 여부
 * @param {string} className - 추가 CSS 클래스
 * @param {object} style - 인라인 스타일
 * @param {React.ReactNode} children - 버튼 내용
 */
const Button = ({ 
  variant = 'primary', 
  onClick, 
  disabled = false, 
  className = '', 
  style = {},
  children 
}) => {
  const getVariantClass = () => {
    switch (variant) {
      case 'create':
        return 'mp-btn mp-btn-create';
      case 'join':
        return 'mp-btn mp-btn-join';
      case 'ready':
        return 'ready-btn';
      case 'start-game':
        return 'ready-btn start-game';
      case 'cancel':
        return 'ready-btn cancel';
      case 'back':
        return 'mp-back-btn';
      case 'char-action':
        return 'char-action-btn';
      default:
        return 'mp-btn';
    }
  };

  return (
    <button
      className={`${getVariantClass()} ${className}`.trim()}
      onClick={onClick}
      disabled={disabled}
      style={style}
    >
      {children}
    </button>
  );
};

export default Button;
