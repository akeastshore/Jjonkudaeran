import React from 'react';

/**
 * 재사용 가능한 인풋 컴포넌트
 * @param {string} id - input ID
 * @param {string} placeholder - placeholder 텍스트
 * @param {string} className - 추가 CSS 클래스
 * @param {object} style - 인라인 스타일
 * @param {string} type - input type
 * @param {string} value - input value (controlled component)
 * @param {function} onChange - change 핸들러
 */
const Input = ({ 
  id, 
  placeholder = '', 
  className = '', 
  style = {},
  type = 'text',
  value,
  onChange
}) => {
  return (
    <input
      id={id}
      type={type}
      placeholder={placeholder}
      className={`mp-input ${className}`.trim()}
      style={style}
      value={value}
      onChange={onChange}
    />
  );
};

export default Input;
