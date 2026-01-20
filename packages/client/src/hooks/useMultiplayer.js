import { useState } from 'react';

export const useMultiplayer = () => {
  const [socket, setSocket] = useState(null);
  const [roomId, setRoomId] = useState('');
  const [gameMode, setGameMode] = useState('single');
  const [waitingInfo, setWaitingInfo] = useState({ current: 0, max: 0, members: [] });
  const [lobbyCapacity, setLobbyCapacity] = useState(2);
  const [roomPlayers, setRoomPlayers] = useState({});

  const resetMultiplayerState = () => {
    setSocket(null);
    setRoomId('');
    setGameMode('single');
    setWaitingInfo({ current: 0, max: 0, members: [] });
    setRoomPlayers({});
  };

  return {
    socket,
    setSocket,
    roomId,
    setRoomId,
    gameMode,
    setGameMode,
    waitingInfo,
    setWaitingInfo,
    lobbyCapacity,
    setLobbyCapacity,
    roomPlayers,
    setRoomPlayers,
    resetMultiplayerState,
  };
};
