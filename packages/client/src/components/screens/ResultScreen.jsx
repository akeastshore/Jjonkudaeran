// 게임 결과 화면
import { useEffect, useState } from 'react';

const ResultScreen = ({
  score,
  username,
  gameMode,
  roomPlayers: roomPlayersFromProps,
  socket,
  resultTimeLeft,
  onRestart,
  onGoHome,
  selectedChar
}) => {
  // 로컬 상태로 roomPlayers 관리
  const [roomPlayers, setRoomPlayers] = useState(roomPlayersFromProps);

  const amIVoted = socket && roomPlayers[socket.id]?.wantsRestart;

  // roomPlayers props가 변경되면 로컬 상태도 업데이트
  useEffect(() => {
    setRoomPlayers(roomPlayersFromProps);
  }, [roomPlayersFromProps]);

  // ResultScreen에서 직접 roomUpdate 리스너 등록
  useEffect(() => {
    if (!socket || gameMode !== 'multi') return;

    const handleRoomUpdate = (playersData) => {
      setRoomPlayers(playersData);
    };

    socket.on('roomUpdate', handleRoomUpdate);

    return () => {
      socket.off('roomUpdate', handleRoomUpdate);
    };
  }, [socket, gameMode]);

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

        {/* 1. 두쫀쿠 이미지를 가장 위로 올림 (순서 변경) */}
        <div className="result-dujjonku">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="dujjonku-slot">
              {idx < dujjonkuCount ? (
                <img
                  src='/assets/ingredients/wrapped_dujjonku.png'
                  alt="두쫀쿠"
                  className="dujjonku-img"
                  style={{ width: '350px', height: '350px' }}
                />
              ) : (
                <div className="dujjonku-empty" />
              )}
            </div>
          ))}
        </div>

        {/* 2. "영업 종료!" 타이틀을 여기로 이동 (캐릭터 바로 위) */}
        <h1 className="result-title">영업 종료!</h1>

        {/* 3. 캐릭터 이미지 */}
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
                Object.values(roomPlayers).map((p, idx) => (
                  <div
                    key={idx}
                    className={`voting-player ${p.wantsRestart ? 'ready' : 'waiting'}`}
                  >
                    {p.nickname}
                  </div>
                ))
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