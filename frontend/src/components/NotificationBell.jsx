import React, { useState } from 'react';
import { Bell, Wifi, WifiOff } from 'lucide-react';
import { useWebSocket } from '../contexts/WebSocketContext';
import NotificationPanel from './NotificationPanel';

const NotificationBell = ({ onOpenChat }) => {
  const { unreadCount, isConnected } = useWebSocket();
  const [showNotifications, setShowNotifications] = useState(false);

  const handleBellClick = () => {
    setShowNotifications(true);
  };

  const handleCloseNotifications = () => {
    setShowNotifications(false);
  };

  const handleOpenChat = (chatData) => {
    setShowNotifications(false);
    if (onOpenChat) {
      onOpenChat(chatData);
    }
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={handleBellClick}
          className="relative p-2 hover:bg-gray-700 rounded-lg transition duration-200 group"
          title="Notifications"
        >
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Wifi size={16} className="text-green-400" />
            ) : (
              <WifiOff size={16} className="text-red-400" />
            )}
            <Bell size={20} className="text-gray-400 group-hover:text-white" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[18px] flex items-center justify-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
        </button>
      </div>

      <NotificationPanel
        isOpen={showNotifications}
        onClose={handleCloseNotifications}
        onOpenChat={handleOpenChat}
      />
    </>
  );
};

export default NotificationBell; 