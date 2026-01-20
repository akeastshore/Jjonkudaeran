// 게임 결과 화면
import { useEffect } from 'react';

const ResultScreen = ({ 
  score, 
  username, 
  gameMode, 
  roomPlayers, 
  socket, 
  resultTimeLeft, 
  onRestart, 
  onGoHome,
  selectedChar
}) => {
  const amIVoted = socket && roomPlayers[socket.id]?.wantsRestart;

  // 디버깅: roomPlayers 변경 감지
  useEffect(() => {
    console.log('=== ResultScreen roomPlayers 업데이트 ===');
    console.log('전체 roomPlayers:', roomPlayers);
    console.log('socket.id:', socket?.id);
    console.log('내 정보:', roomPlayers[socket?.id]);
    console.log('내가 투표했나?:', amIVoted);
  }, [roomPlayers, socket?.id, amIVoted]);

  // 두쫀쿠 개수 계산
  const playerCount = gameMode === 'multi' ? Object.keys(roomPlayers).length : 1;
  const baseScore = playerCount * 2;
  let dujjonkuCount = 0;
  
  if (score >= baseScore) {
    dujjonkuCount = Math.min(3, score - baseScore + 1);
  }

  return (
    <div className="result-screen">
      <div className="result-container">
        <h1 className="result-title">영업 종료!</h1>
        
        {/* 두쫀쿠 이미지 슬롯 */}
        <div className="result-dujjonku">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="dujjonku-slot">
              {idx < dujjonkuCount ? (
                <img 
                  src="/assets/ingredients/dujjonku_fianl.png" 
                  alt="두쫀쿠"
                  className="dujjonku-img"
                />
              ) : (
                <div className="dujjonku-empty" />
              )}
            </div>
          ))}
        </div>
        
        {/* 왼쪽: 캐릭터 */}
        <div className="result-character">
          {selectedChar && (
            <img 
              src={selectedChar.imgFront} 
              alt={selectedChar.name}
              className="result-char-img"
            />
          )}
        </div>

        {/* 멀티플레이어 재도전 투표 */}
        {gameMode === 'multi' && (
          <div className="result-voting">
            <h3 className="voting-title">재도전 대기중</h3>
            <div className="voting-players">
              {Object.keys(roomPlayers).length === 0 ? (
                <p>플레이어 정보 로딩 중...</p>
              ) : (
                Object.values(roomPlayers).map((p, idx) => {
                  console.log(`🎨 [렌더링] ${p.nickname}: wantsRestart=${p.wantsRestart}`);
                  return (
                    <div 
                      key={idx} 
                      className={`voting-player ${p.wantsRestart ? 'ready' : 'waiting'}`}
                    >
                      {p.nickname} {p.wantsRestart ? '✅' : ''}
                    </div>
                  );
                })
              )}
            </div>
            <p className="voting-hint">* 전원이 동의해야 게임이 시작됩니다.</p>
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="result-actions">
          <button
            className={`result-btn ${amIVoted ? 'btn-cancel' : 'btn-restart'}`}
            onClick={onRestart}
          >
            {gameMode === 'multi'
              ? (amIVoted ? '다시 하기 취소' : '다시 하러가기')
              : '다시 하기'}
          </button>

          <button className="result-btn btn-home" onClick={onGoHome}>
            홈으로
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultScreen;
