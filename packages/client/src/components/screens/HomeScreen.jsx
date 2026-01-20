import React, { useState } from 'react';
import backgroundImage from '../../assets/background.png';
import buttonGreen from '../../assets/button/green.png';
import buttonOrange from '../../assets/button/orange.png';
import buttonBrown from '../../assets/button/brown.png';
import buttonDarkBrown from '../../assets/button/dark_borwn.png';
import TutorialModal from '../TutorialModal';
import '../../styles/HomeScreen.css';

const HomeScreen = ({ setScreen, showSettings, setShowSettings }) => {
  const [showTutorial, setShowTutorial] = useState(false);
  return (
    <div className="game-screen" style={{
      backgroundImage: `url(${backgroundImage})`,
      backgroundSize: '100% 100%',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      width: '100%',
      height: '100%',
      margin: 0,
      padding: 0,
      position: 'absolute',
      top: 0,
      left: 0,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      alignItems: 'center',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: '100px',
        left: '170px',
        display: 'flex',
        gap: '15px',
        zIndex: 10
      }}>
        {/* 싱글 플레이 버튼 */}
        <button
          className="image-button"
          onClick={() => setScreen('single')}
          style={{
            width: '220px',
            height: '100px',
            background: 'none',
            backgroundImage: `url(${buttonGreen})`,
            backgroundSize: '100% 100%',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            color: '#FFF',
            border: 'none',
            outline: 'none',
            padding: 0,
            margin: 0,
            marginTop: '-1px',
            marginLeft: '23px',
            cursor: 'pointer',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            textShadow: '2px 2px 3px rgba(0,0,0,0.7)',
            transition: 'all 0.2s',
            letterSpacing: '1px',
            WebkitAppearance: 'none',
            MozAppearance: 'none',
            appearance: 'none',
            transform: 'rotate(1deg)'
          }}
          onMouseEnter={(e) => e.target.style.transform = 'rotate(1deg) scale(1.05)'}
          onMouseLeave={(e) => e.target.style.transform = 'rotate(1deg)'}
        >
          싱글 플레이
        </button>

        {/* 멀티 플레이 버튼 */}
        <button
          className="image-button"
          onClick={() => setScreen('lobby')}
          style={{
            width: '220px',
            height: '100px',
            background: 'none',
            backgroundImage: `url(${buttonOrange})`,
            backgroundSize: '100% 100%',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            color: '#FFF',
            border: 'none',
            outline: 'none',
            padding: 0,
            margin: 0,
            marginTop: '9px',
            marginLeft: '5px',
            cursor: 'pointer',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            textShadow: '2px 2px 3px rgba(0,0,0,0.7)',
            transition: 'all 0.2s',
            letterSpacing: '1px',
            WebkitAppearance: 'none',
            MozAppearance: 'none',
            appearance: 'none',
            transform: 'rotate(1deg)'
          }}
          onMouseEnter={(e) => e.target.style.transform = 'rotate(1deg) scale(1.05)'}
          onMouseLeave={(e) => e.target.style.transform = 'rotate(1deg)'}
        >
          멀티 플레이
        </button>

        {/* 튜토리얼 버튼 */}
        <button
          className="image-button"
          onClick={() => setShowTutorial(true)}
          style={{
            width: '200px',
            height: '90px',
            background: 'none',
            backgroundImage: `url(${buttonBrown})`,
            backgroundSize: '100% 100%',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            color: '#FFF',
            border: 'none',
            outline: 'none',
            padding: 0,
            margin: 0,
            marginTop: '24px',
            marginLeft: '5px',
            cursor: 'pointer',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            textShadow: '2px 2px 3px rgba(0,0,0,0.7)',
            transition: 'all 0.2s',
            letterSpacing: '1px',
            WebkitAppearance: 'none',
            MozAppearance: 'none',
            appearance: 'none',
            transform: 'rotate(0.3deg)'
          }}
          onMouseEnter={(e) => e.target.style.transform = 'rotate(0.3deg) scale(1.05)'}
          onMouseLeave={(e) => e.target.style.transform = 'rotate(0.3deg)'}
        >
          튜토리얼
        </button>

        {/* 설정 버튼 + 패널 */}
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <button
            className="image-button"
            onClick={() => setShowSettings(!showSettings)}
            style={{
              width: '195px',
              height: '87px',
              background: 'none',
              backgroundImage: `url(${buttonDarkBrown})`,
              backgroundSize: '100% 100%',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
              color: '#FFF',
              border: 'none',
              outline: 'none',
              padding: 0,
              margin: 0,
              marginTop: '33px',
              marginLeft: '-7px',
              cursor: 'pointer',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              textShadow: '2px 2px 3px rgba(0,0,0,0.7)',
              transition: 'all 0.2s',
              letterSpacing: '1px',
              WebkitAppearance: 'none',
              MozAppearance: 'none',
              appearance: 'none',
              transform: 'rotate(0.6deg)'
            }}
            onMouseEnter={(e) => e.target.style.transform = 'rotate(0.6deg) scale(1.05)'}
            onMouseLeave={(e) => e.target.style.transform = 'rotate(0.6deg)'}
          >
            설정
          </button>

          {showSettings && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: '28px',
              marginTop: '-25px',
              background: '#E8DCC4',
              padding: '0',
              borderRadius: '0',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              zIndex: 100,
              width: '130px',
              height: 'auto',
              transform: 'rotate(1deg)'
            }}>
              <div
                onClick={() => {
                  setShowSettings(false);
                  setScreen('login');
                }}
                style={{
                  width: '130px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#8B4513',
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  borderRadius: '0'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(139, 69, 19, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'transparent';
                }}
              >
                로그아웃
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 튜토리얼 모달 */}
      <TutorialModal 
        isOpen={showTutorial} 
        onClose={() => setShowTutorial(false)} 
      />
    </div>
  );
};

export default HomeScreen;
