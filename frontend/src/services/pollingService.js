import { API_BASE_URL } from '../config/api';

class PollingService {
  constructor() {
    this.intervals = new Map();
    this.callbacks = new Map();
  }

  // Start polling for chat messages
  startMessagePolling(roomId, callback, interval = 3000) {
    const key = `messages_${roomId}`;
    this.stopPolling(key);

    const poll = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/chat/messages/${roomId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          callback(data.messages || []);
        }
      } catch (error) {
        // Silent fail for polling
      }
    };

    // Initial poll
    poll();
    
    // Set up interval
    const intervalId = setInterval(poll, interval);
    this.intervals.set(key, intervalId);
    this.callbacks.set(key, callback);
  }

  // Start polling for online status
  startOnlineStatusPolling(userIds, callback, interval = 5000) {
    const key = `online_status_${userIds.join('_')}`;
    this.stopPolling(key);

    const poll = async () => {
      try {
        const params = new URLSearchParams();
        userIds.forEach(id => params.append('user_ids[]', id));
        
        const response = await fetch(`${API_BASE_URL}/users/online-status?${params}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          callback(data.status || {});
        }
      } catch (error) {
        // Silent fail for polling
      }
    };

    // Initial poll
    poll();
    
    // Set up interval
    const intervalId = setInterval(poll, interval);
    this.intervals.set(key, intervalId);
    this.callbacks.set(key, callback);
  }

  // Start polling for notifications
  startNotificationPolling(callback, interval = 10000) {
    const key = 'notifications';
    this.stopPolling(key);

    const poll = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/notifications`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          callback(data.notifications || []);
        }
      } catch (error) {
        // Silent fail for polling
      }
    };

    // Initial poll
    poll();
    
    // Set up interval
    const intervalId = setInterval(poll, interval);
    this.intervals.set(key, intervalId);
    this.callbacks.set(key, callback);
  }

  // Start polling for chat rooms list
  startChatRoomsPolling(callback, interval = 8000) {
    const key = 'chat_rooms';
    this.stopPolling(key);

    const poll = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/chat/rooms`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          callback(data.rooms || []);
        }
      } catch (error) {
        // Silent fail for polling
      }
    };

    // Initial poll
    poll();
    
    // Set up interval
    const intervalId = setInterval(poll, interval);
    this.intervals.set(key, intervalId);
    this.callbacks.set(key, callback);
  }

  // Stop specific polling
  stopPolling(key) {
    if (this.intervals.has(key)) {
      clearInterval(this.intervals.get(key));
      this.intervals.delete(key);
      this.callbacks.delete(key);
    }
  }

  // Stop all polling
  stopAllPolling() {
    this.intervals.forEach((intervalId) => {
      clearInterval(intervalId);
    });
    this.intervals.clear();
    this.callbacks.clear();
  }

  // Get active polling keys
  getActivePolling() {
    return Array.from(this.intervals.keys());
  }
}

// Create singleton instance
const pollingService = new PollingService();
export default pollingService; 