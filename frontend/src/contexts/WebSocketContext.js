import React, { createContext, useContext, useEffect, useState } from 'react';
import socketService from '../services/socketService';
import notificationService from '../services/notificationService';
import pollingService from '../services/pollingService';

const WebSocketContext = createContext();

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Connect to WebSocket
      socketService.connect(token);

      // Set up connection status listener
      const checkConnection = () => {
        const connected = socketService.getConnectionStatus();
        setIsConnected(connected);
      };

      // Check connection status periodically
      const interval = setInterval(checkConnection, 2000);
      checkConnection(); // Initial check

      // Set up notification listeners
      const handleNewNotification = (notification) => {
        const newNotification = notificationService.addNotification(notification);
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(notificationService.getUnreadCount());
      };

      const handleNotificationUpdate = () => {
        setNotifications(notificationService.getNotifications());
        setUnreadCount(notificationService.getUnreadCount());
      };

      // Listen for WebSocket notifications
      socketService.on('new_notification', handleNewNotification);

      // Listen for notification updates
      window.addEventListener('newNotification', handleNotificationUpdate);

      // Load initial notifications
      setNotifications(notificationService.getNotifications());
      setUnreadCount(notificationService.getUnreadCount());

      // Request notification permission
      notificationService.requestPermission();

      // Start polling for notifications as fallback
      pollingService.startNotificationPolling((newNotifications) => {
        setNotifications(newNotifications);
        setUnreadCount(notificationService.getUnreadCount());
      });

      return () => {
        clearInterval(interval);
        socketService.off('new_notification', handleNewNotification);
        window.removeEventListener('newNotification', handleNotificationUpdate);
        pollingService.stopPolling('notifications');
      };
    }
  }, []);

  useEffect(() => {
    // Listen for online/offline user events
    const handleUserOnline = (data) => {
      setOnlineUsers(prev => new Set([...prev, data.user_id]));
    };

    const handleUserOffline = (data) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(data.user_id);
        return newSet;
      });
    };

    socketService.on('user_online', handleUserOnline);
    socketService.on('user_offline', handleUserOffline);

    return () => {
      socketService.off('user_online', handleUserOnline);
      socketService.off('user_offline', handleUserOffline);
    };
  }, []);

  const value = {
    isConnected,
    onlineUsers,
    notifications,
    unreadCount,
    socketService,
    notificationService,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}; 