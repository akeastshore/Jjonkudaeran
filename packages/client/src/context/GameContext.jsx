// src/context/GameContext.jsx
import React, { createContext, useContext, useRef } from 'react';
import { io } from 'socket.io-client';

const GameContext = createContext();

export const GameProvider = ({ children }) => {
  const socketRef = useRef(null);

  // ✅ 환경에 따라 서버 주소 자동 결정 (가장 중요!)
  const getServerUrl = () => {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;

    if (hostname === "localhost" || hostname === "127.0.0.1") {
      // 1. 로컬 개발 환경: 백엔드 포트(3001)로 직접 접속
      return "http://localhost:2567";
    } else {
      // 2. 배포 환경 (KCLOUD 등): 80 포트(Nginx)로 접속 -> Nginx가 내부 3001(또는 2567)로 토스
      // 포트 번호 없이 도메인/IP만 씁니다.
      return `${protocol}//${hostname}`;
    }
  };

  // 소켓 연결 함수
  const connectSocket = () => {
    // 이미 연결된 소켓이 있다면 재사용 (또는 끊고 재연결 로직 선택 가능)
    if (socketRef.current && socketRef.current.connected) {
      return socketRef.current;
    }

    const url = getServerUrl();
    console.log(`🔌 소켓 연결 시도: ${url}`);

    const newSocket = io(url, {
      transports: ['websocket'], // Nginx 프록시 환경에서 websocket 모드 권장
      withCredentials: true,     // 세션 쿠키 전달용
    });

    socketRef.current = newSocket;
    return newSocket;
  };

  // 소켓 연결 해제 함수
  const disconnectSocket = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  };

  return (
    <GameContext.Provider value={{ connectSocket, disconnectSocket, getServerUrl }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGameContext = () => useContext(GameContext);