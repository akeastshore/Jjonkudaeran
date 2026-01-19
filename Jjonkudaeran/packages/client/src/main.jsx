import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { GoogleOAuthProvider } from '@react-oauth/google';
// ★ [NEW] GameContext 불러오기
import { GameProvider } from './context/GameContext.jsx'; 

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

ReactDOM.createRoot(document.getElementById('root')).render(
  //<React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      {/* ★ [NEW] App을 GameProvider로 감싸줍니다 */}
      <GameProvider>
        <App />
      </GameProvider>
    </GoogleOAuthProvider>
  //</React.StrictMode>,
)