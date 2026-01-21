// 게임 전체 레이아웃 컴포넌트
import { useState, useEffect } from 'react';
import GameCanvasView from './GameCanvasView';
import { MAP_WIDTH, MAP_HEIGHT } from '../../constants/gameConstants';

const GameContainer = ({ canvasRef }) => {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      const margin = 40; // 기본 여백
      const headerHeight = 80; // 상단바 통계 공간 확보
      // 화면 너비/높이 대비 게임 화면 비율 계산 (최대 1.2배까지만 확대)
      const scaleX = (window.innerWidth - margin) / MAP_WIDTH;
      const scaleY = (window.innerHeight - margin - headerHeight) / MAP_HEIGHT;
      const newScale = Math.min(scaleX, scaleY, 1.2);
      setScale(Math.max(0.5, newScale)); // 최소 0.5배 보장
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // 초기 실행

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start', // 상단 정렬로 변경 (타이머와 간격 축소)
      width: '100%',
      height: '100%',
      flex: 1,
      overflow: 'hidden',
      paddingTop: '10px'
    }}>
      <div style={{
        transform: `scale(${scale})`,
        transformOrigin: 'center center',
        transition: 'transform 0.1s ease-out' // 부드러운 리사이징
      }}>
        <GameCanvasView canvasRef={canvasRef} />
      </div>
    </div>
  );
};

export default GameContainer;
