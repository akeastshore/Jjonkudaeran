// 게임 전체 레이아웃 컴포넌트
import GameCanvasView from './GameCanvasView';
import IngredientLegend from './IngredientLegend';

const GameContainer = ({ canvasRef }) => {
  return (
    <div style={{ 
      display: 'flex', 
      gap: '20px', 
      alignItems: 'flex-start', 
      justifyContent: 'center' 
    }}>
      <GameCanvasView canvasRef={canvasRef} />
      <IngredientLegend />
    </div>
  );
};

export default GameContainer;
