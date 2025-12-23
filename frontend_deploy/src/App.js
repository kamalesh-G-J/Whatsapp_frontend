import React, { useState, useEffect, useCallback } from 'react';
import ChatList from './components/ChatList';
import ChatWindow from './components/ChatWindow';
import UserProfile from './components/UserProfile';
import LoginPage from './components/LoginPage';
import AddContact from './components/AddContact';
import CreateGroup from './components/CreateGroup';
import GroupSettings from './components/GroupSettings';
import wsService from './services/WebSocketService';
import { API_BASE } from './config';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [chats, setChats] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState({});
  const [showAddContact, setShowAddContact] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showGroupSettings, setShowGroupSettings] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    checkExistingSession();
  }, []);

  // Handle incoming WebSocket messages
  const handleWebSocketMessage = useCallback((data) => {
    console.log('Received real-time message:', data);
    
    // Don't process messages from ourselves (we'll get them from loadChats)
    if (data.senderPhone === currentUser?.userPhone) {
      return;
    }
    
    setChats(prevChats => {
      return prevChats.map(chat => {
        if (chat.chatId === data.chatId) {
          const newMessage = {
            messageId: data.messageId || Date.now().toString(),
            senderName: data.senderName,
            senderPhone: data.senderPhone,
            content: data.content,
            timestamp: data.timestamp,
            messageType: 'TEXT'
          };
          
          // Check if message already exists
          const exists = chat.ChatMessages?.some(m => 
            m.content === data.content && 
            m.senderPhone === data.senderPhone &&
            m.timestamp === data.timestamp
          );
          
          if (!exists) {
            return {
              ...chat,
              ChatMessages: [...(chat.ChatMessages || []), newMessage],
              lastMessage: data.content,
              timestamp: data.timestamp
            };
          }
        }
        return chat;
      });
    });
    
    setSelectedChat(prev => {
      if (prev && prev.chatId === data.chatId) {
        const newMessage = {
          messageId: data.messageId || Date.now().toString(),
          senderName: data.senderName,
          senderPhone: data.senderPhone,
          content: data.content,
          timestamp: data.timestamp,
          messageType: 'TEXT'
        };
        
        const exists = prev.ChatMessages?.some(m => 
          m.content === data.content && 
          m.senderPhone === data.senderPhone &&
          m.timestamp === data.timestamp
        );
        
        if (!exists) {
          return {
            ...prev,
            ChatMessages: [...(prev.ChatMessages || []), newMessage],
            lastMessage: data.content
          };
        }
      }
      return prev;
    });
  }, [currentUser]);

  // Handle user online/offline status
  const handleStatusUpdate = useCallback((data) => {
    if (data.type === 'onlineUsers') {
      setOnlineUsers(new Set(data.users));
    } else if (data.type === 'status') {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        if (data.online) {
          newSet.add(data.userPhone);
        } else {
          newSet.delete(data.userPhone);
        }
        return newSet;
      });
    }
  }, []);

  // Handle typing indicators
  const handleTypingUpdate = useCallback((data) => {
    setTypingUsers(prev => ({
      ...prev,
      [data.userPhone]: data.isTyping
    }));
    
    if (data.isTyping) {
      setTimeout(() => {
        setTypingUsers(prev => ({
          ...prev,
          [data.userPhone]: false
        }));
      }, 3000);
    }
  }, []);

  // Connect to WebSocket when logged in
  useEffect(() => {
    if (isLoggedIn && currentUser) {
      loadChats();
      
      wsService.connect(currentUser.userPhone)
        .then(() => {
          console.log('WebSocket connected successfully');
        })
        .catch((err) => {
          console.error('WebSocket connection failed:', err);
        });
      
      const unsubMessage = wsService.onMessage(handleWebSocketMessage);
      const unsubStatus = wsService.onStatus(handleStatusUpdate);
      const unsubTyping = wsService.onTyping(handleTypingUpdate);
      const unsubConnection = wsService.onConnectionChange(setWsConnected);
      
      return () => {
        unsubMessage();
        unsubStatus();
        unsubTyping();
        unsubConnection();
        wsService.disconnect();
      };
    }
  }, [isLoggedIn, currentUser, handleWebSocketMessage, handleStatusUpdate, handleTypingUpdate]);

  // Fallback polling only if WebSocket not connected
  useEffect(() => {
    if (selectedChat && isLoggedIn && !wsConnected) {
      const interval = setInterval(() => {
        loadChats();
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [selectedChat, isLoggedIn, wsConnected]);

  const checkExistingSession = async () => {
    const savedSessionId = localStorage.getItem('sessionId');
    const savedUser = localStorage.getItem('user');

    if (savedSessionId && savedUser) {
      try {
        const response = await fetch(`${API_BASE}/check-session?sessionId=${savedSessionId}`);
        const data = await response.json();

        if (data.valid) {
          setSessionId(savedSessionId);
          const user = JSON.parse(savedUser);
          setCurrentUser(user);
          setIsLoggedIn(true);
        } else {
          localStorage.removeItem('sessionId');
          localStorage.removeItem('user');
        }
      } catch (err) {
        console.error('Session check failed:', err);
        try {
          const user = JSON.parse(savedUser);
          setCurrentUser(user);
          setSessionId(savedSessionId);
          setIsLoggedIn(true);
        } catch {
          localStorage.removeItem('sessionId');
          localStorage.removeItem('user');
        }
      }
    }
    setLoading(false);
  };

  const handleLogin = (user, newSessionId) => {
    setCurrentUser(user);
    setSessionId(newSessionId);
    setIsLoggedIn(true);
    setSelectedChat(null);
    setChats([]);
    localStorage.setItem('user', JSON.stringify(user));
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });
    } catch (err) {
      console.error('Logout error:', err);
    }

    wsService.disconnect();
    localStorage.removeItem('sessionId');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setCurrentUser(null);
    setSessionId(null);
    setSelectedChat(null);
    setChats([]);
    setWsConnected(false);
    setOnlineUsers(new Set());
  };

  const loadChats = async () => {
    if (!currentUser) return;

    try {
      const response = await fetch(`${API_BASE}/chats?userPhone=${currentUser.userPhone}`);
      if (response.ok) {
        const data = await response.json();
        
        const formattedChats = data.map(chat => ({
          chatId: chat.ChatId,
          ChatName: chat.ChatName,
          ChatMessages: chat.ChatMessages || [],
          lastMessage: chat.lastMessage || 'No messages yet',
          timestamp: chat.lastMessageTime || '',
          participants: chat.participants || [],
          isGroup: chat.isGroup || false,
          groupAdmin: chat.groupAdmin || null
        }));
        
        setChats(formattedChats);
        setError(null);
        
        if (selectedChat) {
          const updatedSelectedChat = formattedChats.find(c => c.chatId === selectedChat.chatId);
          if (updatedSelectedChat) {
            setSelectedChat(updatedSelectedChat);
          }
        }
      }
    } catch (err) {
      console.error('Error loading chats:', err);
      setError('Failed to load chats. Make sure the server is running.');
    }
  };

  const handleSendMessage = async (message) => {
    if (!selectedChat || !currentUser || !message.trim()) return;

    // For group chats, send to all participants except self
    // For individual chats, send to the other participant
    const recipients = selectedChat.isGroup 
      ? selectedChat.participants?.filter(p => p !== currentUser.userPhone) || []
      : [selectedChat.participants?.find(p => p !== currentUser.userPhone)].filter(Boolean);
    
    // Send via WebSocket for real-time delivery
    if (wsConnected && recipients.length > 0) {
      recipients.forEach(recipientPhone => {
        wsService.sendMessage(
          selectedChat.chatId,
          recipientPhone,
          currentUser.userName,
          message
        );
      });
    }

    try {
      const response = await fetch(`${API_BASE}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: selectedChat.chatId,
          senderName: currentUser.userName,
          senderPhone: currentUser.userPhone,
          content: message,
          messageType: 'TEXT'
        })
      });

      if (response.ok) {
        // Always reload chats to get the latest messages with proper IDs
        await loadChats();
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    }
  };

  const handleTyping = (isTyping) => {
    if (selectedChat && currentUser) {
      const recipientPhone = selectedChat.participants?.find(p => p !== currentUser.userPhone);
      if (recipientPhone && wsConnected) {
        wsService.sendTyping(recipientPhone, isTyping);
      }
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner">
          <i className="fab fa-whatsapp fa-spin"></i>
        </div>
        <p>Loading WhatsApp...</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const isOtherUserTyping = selectedChat && selectedChat.participants
    ? selectedChat.participants.some(p => p !== currentUser.userPhone && typingUsers[p])
    : false;

  return (
    <div className="app">
      <div className="container-fluid h-100">
        <div className="row h-100">
          {/* Sidebar */}
          <div className="col-md-4 col-lg-3 p-0 border-end">
            <div className="whatsapp-sidebar">
              <UserProfile user={currentUser} onLogout={handleLogout} />
              
              {/* Action Buttons */}
              <div className="action-buttons-container p-2 d-flex gap-2">
                <button 
                  className="btn btn-success flex-fill"
                  onClick={() => setShowAddContact(true)}
                >
                  <i className="fas fa-user-plus me-2"></i>
                  Add Contact
                </button>
                <button 
                  className="btn btn-primary flex-fill"
                  onClick={() => setShowCreateGroup(true)}
                >
                  <i className="fas fa-users me-2"></i>
                  New Group
                </button>
              </div>
              
              {error && <div className="alert alert-danger m-2">{error}</div>}
              <ChatList 
                chats={chats} 
                selectedChat={selectedChat} 
                onSelectChat={setSelectedChat}
                onlineUsers={onlineUsers}
                typingUsers={typingUsers}
              />
            </div>
          </div>
          
          {/* Chat Area */}
          <div className="col-md-8 col-lg-9 p-0">
            {selectedChat ? (
              <ChatWindow 
                chat={selectedChat} 
                currentUser={currentUser}
                onSendMessage={handleSendMessage}
                onTyping={handleTyping}
                isOtherUserTyping={isOtherUserTyping}
                isOnline={selectedChat.participants?.some(p => p !== currentUser.userPhone && onlineUsers.has(p))}
                onOpenGroupSettings={() => setShowGroupSettings(true)}
              />
            ) : (
              <div className="d-flex align-items-center justify-content-center h-100 welcome-screen">
                <div className="text-center">
                  <i className="fab fa-whatsapp welcome-icon"></i>
                  <h2>Welcome, {currentUser?.userName}!</h2>
                  <p className="text-muted">Select a chat to start messaging</p>
                  <button 
                    className="btn btn-outline-success mt-3"
                    onClick={() => setShowAddContact(true)}
                  >
                    <i className="fas fa-user-plus me-2"></i>
                    Add your first contact
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Add Contact Modal */}
      {showAddContact && (
        <AddContact 
          userPhone={currentUser?.userPhone}
          onContactAdded={() => {
            loadChats();
            setShowAddContact(false);
          }}
          onClose={() => setShowAddContact(false)}
        />
      )}
      
      {/* Create Group Modal */}
      {showCreateGroup && (
        <CreateGroup 
          userPhone={currentUser?.userPhone}
          onGroupCreated={() => {
            loadChats();
          }}
          onClose={() => setShowCreateGroup(false)}
        />
      )}
      
      {/* Group Settings Modal */}
      {showGroupSettings && selectedChat?.isGroup && (
        <GroupSettings 
          chat={selectedChat}
          currentUser={currentUser}
          onGroupUpdated={() => {
            loadChats();
          }}
          onClose={() => setShowGroupSettings(false)}
        />
      )}
    </div>
  );
}

export default App;