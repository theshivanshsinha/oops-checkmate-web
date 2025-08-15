import React from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';
import { Wifi, WifiOff, Bell } from 'lucide-react';

const WebSocketStatus = () => {
  const { isConnected, unreadCount, onlineUsers } = useWebSocket();

  // Only show when disconnected or when there are notifications
  if (isConnected && unreadCount === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 bg-gray-800 rounded-lg p-3 shadow-lg z-50">
      <div className="flex items-center gap-2 text-sm">
        {!isConnected && (
          <div className="flex items-center gap-1">
            <WifiOff size={14} className="text-red-400" />
            <span className="text-red-400">Disconnected</span>
          </div>
        )}
        {unreadCount > 0 && (
          <div className="flex items-center gap-1">
            <Bell size={14} className="text-blue-400" />
            <span className="text-blue-400">{unreadCount}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default WebSocketStatus; 