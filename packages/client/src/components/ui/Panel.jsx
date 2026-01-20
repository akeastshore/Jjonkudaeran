import React from 'react';

/**
 * 재사용 가능한 패널 컴포넌트
 * @param {string} title - 패널 제목
 * @param {string} className - 추가 CSS 클래스
 * @param {object} style - 인라인 스타일
 * @param {React.ReactNode} children - 패널 내용
 */
const Panel = ({ title, className = '', style = {}, children }) => {
  return (
    <div className={`lobby-panel ${className}`.trim()} style={style}>
      {title && <h3 className="lobby-panel-title">{title}</h3>}
      {children}
    </div>
  );
};

export default Panel;
