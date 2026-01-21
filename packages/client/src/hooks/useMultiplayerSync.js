import { useEffect, useRef } from 'react';

export const useMultiplayerSync = (
  isMultiplayer,
  socketProp,
  playerRef,
  fireRef,
  cookedItemsRef
) => {
  const socketRef = useRef(null);
  const otherPlayersRef = useRef({});

  useEffect(() => {
    if (!isMultiplayer || !socketProp) return;

    socketRef.current = socketProp;
    const socket = socketRef.current;

    // 게임 동기화 요청
    socket.emit('syncGame');

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

    // 리스너 등록
    socket.on("playerMoved", handlePlayerMoved);
    socket.on("newPlayer", handleNewPlayer);
    socket.on("playerDisconnected", handlePlayerDisconnected);
    socket.on("updateItemState", handleUpdateItemState);
    socket.on("removeItem", handleRemoveItem);
    socket.on("updateFireState", handleUpdateFireState);

    // 정리
    return () => {
      socket.off("playerMoved", handlePlayerMoved);
      socket.off("newPlayer", handleNewPlayer);
      socket.off("playerDisconnected", handlePlayerDisconnected);
      socket.off("updateItemState", handleUpdateItemState);
      socket.off("removeItem", handleRemoveItem);
      socket.off("updateFireState", handleUpdateFireState);
    };
  }, [isMultiplayer, socketProp, playerRef, fireRef, cookedItemsRef]);

  return { socketRef, otherPlayersRef };
};
