// 게임 결과 화면
const ResultScreen = ({ 
  score, 
  username, 
  gameMode, 
  roomPlayers, 
  socket, 
  resultTimeLeft, 
  onRestart, 
  onGoHome 
}) => {
  const amIVoted = socket && roomPlayers[socket.id]?.wantsRestart;

  return (
    <div className="game-screen">
      <h1 style={{ fontSize: '3rem', color: '#FFD700' }}>👨‍🍳 영업 종료!</h1>

      <div style={{ 
        background: '#333', 
        padding: '30px', 
        borderRadius: '15px', 
        marginTop: '10px', 
        minWidth: '400px' 
      }}>
        <h2>최종 스코어</h2>
        <p style={{ 
          fontSize: '4rem', 
          fontWeight: 'bold', 
          margin: '10px 0', 
          color: '#4CAF50' 
        }}>
          🍔 {score}개
        </p>
        <p style={{ color: '#ccc' }}>{username} 셰프님 수고하셨습니다!</p>

        <hr style={{ borderColor: '#555', margin: '20px 0' }} />

        {/* 멀티플레이어 재도전 투표 */}
        {gameMode === 'multi' && (
          <div style={{ marginBottom: '20px' }}>
            <h3>재도전 대기 중... ({resultTimeLeft}초)</h3>
            <div style={{ 
              display: 'flex', 
              gap: '10px', 
              justifyContent: 'center', 
              marginTop: '10px' 
            }}>
              {Object.values(roomPlayers).map((p, idx) => (
                <div 
                  key={idx} 
                  style={{
                    padding: '10px 20px',
                    borderRadius: '20px',
                    background: p.wantsRestart ? '#4CAF50' : '#555',
                    color: 'white',
                    border: '2px solid white',
                    opacity: p.wantsRestart ? 1 : 0.5
                  }}
                >
                  {p.nickname} {p.wantsRestart ? '✅' : '...'}
                </div>
              ))}
            </div>
            <p style={{ fontSize: '0.8rem', color: '#aaa', marginTop: '5px' }}>
              * 전원이 동의해야 게임이 시작됩니다.
            </p>
          </div>
        )}
      </div>

      {/* 액션 버튼 */}
      <div className="menu-container" style={{ 
        marginTop: '20px', 
        flexDirection: 'row', 
        justifyContent: 'center' 
      }}>
        <button
          className="menu-button"
          style={{
            backgroundColor: amIVoted ? '#f44336' : '#2196F3',
            minWidth: '150px'
          }}
          onClick={onRestart}
        >
          {gameMode === 'multi'
            ? (amIVoted ? '다시 하기 취소' : '다시 하기 투표')
            : '다시 하기'}
        </button>

        <button className="menu-button" onClick={onGoHome}>
          홈으로
        </button>
      </div>
    </div>
  );
};

export default ResultScreen;
