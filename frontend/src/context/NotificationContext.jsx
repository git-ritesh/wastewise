import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext.jsx';
import api from '../services/api.js';

const NotificationContext = createContext();
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Initialize Socket.io
  useEffect(() => {
    if (isAuthenticated && user) {
      const newSocket = io(SOCKET_URL);
      
      newSocket.on('connect', () => {
        console.log('Socket connected');
        newSocket.emit('join', user._id);
      });

      newSocket.on('notification', (notification) => {
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
        // Play sound or show toast here if needed
      });

      setSocket(newSocket);

      return () => newSocket.close();
    }
  }, [isAuthenticated, user]);

  // Fetch initial notifications
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.data.notifications);
      setUnreadCount(res.data.data.unreadCount);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all read:', error);
    }
  };

  const clearAllNotifications = async () => {
    try {
      await api.delete('/notifications/clear-all');
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  return (
    <NotificationContext.Provider value={{
      socket,
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      clearAllNotifications,
      fetchNotifications
    }}>
      {children}
    </NotificationContext.Provider>
  );
};
