import React from 'react';

function ChatList({ chats, selectedChat, onSelectChat }) {
  return (
    <div className="chat-list">
      <div className="p-3 border-bottom">
        <div className="input-group">
          <span className="input-group-text bg-transparent border-0">
            <i className="fas fa-search text-muted"></i>
          </span>
          <input 
            type="text" 
            className="form-control border-0" 
            placeholder="Search or start new chat"
          />
        </div>
      </div>
      
      <div className="overflow-auto" style={{ height: 'calc(100vh - 200px)' }}>
        {chats.length === 0 ? (
          <div className="text-center text-muted p-4">
            <i className="fas fa-comments fa-3x mb-3 opacity-50"></i>
            <p>No chats yet. Add contacts or create a group to start chatting!</p>
          </div>
        ) : (
          chats.map(chat => (
            <div 
              key={chat.chatId}
              className={`chat-item d-flex align-items-center ${selectedChat?.chatId === chat.chatId ? 'active' : ''}`}
              onClick={() => onSelectChat(chat)}
            >
              <div className="position-relative me-3">
                <div className={`avatar ${chat.isGroup ? 'group-avatar' : ''}`}>
                  {chat.isGroup ? (
                    <i className="fas fa-users"></i>
                  ) : (
                    chat.ChatName?.charAt(0).toUpperCase() || '?'
                  )}
                </div>
              </div>
              
              <div className="flex-grow-1 min-w-0">
                <div className="d-flex justify-content-between align-items-start">
                  <h6 className="mb-1 text-truncate">
                    {chat.isGroup && <i className="fas fa-users group-icon me-1" style={{fontSize: '12px'}}></i>}
                    {chat.ChatName}
                  </h6>
                  <small className="text-muted">{chat.timestamp}</small>
                </div>
                <p className="mb-0 text-muted text-truncate small">
                  {chat.lastMessage}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ChatList;