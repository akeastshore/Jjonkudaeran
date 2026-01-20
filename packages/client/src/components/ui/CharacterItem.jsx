import React from 'react';

/**
 * 재사용 가능한 캐릭터 선택 아이템 컴포넌트
 * @param {object} character - 캐릭터 정보 { id, name, img }
 * @param {boolean} isSelected - 선택된 캐릭터 여부
 * @param {boolean} isDimmed - 다른 캐릭터가 선택되어 흐려짐 여부
 * @param {boolean} isReady - 준비 완료 상태 (선택 불가)
 * @param {function} onClick - 클릭 핸들러
 * @param {string} className - 추가 CSS 클래스
 */
const CharacterItem = ({ 
  character, 
  isSelected = false, 
  isDimmed = false, 
  isReady = false,
  onClick,
  className = ''
}) => {
  const handleClick = () => {
    if (!isReady && onClick) {
      onClick(character.id);
    }
  };

  return (
    <div
      className={`char-item ${isSelected ? 'selected' : ''} ${isDimmed ? 'dimmed' : ''} ${className}`.trim()}
      style={{ 
        opacity: isReady ? 0.5 : 1, 
        pointerEvents: isReady ? 'none' : 'auto' 
      }}
      onClick={handleClick}
    >
      <img src={character.img} alt={character.name} />
      <div className="name" style={{ fontWeight: 'bold' }}>
        {character.name}
      </div>
    </div>
  );
};

export default CharacterItem;
