import loginBg from '../../assets/backgrounds/login_bg.png';
import '../../styles/LoginScreen.css';

const LoginScreen = ({ username, setUsername, setScreen, handleGoogleLogin }) => {
  const handleLogin = () => {
    if (username.trim()) {
      setScreen('home');
    } else {
      alert('닉네임을 입력해주세요!');
    }
  };

  return (
    <div className="login-screen" style={{
      backgroundImage: `url(${loginBg})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      height: '100vh',
      width: '100vw',
      position: 'fixed',
      top: 0,
      left: 0,
      margin: 0,
      zIndex: 1,
      display: 'flex',
      justifyContent: 'flex-end',
      alignItems: 'center',
      paddingRight: '5%',
      boxSizing: 'border-box'
    }}>
      <div style={{
        backgroundColor: 'rgba(248, 235, 215, 0.6)',
        backdropFilter: 'blur(0.5px)',
        padding: '0px 50px 50px 50px',
        border: '2px solid rgba(255, 255, 255, 0.4)',
        borderRadius: '30px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        textAlign: 'center',
        position: 'relative',
        zIndex: 10,
        maxWidth: '500px',
        width: '100%'
      }}>
        <h1 style={{
          fontFamily: "'yangjae_inital', serif",
          fontSize: '120px',
          color: '#694c43',
          marginBottom: '30px',
          fontWeight: '500'
        }}>
          쫀쿠대란
        </h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input
            type="text"
            placeholder="닉네임을 입력하세요"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && username.trim()) setScreen('home');
            }}
            style={{
              padding: '15px',
              fontSize: '16px',
              borderRadius: '12px',
              border: '2px solid #ddd',
              outline: 'none',
              width: '100%',
              boxSizing: 'border-box'
            }}
          />

          <button
            onClick={handleLogin}
            style={{
              padding: '15px',
              fontSize: '20px',
              cursor: 'pointer',
              backgroundColor: '#8BC34A',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontFamily: "'궁서', 'Gungsuh', serif",
              fontWeight: 'bold',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              transition: 'transform 0.2s'
            }}
            onMouseOver={(e) => e.target.style.transform = 'scale(1.02)'}
            onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
          >
            게임 시작
          </button>
        </div>

        <div style={{ margin: '20px 0', color: '#888', fontSize: '14px' }}>또는</div>

        <button
          onClick={handleGoogleLogin}
          style={{
            width: '100%',
            padding: '15px',
            fontSize: '16px',
            fontFamily: "'Song Myung', serif",
            cursor: 'pointer',
            backgroundColor: '#fff',
            color: '#555',
            border: '1px solid #ddd',
            borderRadius: '12px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '10px',
            fontWeight: '600'
          }}
        >
          구글 계정으로 개시
        </button>
      </div>
    </div>
  );
};

export default LoginScreen;
