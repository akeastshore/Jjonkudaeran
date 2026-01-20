// 인증 관리 훅
import { useEffect, useCallback } from 'react';

export const useAuth = (getServerUrl, gameState) => {
  const handleGoogleLogin = useCallback(() => {
    const backendUrl = `${getServerUrl()}/auth/google?popup=true`;
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      backendUrl,
      "google_login_popup",
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`
    );

    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      alert("팝업 차단이 감지되었습니다. 팝업을 허용해주세요!");
    }
  }, [getServerUrl]);

  // Google Login Success Handler
  useEffect(() => {
    const handleMessage = async (event) => {
      if (event.data.type !== 'LOGIN_SUCCESS') return;
      console.log("✅ 팝업에서 로그인 성공 신호를 받았습니다!");

      try {
        const res = await fetch(`${getServerUrl()}/api/me`, {
          method: 'GET',
          credentials: 'include',
        });

        if (res.ok) {
          const userData = await res.json();
          console.log("👤 내 정보:", userData);
          if (userData) {
            gameState.setUsername(userData.name || userData.displayName);
            gameState.setScreen('home');
          }
        }
      } catch (err) {
        console.error("❌ 내 정보 가져오기 실패:", err);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [getServerUrl, gameState]);

  return { handleGoogleLogin };
};
