// 캔버스 렌더링 컴포넌트
import { MAP_WIDTH, MAP_HEIGHT } from '../../constants/gameConstants';

const GameCanvasView = ({ canvasRef }) => {
  return (
    <canvas 
      ref={canvasRef} 
      style={{ 
        border: '2px solid #333', 
        backgroundColor: '#A8C5B0' 
      }} 
      width={MAP_WIDTH}
      height={MAP_HEIGHT}
    />
  );
};

export default GameCanvasView;
