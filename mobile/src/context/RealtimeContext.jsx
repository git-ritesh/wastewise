import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';

import { BASE_URL } from '../utils/constants';

const RealtimeContext = createContext({
  socket: null,
  revision: 0,
  lastEvent: null,
});

const SOCKET_URL = (process.env.EXPO_PUBLIC_SOCKET_URL || BASE_URL).replace(/\/api\/?$/, '');

export const useRealtime = () => useContext(RealtimeContext);

export const RealtimeProvider = ({ children }) => {
  const user = useSelector((state) => state.auth.user);
  const token = useSelector((state) => state.auth.token);
  const [socket, setSocket] = useState(null);
  const [revision, setRevision] = useState(0);
  const [lastEvent, setLastEvent] = useState(null);
  const userId = user?._id || user?.id;

  useEffect(() => {
    if (!token || !userId) {
      if (socket) {
        socket.close();
        setSocket(null);
      }
      return undefined;
    }

    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      autoConnect: true,
    });

    newSocket.on('connect', () => {
      newSocket.emit('join', userId);
    });

    newSocket.on('data:update', (payload) => {
      setLastEvent(payload);
      setRevision((value) => value + 1);
    });

    newSocket.on('notification', (payload) => {
      setLastEvent(payload);
      setRevision((value) => value + 1);
    });

    newSocket.on('connect_error', (error) => {
      console.log('Realtime socket error:', error.message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
      setSocket(null);
    };
  }, [token, userId]);

  const value = useMemo(
    () => ({ socket, revision, lastEvent }),
    [socket, revision, lastEvent]
  );

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
};
