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
  // 두쫀쿠 개수 계산 (1개: 하, 2개: 중, 3개: 상)
  // const playerCount = gameMode === 'multi' ? Object.keys(roomPlayers).length : 1; (Already declared above)
  let dujjonkuCount = 1; // 기본 1개부터 시작 (이하 조건 때문)

  if (playerCount === 1) {
    if (score <= 2) dujjonkuCount = 1;
    else if (score === 3) dujjonkuCount = 2;
    else if (score >= 4) dujjonkuCount = 3;
  } else if (playerCount === 2) {
    if (score <= 4) dujjonkuCount = 1;
    else if (score === 5) dujjonkuCount = 2;
    else if (score >= 6) dujjonkuCount = 3;
  } else if (playerCount === 3) {
    if (score <= 5) dujjonkuCount = 1;
    else if (score === 6) dujjonkuCount = 2;
    else if (score >= 7) dujjonkuCount = 3;
  } else if (playerCount >= 4) {
    if (score <= 6) dujjonkuCount = 1;
    else if (score === 7) dujjonkuCount = 2;
    else if (score >= 8) dujjonkuCount = 3;
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
