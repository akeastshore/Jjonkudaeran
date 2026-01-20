import React from 'react';
// 1. 이미지 파일을 가져옵니다.
import loginBg from '../assets/backgrounds/login_bg.png'; // 경로가 맞는지 확인하세요!

const Login = () => {
  // ... 기존 로그인 로직들 ...

  return (
    <div style={backgroundStyle}>
      {/* 여기에 기존 로그인 폼(박스)이 들어갑니다 */}
      <div className="login-box">
         <h1>쫀쿠 대란</h1>
         {/* ... input, button 등 ... */}
      </div>
    </div>
  );
};

// 2. 스타일 객체를 만듭니다. (CSS 파일에 넣어도 되지만, 배경 이미지는 여기가 편해요)
const backgroundStyle = {
  backgroundImage: `url(${loginBg})`, // 가져온 이미지를 배경으로 설정
  backgroundSize: 'cover',            // 화면을 꽉 채우도록 설정 (중요!)
  backgroundPosition: 'center',       // 캐릭터가 중앙에 잘 보이도록 설정
  backgroundRepeat: 'no-repeat',      // 이미지가 바둑판처럼 반복되지 않게 설정
  height: '100vh',                    // 화면 세로 길이를 꽉 채움
  width: '100vw',                     // 화면 가로 길이를 꽉 채움
  display: 'flex',                    // 로그인 박스를 정중앙에 놓기 위해
  justifyContent: 'center',           // 가로 중앙 정렬
  alignItems: 'center',               // 세로 중앙 정렬
};

export default Login;