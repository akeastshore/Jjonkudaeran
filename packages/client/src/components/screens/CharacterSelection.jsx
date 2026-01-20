import { CHARACTERS } from '../../constants/characters';
import choiceBg from '../../assets/backgrounds/choice_bg.png';

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
      justifyContent: 'flex-start',
      alignItems: 'flex-start',
      paddingTop: '150px',
      paddingLeft: '30px',
      paddingRight: '350px',
      paddingBottom: '20px'
    }}>
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
              style={{
                transform: c.id === 2 ? 'scale(0.85)' : c.id === 3 ? 'translateY(20px)' : 'none'
              }}
            />
            <div>{c.name}</div>
          </div>
        ))}
      </div>
      <div className="action-buttons">
        <button className="back-btn" onClick={() => setScreen('home')}>뒤로가기</button>
        <button onClick={handleStartGame}>게임 시작</button>
      </div>
    </div>
  );
};

export default CharacterSelection;
