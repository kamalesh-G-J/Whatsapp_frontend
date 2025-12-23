import React, { useState, useRef, useEffect } from 'react';

function ChatWindow({ chat, currentUser, onSendMessage, onTyping, isOtherUserTyping, isOnline, onOpenGroupSettings }) {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chat.ChatMessages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
      // Clear typing indicator
      if (onTyping) onTyping(false);
    }
  };

  const handleInputChange = (e) => {
    setMessage(e.target.value);
    
    // Send typing indicator
    if (onTyping) {
      onTyping(true);
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        onTyping(false);
      }, 2000);
    }
  };

  const isAdmin = chat.isGroup && chat.groupAdmin === currentUser?.userPhone;

  return (
    <div className="chat-window">
      {/* Chat Header */}
      <div className="chat-header d-flex align-items-center">
        <div 
          className={`position-relative me-3 ${chat.isGroup ? 'cursor-pointer' : ''}`}
          onClick={() => chat.isGroup && onOpenGroupSettings && onOpenGroupSettings()}
          title={chat.isGroup ? 'Click to view group settings' : ''}
        >
          <div className={`avatar ${chat.isGroup ? 'group-avatar' : ''}`}>
            {chat.isGroup ? <i className="fas fa-users"></i> : chat.ChatName?.charAt(0).toUpperCase()}
          </div>
          {!chat.isGroup && <div className={`online-indicator ${isOnline ? 'online' : 'offline'}`}></div>}
        </div>
        <div 
          className={`flex-grow-1 ${chat.isGroup ? 'cursor-pointer' : ''}`}
          onClick={() => chat.isGroup && onOpenGroupSettings && onOpenGroupSettings()}
        >
          <h6 className="mb-0">
            {chat.isGroup && <i className="fas fa-users me-2" style={{fontSize: '12px'}}></i>}
            {chat.ChatName}
            {isAdmin && <span className="badge bg-warning ms-2" style={{fontSize: '10px'}}>Admin</span>}
          </h6>
          <small className="text-light opacity-75">
            {chat.isGroup ? (
              `${chat.participants?.length || 0} members • Tap for group info`
            ) : isOtherUserTyping ? (
              <span className="typing-indicator">
                <span>typing</span>
                <span className="dots">
                  <span>.</span><span>.</span><span>.</span>
                </span>
              </span>
            ) : isOnline ? 'Online' : 'Offline'}
          </small>
        </div>
        <div className="d-flex gap-3">
          {chat.isGroup && (
            <button 
              className="btn btn-link text-white p-0"
              onClick={() => onOpenGroupSettings && onOpenGroupSettings()}
              title="Group Settings"
            >
              <i className="fas fa-cog"></i>
            </button>
          )}
          <button className="btn btn-link text-white p-0">
            <i className="fas fa-video"></i>
          </button>
          <button className="btn btn-link text-white p-0">
            <i className="fas fa-phone"></i>
          </button>
          <div className="dropdown">
            <button className="btn btn-link text-white p-0" data-bs-toggle="dropdown">
              <i className="fas fa-ellipsis-v"></i>
            </button>
            <ul className="dropdown-menu">
              {chat.isGroup && (
                <li>
                  <a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); onOpenGroupSettings && onOpenGroupSettings(); }}>
                    <i className="fas fa-cog me-2"></i>Group Settings
                  </a>
                </li>
              )}
              <li><a className="dropdown-item" href="#"><i className="fas fa-archive me-2"></i>Archive</a></li>
              <li><a className="dropdown-item" href="#"><i className="fas fa-bell-slash me-2"></i>Mute</a></li>
              <li><a className="dropdown-item text-danger" href="#"><i className="fas fa-trash me-2"></i>Delete</a></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="messages-container">
        {chat.ChatMessages && chat.ChatMessages.length > 0 ? (
          chat.ChatMessages.map((msg, index) => (
            <div 
              key={msg.messageId || index} 
              className={`message ${msg.senderName === currentUser.userName ? 'sent' : 'received'}`}
            >
              <div className={`message-bubble ${msg.senderName === currentUser.userName ? 'sent' : 'received'}`}>
                <div className="message-content">
                  {msg.messageType === 'IMAGE' ? (
                    <div>
                      <i className="fas fa-image me-2"></i>
                      <span>{msg.content}</span>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
                <div className="message-time text-end">
                  <small className="text-muted">
                    {msg.timestamp}
                    {msg.senderName === currentUser.userName && (
                      <i className="fas fa-check-double ms-1 text-primary"></i>
                    )}
                  </small>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-muted mt-4">
            <p>No messages yet. Start the conversation!</p>
          </div>
        )}
        
        {/* Typing indicator bubble */}
        {isOtherUserTyping && (
          <div className="message received">
            <div className="message-bubble received typing-bubble">
              <div className="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="message-input">
        <form onSubmit={handleSend}>
          <div className="input-group">
            <button type="button" className="btn btn-link text-muted">
              <i className="fas fa-smile"></i>
            </button>
            <button type="button" className="btn btn-link text-muted">
              <i className="fas fa-paperclip"></i>
            </button>
            <input
              type="text"
              className="form-control"
              placeholder="Type a message..."
              value={message}
              onChange={handleInputChange}
            />
            <button type="submit" className="btn btn-send">
              <i className="fas fa-paper-plane"></i>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ChatWindow;