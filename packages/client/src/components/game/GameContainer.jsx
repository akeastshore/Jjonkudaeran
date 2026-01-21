// 게임 전체 레이아웃 컴포넌트
import GameCanvasView from './GameCanvasView';
const GameContainer = ({ canvasRef }) => {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      transform: 'scale(1.1)', // 게임 화면 확대 (1.15 -> 1.1로 미세 조정)
      transformOrigin: 'center center', // 중앙 기준 확대
      marginTop: '50px' // 상단 여백 (겹침 방지)
    }}>
      <GameCanvasView canvasRef={canvasRef} />
    </div>
  );
};

export default GameContainer;
