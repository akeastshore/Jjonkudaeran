import { useEffect, useRef } from 'react';

export const useMultiplayerSync = (
  isMultiplayer,
  socketProp,
  playerRef,
  fireRef,
  cookedItemsRef,
  burnerStatesRef
) => {
  const socketRef = useRef(null);
  const otherPlayersRef = useRef({});

  useEffect(() => {
    if (!isMultiplayer || !socketProp) return;

    socketRef.current = socketProp;
    const socket = socketRef.current;


    // 플레이어 이동 처리
    const handlePlayerMoved = (data) => {
      const { id, x, y, direction } = data;

      if (!otherPlayersRef.current[id]) {
        otherPlayersRef.current[id] = data;
      } else {
        otherPlayersRef.current[id].x = x;
        otherPlayersRef.current[id].y = y;
        otherPlayersRef.current[id].direction = direction;
      }
    };

    const handleNewPlayer = ({ id, player }) => {
      otherPlayersRef.current[id] = player;
    };

    const handlePlayerDisconnected = (id) => {
      delete otherPlayersRef.current[id];
    };

    const handleUpdateFireState = (data) => {
      fireRef.current = { ...fireRef.current, ...data };
    };

    const handleUpdateItemState = (itemData) => {
      let item = cookedItemsRef.current.find(i => i.uid === itemData.uid);

      if (!item) {
        item = { ...itemData };
        cookedItemsRef.current.push(item);
      } else {
        Object.assign(item, itemData);

        if (itemData.status === 'held' && itemData.holderId !== socket.id) {
          if (playerRef.current.holding === item.uid) {
            playerRef.current.holding = null;
          }
        }
      }
    };

    const handleRemoveItem = (uid) => {
      const idx = cookedItemsRef.current.findIndex(i => i.uid === uid);
      if (idx > -1) {
        cookedItemsRef.current.splice(idx, 1);
      }
    };

    const handleUpdateBurnerState = (burnerData) => {
      // x, y를 이용해 키 생성
      const key = `${burnerData.x}_${burnerData.y}`;
      if (!burnerStatesRef.current[key]) {
        burnerStatesRef.current[key] = { ...burnerData };
      } else {
        // 기존 상태 업데이트
        Object.assign(burnerStatesRef.current[key], burnerData);
      }
    };

    // 리스너 등록
    const handleRoomUpdate = (roomPlayers) => {
      console.log('Room Update Received:', roomPlayers); // [DEBUG]
      Object.keys(roomPlayers).forEach(id => {
        if (id !== socket.id) {
          otherPlayersRef.current[id] = roomPlayers[id];
        }
      });
    };

    // 리스너 등록
    socket.on("playerMoved", handlePlayerMoved);
    socket.on("roomUpdate", handleRoomUpdate);
    socket.on("newPlayer", handleNewPlayer);
    socket.on("playerDisconnected", handlePlayerDisconnected);
    socket.on("updateItemState", handleUpdateItemState);
    socket.on("removeItem", handleRemoveItem);
    socket.on("updateFireState", handleUpdateFireState);
    socket.on("updateBurnerState", handleUpdateBurnerState);

    // 게임 동기화 요청 (리스너 등록 후 요청)
    socket.emit('syncGame');

    // 정리
    return () => {
      socket.off("playerMoved", handlePlayerMoved);
      socket.off("roomUpdate", handleRoomUpdate);
      socket.off("newPlayer", handleNewPlayer);
      socket.off("playerDisconnected", handlePlayerDisconnected);
      socket.off("updateItemState", handleUpdateItemState);
      socket.off("removeItem", handleRemoveItem);
      socket.off("updateFireState", handleUpdateFireState);
      socket.off("updateBurnerState", handleUpdateBurnerState);
    };
  }, [isMultiplayer, socketProp, playerRef, fireRef, cookedItemsRef, burnerStatesRef]);

  return { socketRef, otherPlayersRef };
};
