// 멀티플레이 로비 화면 - 방 만들기/참가하기
const LobbyScreen = ({ 
  lobbyCapacity, 
  setLobbyCapacity, 
  onCreateRoom, 
  onJoinRoom, 
  onBack 
}) => {
  const handleJoinRoom = () => {
    const code = document.getElementById('joinCode').value.toUpperCase();
    onJoinRoom(code);
  };

  return (
    <div className="game-screen">
      <h2>멀티플레이</h2>
      <div style={{ 
        display: 'flex', 
        gap: '20px', 
        justifyContent: 'center', 
        alignItems: 'flex-start' 
      }}>
        {/* 방 만들기 */}
        <div style={{ 
          background: '#444', 
          padding: '30px', 
          borderRadius: '15px', 
          width: '250px' 
        }}>
          <h3>방 만들기</h3>
          <p style={{ marginBottom: '20px' }}>인원 수 설정</p>

          <div style={{
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '20px',
            marginBottom: '20px', 
            background: '#333', 
            padding: '10px', 
            borderRadius: '10px'
          }}>
            <button
              className="menu-button"
              style={{ 
                padding: '5px 15px', 
                fontSize: '1.2rem', 
                background: '#666' 
              }}
              onClick={() => setLobbyCapacity(prev => Math.max(2, prev - 1))}
            >
              ◀
            </button>

            <span style={{ 
              fontSize: '2rem', 
              fontWeight: 'bold', 
              color: '#FFD700', 
              minWidth: '30px' 
            }}>
              {lobbyCapacity}
            </span>

            <button
              className="menu-button"
              style={{ 
                padding: '5px 15px', 
                fontSize: '1.2rem', 
                background: '#666' 
              }}
              onClick={() => setLobbyCapacity(prev => Math.min(4, prev + 1))}
            >
              ▶
            </button>
          </div>

          <button
            className="menu-button"
            style={{ width: '100%', background: '#4CAF50' }}
            onClick={() => onCreateRoom(lobbyCapacity)}
          >
            방 만들기
          </button>
        </div>

        {/* 방 참가하기 */}
        <div style={{ 
          background: '#555', 
          padding: '30px', 
          borderRadius: '15px', 
          width: '250px' 
        }}>
          <h3>방 참가하기</h3>
          <p style={{ marginBottom: '20px' }}>초대 코드를 입력하세요</p>
          <input 
            id="joinCode" 
            placeholder="CODE" 
            style={{ 
              padding: '15px', 
              width: '100%', 
              marginBottom: '20px', 
              fontSize: '1.2rem', 
              textAlign: 'center', 
              textTransform: 'uppercase' 
            }} 
          />
          <button 
            className="menu-button" 
            style={{ backgroundColor: '#2196F3', width: '100%' }}
            onClick={handleJoinRoom}
          >
            입장하기
          </button>
        </div>
      </div>
      <button className="back-btn" onClick={onBack}>뒤로가기</button>
    </div>
  );
};

export default LobbyScreen;
