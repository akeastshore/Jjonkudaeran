import React from 'react';
import { CHARACTERS } from '../../constants/characters';
import choiceBg from '../../assets/backgrounds/choice_bg.png';
import { Button } from '../ui';

const CharacterSelection = ({ selectedChar, setSelectedChar, setScreen, handleStartGame }) => {
  return (
    <div className="char-select-screen" style={{
      backgroundImage: `url(${choiceBg})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center bottom',
      backgroundRepeat: 'no-repeat',
      width: '100%',
      height: '100%',
      position: 'absolute',
      top: 0,
      left: 0,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: '0',
      paddingBottom: '0'
    }}>
      <h1 className="mp-title" style={{
        marginBottom: '40px',
        color: '#FFFFFF',
        fontSize: '48px',
        textShadow: '0 4px 12px rgba(0,0,0,0.6)'
      }}>캐릭터 선택</h1>
      <div className="char-list">
        {CHARACTERS.map(c => (
          <div
            key={c.id}
            className={`char-card ${selectedChar === c.id ? 'selected' : ''}`}
            onClick={() => setSelectedChar(c.id)}
          >
            <img
              src={c.img}
              className="char-img"
              alt={c.name}
            />
            <div style={{ fontWeight: 'bold' }}>{c.name}</div>
          </div>
        ))}
      </div>
      <div className="action-buttons" style={{
        width: '100%',
        maxWidth: '1400px',
        justifyContent: 'space-between',
        padding: '0',
        marginTop: '30px',
        transform: 'translateY(-30px)'
      }}>
        <Button
          variant="char-action"
          onClick={() => setScreen('home')}
          style={{ width: '38%', height: '64px', fontSize: '24px' }}
        >
          뒤로가기
        </Button>
        <Button
          variant="char-action"
          onClick={handleStartGame}
          style={{ width: '38%', height: '64px', fontSize: '24px' }}
        >
          게임 시작
        </Button>
      </div>
    </div>
  );
};

export default CharacterSelection;
