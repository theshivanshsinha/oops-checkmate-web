class NotificationService {
  constructor() {
    this.notifications = [];
    this.hasPermission = false;
    this.init();
  }

  async init() {
    // Check if browser supports notifications
    if ('Notification' in window) {
      this.hasPermission = Notification.permission === 'granted';
      
      if (Notification.permission === 'default') {
        // Request permission
        const permission = await Notification.requestPermission();
        this.hasPermission = permission === 'granted';
      }
    }
  }

  // Add a new notification
  addNotification(notification) {
    const newNotification = {
      id: Date.now() + Math.random(),
      ...notification,
      timestamp: new Date(),
      read: false
    };

    this.notifications.unshift(newNotification);
    
    // Keep only last 50 notifications
    if (this.notifications.length > 50) {
      this.notifications = this.notifications.slice(0, 50);
    }

    // Show browser notification if app is not focused
    if (this.hasPermission && !document.hasFocus()) {
      this.showBrowserNotification(newNotification);
    }

    // Emit custom event for components to listen
    window.dispatchEvent(new CustomEvent('newNotification', {
      detail: newNotification
    }));

    return newNotification;
  }

  // Show browser notification
  showBrowserNotification(notification) {
    if (!this.hasPermission) return;

    const browserNotification = new Notification(notification.title, {
      body: notification.message,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: notification.id,
      requireInteraction: false,
      silent: false
    });

    // Handle notification click
    browserNotification.onclick = () => {
      window.focus();
      browserNotification.close();
      
      // Handle different notification types
      if (notification.type === 'new_message') {
        // Open chat modal
        window.dispatchEvent(new CustomEvent('openChat', {
          detail: notification.data
        }));
      }
    };

    // Auto close after 5 seconds
    setTimeout(() => {
      browserNotification.close();
    }, 5000);
  }

  // Mark notification as read
  markAsRead(notificationId) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
    }
  }

  // Mark all notifications as read
  markAllAsRead() {
    this.notifications.forEach(notification => {
      notification.read = true;
    });
  }

  // Get all notifications
  getNotifications() {
    return this.notifications;
  }

  // Get unread notifications count
  getUnreadCount() {
    return this.notifications.filter(n => !n.read).length;
  }

  // Get notifications by type
  getNotificationsByType(type) {
    return this.notifications.filter(n => n.type === type);
  }

  // Clear all notifications
  clearAll() {
    this.notifications = [];
  }

  // Clear notifications by type
  clearByType(type) {
    this.notifications = this.notifications.filter(n => n.type !== type);
  }

  // Request notification permission
  async requestPermission() {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      this.hasPermission = permission === 'granted';
      return this.hasPermission;
    }
    return false;
  }

  // Check if notifications are supported
  isSupported() {
    return 'Notification' in window;
  }

  // Get permission status
  getPermissionStatus() {
    if ('Notification' in window) {
      return Notification.permission;
    }
    return 'denied';
  }
}

// Create singleton instance
const notificationService = new NotificationService();
export default notificationService; 