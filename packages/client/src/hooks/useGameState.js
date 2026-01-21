import { useState } from 'react';

export const useGameState = () => {
  const [username, setUsername] = useState('');
  const [screen, setScreen] = useState('login');
  const [showSettings, setShowSettings] = useState(false);
  const [selectedChar, setSelectedChar] = useState(null);
  const [countDown, setCountDown] = useState(3);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(3);
  const [score, setScore] = useState(0);
  const [resultTimeLeft, setResultTimeLeft] = useState(10);
  const [gameStartTime, setGameStartTime] = useState(null);

  const resetGameState = () => {
    setCountDown(3);
    setIsPlaying(false);
    setTimeLeft(3);
    setScore(0);
    setGameStartTime(null);
  };

  return {
    username,
    setUsername,
    screen,
    setScreen,
    showSettings,
    setShowSettings,
    selectedChar,
    setSelectedChar,
    countDown,
    setCountDown,
    isPlaying,
    setIsPlaying,
    timeLeft,
    setTimeLeft,
    score,
    setScore,
    resultTimeLeft,
    setResultTimeLeft,
    resetGameState,
    gameStartTime,
    setGameStartTime
  };
};
