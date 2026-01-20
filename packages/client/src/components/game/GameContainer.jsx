// 게임 전체 레이아웃 컴포넌트
import GameCanvasView from './GameCanvasView';
const GameContainer = ({ canvasRef }) => {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center'
    }}>
      <GameCanvasView canvasRef={canvasRef} />
    </div>
  );
};

export default GameContainer;
