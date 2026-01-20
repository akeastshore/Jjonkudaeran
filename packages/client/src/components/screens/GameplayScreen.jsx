// 게임플레이 화면
import GameCanvas from '../../GameCanvas';
import { INGREDIENT_IMAGES } from '../../constants/gameConstants';

const GameplayScreen = ({
  username,
  timeLeft,
  score,
  selectedChar,
  isPlaying,
  onBurgerDelivered,
  isMultiplayer,
  roomId,
  socket,
  countDown
}) => {
  return (
    <div className="game-screen-wrapper" style={{ position: 'relative' }}>
      {/* 상단 정보 바 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        width: '800px',
        margin: '0 auto 10px',
        color: '#fff',
        fontSize: '1.2rem'
      }}>
        <span>Chef: <b>{username}</b></span>
        <span style={{
          color: timeLeft <= 5 ? '#ff4444' : '#FFD700',
          fontWeight: 'bold'
        }}>
          ⏰ {timeLeft}s
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img
            src={INGREDIENT_IMAGES.packagedCookie}
            alt="score"
            style={{ width: '40px', height: '40px', objectFit: 'contain' }}
          />
          <span style={{
            color: '#4CAF50',
            fontWeight: 'bold',
            fontSize: '1.5rem'
          }}>
            {score}
          </span>
        </div>
      </div>

      {/* 게임 캔버스 */}
      <GameCanvas
        selectedChar={selectedChar}
        isPlaying={isPlaying}
        onBurgerDelivered={onBurgerDelivered}
        isMultiplayer={isMultiplayer}
        roomId={roomId}
        socketProp={socket}
      />

      {/* 카운트다운 */}
      {countDown > 0 && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '10rem',
          color: 'white',
          textShadow: '0 0 10px black'
        }}>
          {countDown}
        </div>
      )}
    </div>
  );
};

export default GameplayScreen;
