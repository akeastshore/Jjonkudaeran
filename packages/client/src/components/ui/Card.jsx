import React from 'react';

/**
 * 재사용 가능한 카드 컴포넌트
 * @param {string} className - 추가 CSS 클래스
 * @param {object} style - 인라인 스타일
 * @param {React.ReactNode} children - 카드 내용
 */
const Card = ({ className = '', style = {}, children }) => {
  return (
    <div className={`mp-card ${className}`.trim()} style={style}>
      {children}
    </div>
  );
};

export default Card;
