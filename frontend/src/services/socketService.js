import { io } from 'socket.io-client';
import { SERVER_URL } from '../config/api';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.eventListeners = new Map();
  }

  connect(token) {
    if (this.socket && this.isConnected) {
      return;
    }

    // Create socket connection
    this.socket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      auth: {
        token: token
      },
      query: {
        token: token
      },
      extraHeaders: {
        Authorization: `Bearer ${token}`
      }
    });

    // Connection events
    this.socket.on('connect', () => {
      this.isConnected = true;
      
      // Emit user login event
      this.socket.emit('user_login', { token });
    });

    this.socket.on('disconnect', () => {
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.isConnected = false;
    });

    // Chat events
    this.socket.on('new_message', (messageData) => {
      this.emit('new_message', messageData);
    });

    this.socket.on('user_typing', (typingData) => {
      this.emit('user_typing', typingData);
    });

    this.socket.on('message_read', (readData) => {
      this.emit('message_read', readData);
    });

    // Online status events
    this.socket.on('user_online', (data) => {
      this.emit('user_online', data);
    });

    this.socket.on('user_offline', (data) => {
      this.emit('user_offline', data);
    });

    // Notification events
    this.socket.on('new_notification', (notificationData) => {
      this.emit('new_notification', notificationData);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Join a chat room
  joinChatRoom(roomId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join_chat_room', { room_id: roomId });
    }
  }

  // Leave a chat room
  leaveChatRoom(roomId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave_chat_room', { room_id: roomId });
    }
  }

  // Send typing indicator
  sendTyping(roomId, userId, isTyping) {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing', {
        room_id: roomId,
        user_id: userId,
        is_typing: isTyping
      });
    }
  }

  // Event listener management
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // Get connection status
  getConnectionStatus() {
    return this.isConnected;
  }
}

// Create singleton instance
const socketService = new SocketService();
export default socketService; 