// 대기실 화면
const WaitingRoomScreen = ({ roomId, waitingInfo }) => {
  return (
    <div className="game-screen">
      <h1>⏳ 대기실</h1>
      <div style={{ 
        background: '#222', 
        padding: '40px', 
        borderRadius: '20px', 
        border: '2px solid #555' 
      }}>
        <h2 style={{ 
          color: '#FFD700', 
          fontSize: '3rem', 
          letterSpacing: '5px' 
        }}>
          {roomId}
        </h2>
        <p style={{ color: '#aaa' }}>친구에게 위 코드를 알려주세요!</p>

        <hr style={{ borderColor: '#444', margin: '20px 0' }} />

        <div style={{ fontSize: '1.5rem', marginBottom: '20px' }}>
          현재 인원: <b style={{ color: '#4CAF50' }}>{waitingInfo.current}</b> / {waitingInfo.max}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {waitingInfo.members.map((mem, idx) => (
            <div 
              key={idx} 
              style={{ 
                background: '#444', 
                padding: '10px', 
                borderRadius: '5px' 
              }}
            >
              👤 {mem} {idx === 0 && '👑(방장)'}
            </div>
          ))}
        </div>

        {waitingInfo.current < waitingInfo.max && (
          <div 
            className="loading-dots" 
            style={{ marginTop: '30px', color: '#888' }}
          >
            참가자를 기다리는 중...
          </div>
        )}
      </div>
    </div>
  );
};

export default WaitingRoomScreen;
