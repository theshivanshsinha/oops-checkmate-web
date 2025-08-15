import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  X,
  MessageCircle,
  UserPlus,
  Trophy,
  Settings,
  Check,
  Trash2,
  Reply,
} from 'lucide-react';
import notificationService from '../services/notificationService';
import socketService from '../services/socketService';

const NotificationPanel = ({ isOpen, onClose, onOpenChat }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showReplyInput, setShowReplyInput] = useState(null);
  const [replyText, setReplyText] = useState('');
  const panelRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleNewNotification = (notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    };

    window.addEventListener('newNotification', (e) => {
      handleNewNotification(e.detail);
    });

    return () => {
      window.removeEventListener('newNotification', handleNewNotification);
    };
  }, []);

  const loadNotifications = () => {
    const allNotifications = notificationService.getNotifications();
    setNotifications(allNotifications);
    setUnreadCount(notificationService.getUnreadCount());
  };

  const markAsRead = (notificationId) => {
    notificationService.markAsRead(notificationId);
    setUnreadCount(prev => Math.max(0, prev - 1));
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
  };

  const markAllAsRead = () => {
    notificationService.markAllAsRead();
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    notificationService.clearAll();
    setNotifications([]);
    setUnreadCount(0);
  };

  const handleReply = async (notification) => {
    if (!replyText.trim()) return;

    try {
      // Send reply message
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          roomId: notification.data.roomId,
          content: replyText,
          type: 'text',
        }),
      });

      if (response.ok) {
        // Mark notification as read
        markAsRead(notification.id);
        setShowReplyInput(null);
        setReplyText('');
        
        // Open chat if not already open
        if (onOpenChat) {
          onOpenChat(notification.data);
        }
      }
    } catch (error) {
      console.error('Error sending reply:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_message':
        return <MessageCircle size={16} className="text-blue-500" />;
      case 'friend_request':
        return <UserPlus size={16} className="text-green-500" />;
      case 'achievement':
        return <Trophy size={16} className="text-yellow-500" />;
      default:
        return <Bell size={16} className="text-gray-500" />;
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const handleClickOutside = (e) => {
    if (panelRef.current && !panelRef.current.contains(e.target)) {
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div 
        ref={panelRef}
        className="bg-gray-800 rounded-2xl w-full max-w-md max-h-[600px] flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <Bell size={20} className="text-blue-500" />
            <h3 className="text-lg font-semibold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="p-2 hover:bg-gray-700 rounded-lg transition duration-200"
                title="Mark all as read"
              >
                <Check size={16} className="text-green-400" />
              </button>
            )}
            <button
              onClick={clearAll}
              className="p-2 hover:bg-gray-700 rounded-lg transition duration-200"
              title="Clear all"
            >
              <Trash2 size={16} className="text-red-400" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded-lg transition duration-200"
            >
              <X size={16} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <Bell size={48} className="mb-4 opacity-50" />
              <p className="text-center">No notifications yet.</p>
              <p className="text-center text-sm">
                You'll see notifications here when you receive messages or updates.
              </p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 rounded-lg border transition duration-200 ${
                  notification.read
                    ? 'bg-gray-700 border-gray-600'
                    : 'bg-blue-900/20 border-blue-500/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <h4 className="text-sm font-medium text-white">
                        {notification.title}
                      </h4>
                      <span className="text-xs text-gray-400 ml-2">
                        {formatTime(notification.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 mt-1">
                      {notification.message}
                    </p>
                    
                    {/* Reply section for chat notifications */}
                    {notification.type === 'new_message' && (
                      <div className="mt-3">
                        {showReplyInput === notification.id ? (
                          <div className="space-y-2">
                            <textarea
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="Type your reply..."
                              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
                              rows="2"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleReply(notification)}
                                disabled={!replyText.trim()}
                                className="px-3 py-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded-lg transition duration-200"
                              >
                                Send
                              </button>
                              <button
                                onClick={() => {
                                  setShowReplyInput(null);
                                  setReplyText('');
                                }}
                                className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white text-sm rounded-lg transition duration-200"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              onClick={() => setShowReplyInput(notification.id)}
                              className="flex items-center gap-1 px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded-lg transition duration-200"
                            >
                              <Reply size={12} />
                              Reply
                            </button>
                            <button
                              onClick={() => {
                                markAsRead(notification.id);
                                if (onOpenChat) {
                                  onOpenChat(notification.data);
                                }
                              }}
                              className="px-2 py-1 bg-gray-600 hover:bg-gray-500 text-white text-xs rounded-lg transition duration-200"
                            >
                              Open Chat
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>
              {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
            </span>
            <span>
              {unreadCount} unread
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationPanel; 