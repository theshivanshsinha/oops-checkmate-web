import React, { useState, useEffect, useRef } from "react";
import {
  MessageCircle,
  Send,
  X,
  MoreHorizontal,
  Smile,
} from "lucide-react";

const ChatModal = ({ isOpen, onClose, friend, currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [roomId, setRoomId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState("online");
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && friend) {
      createOrGetChatRoom();
      setTimeout(() => {
        messageInputRef.current?.focus();
      }, 100);
    } else {
      setMessages([]);
      setNewMessage("");
      setRoomId(null);
    }
  }, [isOpen, friend]);

  const createOrGetChatRoom = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `https://oops-checkmate-web.onrender.com/api/chat/room/${friend.id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      if (response.ok) {
        setRoomId(data.roomId);
        await loadMessages(data.roomId);
      } else {
        console.error("Error creating chat room:", data.error);
      }
    } catch (error) {
      console.error("Error creating chat room:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (roomId) => {
    try {
      const response = await fetch(
        `https://oops-checkmate-web.onrender.com/api/chat/messages/${roomId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const data = await response.json();
      if (response.ok) {
        setMessages(data.messages || []);
      } else {
        console.error("Error loading messages:", data.error);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !roomId || isLoading) return;

    const messageContent = newMessage.trim();
    setNewMessage("");

    const tempMessage = {
      id: `temp-${Date.now()}`,
      content: messageContent,
      senderId: currentUser?.id,
      senderName: currentUser?.name,
      senderPhoto: null,
      timestamp: new Date(),
      read: false,
      type: "text",
      sending: true,
    };

    setMessages((prev) => [...prev, tempMessage]);

    try {
      const response = await fetch(
        "https://oops-checkmate-web.onrender.com/api/chat/send",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            roomId: roomId,
            content: messageContent,
            type: "text",
          }),
        }
      );
      const data = await response.json();
      if (response.ok) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempMessage.id
              ? { ...data.messageData, sending: false }
              : msg
          )
        );
      } else {
        setMessages((prev) => prev.filter((msg) => msg.id !== tempMessage.id));
        console.error("Error sending message:", data.error);
      }
    } catch (error) {
      setMessages((prev) => prev.filter((msg) => msg.id !== tempMessage.id));
      console.error("Error sending message:", error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      return date.toLocaleDateString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  const groupMessagesByDate = (messages) => {
    const groups = [];
    let currentGroup = null;

    messages.forEach((message) => {
      const messageDate = new Date(message.timestamp).toDateString();

      if (!currentGroup || currentGroup.date !== messageDate) {
        currentGroup = {
          date: messageDate,
          messages: [message],
        };
        groups.push(currentGroup);
      } else {
        currentGroup.messages.push(message);
      }
    });

    return groups;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl w-full max-w-md h-[500px] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold overflow-hidden">
                {friend?.profilePhoto ? (
                  <img
                    src={
                      friend.profilePhoto.startsWith("data:")
                        ? friend.profilePhoto
                        : `https://oops-checkmate-web.onrender.com/api${friend.profilePhoto}`
                    }
                    alt={friend.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  friend?.name?.charAt(0)?.toUpperCase()
                )}
              </div>
              <div
                className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-gray-800 ${
                  onlineStatus === "online"
                    ? "bg-green-400"
                    : onlineStatus === "away"
                    ? "bg-yellow-400"
                    : "bg-gray-400"
                }`}
              ></div>
            </div>
            <div>
              <h3 className="font-medium text-white">{friend?.name}</h3>
              <p
                className={`text-xs ${
                  onlineStatus === "online"
                    ? "text-green-400"
                    : onlineStatus === "away"
                    ? "text-yellow-400"
                    : "text-gray-400"
                }`}
              >
                {isTyping
                  ? "Typing..."
                  : onlineStatus === "online"
                  ? "Online"
                  : onlineStatus === "away"
                  ? "Away"
                  : "Offline"}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="p-2 hover:bg-gray-700 rounded-lg transition duration-200 group">
              <MoreHorizontal size={16} className="text-gray-400 group-hover:text-white" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded-lg transition duration-200 group"
            >
              <X size={16} className="text-gray-400 group-hover:text-white" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-900">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <MessageCircle size={48} className="mb-4 opacity-50" />
              <p className="text-center">No messages yet.</p>
              <p className="text-center text-sm">
                Start the conversation with {friend?.name}!
              </p>
            </div>
          ) : (
            groupMessagesByDate(messages).map((group, groupIndex) => (
              <div key={groupIndex}>
                <div className="flex items-center justify-center my-4">
                  <div className="bg-gray-700 px-3 py-1 rounded-full text-xs text-gray-300">
                    {new Date(group.date).toLocaleDateString([], {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </div>

                {group.messages.map((message, index) => {
                  const isCurrentUser = message.senderId === currentUser?.id;
                  const showAvatar =
                    !isCurrentUser &&
                    (index === 0 ||
                      group.messages[index - 1]?.senderId !== message.senderId);

                  return (
                    <div
                      key={message.id}
                      className={`flex ${
                        isCurrentUser ? "justify-end" : "justify-start"
                      } mb-2`}
                    >
                      {!isCurrentUser && (
                        <div className="w-8 h-8 mr-2 flex-shrink-0">
                          {showAvatar ? (
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xs overflow-hidden">
                              {message.senderPhoto ? (
                                <img
                                  src={
                                    message.senderPhoto.startsWith("data:")
                                      ? message.senderPhoto
                                      : `https://oops-checkmate-web.onrender.com/api${message.senderPhoto}`
                                  }
                                  alt={message.senderName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                message.senderName?.charAt(0)?.toUpperCase()
                              )}
                            </div>
                          ) : null}
                        </div>
                      )}

                      <div className={`max-w-xs ${isCurrentUser ? "ml-12" : "mr-12"}`}>
                        <div
                          className={`px-4 py-2 rounded-2xl ${
                            isCurrentUser
                              ? "bg-blue-500 text-white rounded-br-md"
                              : "bg-gray-700 text-white rounded-bl-md"
                          } ${message.sending ? "opacity-70" : ""}`}
                        >
                          <p className="text-sm break-words">{message.content}</p>
                        </div>
                        <div
                          className={`flex items-center gap-1 mt-1 ${
                            isCurrentUser ? "justify-end" : "justify-start"
                          }`}
                        >
                          <span className="text-xs text-gray-400">
                            {formatMessageTime(message.timestamp)}
                          </span>
                          {isCurrentUser && (
                            <span className="text-xs text-gray-400">
                              {message.sending ? "⏳" : message.read ? "✓✓" : "✓"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <form
          onSubmit={sendMessage}
          className="p-4 border-t border-gray-700 bg-gray-800 rounded-b-2xl"
        >
          <div className="flex gap-2 items-end">
            <div className="flex-1 relative">
              <textarea
                ref={messageInputRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`Message ${friend?.name}...`}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none max-h-20 min-h-[40px]"
                rows="1"
                style={{
                  height: "auto",
                  minHeight: "40px",
                  maxHeight: "80px",
                }}
                onInput={(e) => {
                  e.target.style.height = "auto";
                  e.target.style.height =
                    Math.min(e.target.scrollHeight, 80) + "px";
                }}
              />
              <button
                type="button"
                className="absolute right-2 bottom-2 p-1 hover:bg-gray-600 rounded-full transition duration-200"
              >
                <Smile size={16} className="text-gray-400" />
              </button>
            </div>
            <button
              type="submit"
              disabled={!newMessage.trim() || isLoading}
              className="p-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-full transition duration-200 flex-shrink-0"
            >
              <Send size={16} className="text-white" />
            </button>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Press Enter to send, Shift+Enter for new line
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatModal;
