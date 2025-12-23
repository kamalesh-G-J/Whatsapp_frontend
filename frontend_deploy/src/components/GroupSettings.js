import React, { useState, useEffect } from 'react';
import { API_BASE } from '../config';

function GroupSettings({ chat, currentUser, onClose, onGroupUpdated }) {
  const [groupName, setGroupName] = useState(chat.ChatName || '');
  const [members, setMembers] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddMember, setShowAddMember] = useState(false);
  
  const isAdmin = chat.groupAdmin === currentUser?.userPhone;

  useEffect(() => {
    loadGroupInfo();
    if (isAdmin) {
      loadContacts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat.chatId]);

  const loadGroupInfo = async () => {
    try {
      const response = await fetch(`${API_BASE}/groups?chatId=${chat.chatId}`);
      if (response.ok) {
        const data = await response.json();
        setMembers(data.members || []);
        setGroupName(data.groupName || chat.ChatName);
      }
    } catch (err) {
      console.error('Error loading group info:', err);
    }
    setLoading(false);
  };

  const loadContacts = async () => {
    try {
      const response = await fetch(`${API_BASE}/contacts?userPhone=${currentUser.userPhone}`);
      if (response.ok) {
        const data = await response.json();
        setContacts((data.contacts || []).filter(c => c.isRegistered));
      }
    } catch (err) {
      console.error('Error loading contacts:', err);
    }
  };

  const handleUpdateName = async () => {
    if (!groupName.trim()) {
      setError('Group name cannot be empty');
      return;
    }
    
    setError('');
    setSuccess('');
    
    try {
      const response = await fetch(`${API_BASE}/groups`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateName',
          chatId: chat.chatId,
          adminPhone: currentUser.userPhone,
          newName: groupName.trim()
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setSuccess('Group name updated!');
        if (onGroupUpdated) onGroupUpdated();
      } else {
        setError(data.message || 'Failed to update name');
      }
    } catch (err) {
      setError('Error updating group name');
    }
  };

  const handleAddMember = async (contactPhone) => {
    setError('');
    setSuccess('');
    
    try {
      const response = await fetch(`${API_BASE}/groups`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addMember',
          chatId: chat.chatId,
          adminPhone: currentUser.userPhone,
          memberPhone: contactPhone
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setSuccess('Member added!');
        loadGroupInfo();
        setShowAddMember(false);
        if (onGroupUpdated) onGroupUpdated();
      } else {
        setError(data.message || 'Failed to add member');
      }
    } catch (err) {
      setError('Error adding member');
    }
  };

  const handleRemoveMember = async (memberPhone) => {
    if (!window.confirm('Are you sure you want to remove this member?')) {
      return;
    }
    
    setError('');
    setSuccess('');
    
    try {
      const response = await fetch(
        `${API_BASE}/groups?chatId=${chat.chatId}&memberPhone=${memberPhone}&adminPhone=${currentUser.userPhone}`,
        { method: 'DELETE' }
      );
      
      const data = await response.json();
      if (data.success) {
        setSuccess('Member removed!');
        loadGroupInfo();
        if (onGroupUpdated) onGroupUpdated();
      } else {
        setError(data.message || 'Failed to remove member');
      }
    } catch (err) {
      setError('Error removing member');
    }
  };

  const handleLeaveGroup = async () => {
    if (!window.confirm('Are you sure you want to leave this group?')) {
      return;
    }
    
    try {
      const response = await fetch(
        `${API_BASE}/groups?chatId=${chat.chatId}&memberPhone=${currentUser.userPhone}&adminPhone=${currentUser.userPhone}`,
        { method: 'DELETE' }
      );
      
      const data = await response.json();
      if (data.success) {
        if (onGroupUpdated) onGroupUpdated();
        onClose();
      } else {
        setError('Failed to leave group');
      }
    } catch (err) {
      setError('Error leaving group');
    }
  };

  // Get contacts not already in group
  const availableContacts = contacts.filter(
    c => !members.some(m => m.phone === c.contactPhone)
  );

  return (
    <div className="group-settings-modal">
      <div className="group-settings-content">
        <div className="group-settings-header">
          <h5><i className="fas fa-cog me-2"></i>Group Settings</h5>
          <button className="btn-close" onClick={onClose}></button>
        </div>

        <div className="group-settings-body">
          {loading ? (
            <div className="text-center p-4">
              <div className="spinner-border text-primary"></div>
            </div>
          ) : (
            <>
              {/* Group Profile */}
              <div className="group-profile-section text-center mb-4">
                <div className="group-avatar-large mx-auto mb-3">
                  <i className="fas fa-users"></i>
                </div>
                
                {isAdmin ? (
                  <div className="input-group mb-2">
                    <input
                      type="text"
                      className="form-control"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      placeholder="Group name"
                    />
                    <button 
                      className="btn btn-primary"
                      onClick={handleUpdateName}
                    >
                      <i className="fas fa-save"></i>
                    </button>
                  </div>
                ) : (
                  <h5>{groupName}</h5>
                )}
                
                <small className="text-muted">
                  {members.length} members
                </small>
              </div>

              {error && <div className="alert alert-danger py-2">{error}</div>}
              {success && <div className="alert alert-success py-2">{success}</div>}

              {/* Members Section */}
              <div className="members-section">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="mb-0">
                    <i className="fas fa-users me-2"></i>Members
                  </h6>
                  {isAdmin && (
                    <button 
                      className="btn btn-sm btn-success"
                      onClick={() => setShowAddMember(!showAddMember)}
                    >
                      <i className="fas fa-user-plus me-1"></i>
                      Add
                    </button>
                  )}
                </div>

                {/* Add Member Section */}
                {showAddMember && isAdmin && (
                  <div className="add-member-section mb-3">
                    <div className="card">
                      <div className="card-body p-2">
                        <h6 className="card-title mb-2">Select contact to add:</h6>
                        {availableContacts.length === 0 ? (
                          <p className="text-muted small mb-0">No contacts available to add</p>
                        ) : (
                          <div className="available-contacts-list">
                            {availableContacts.map((contact, idx) => (
                              <div 
                                key={idx}
                                className="available-contact-item"
                                onClick={() => handleAddMember(contact.contactPhone)}
                              >
                                <div className="contact-avatar-small">
                                  {(contact.contactDisplayName || contact.contactName || '?').charAt(0).toUpperCase()}
                                </div>
                                <span>{contact.contactDisplayName || contact.contactName}</span>
                                <i className="fas fa-plus ms-auto text-success"></i>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Members List */}
                <div className="members-list">
                  {members.map((member, idx) => (
                    <div key={idx} className="member-item">
                      <div className="member-avatar">
                        {member.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="member-info">
                        <div className="member-name">
                          {member.name}
                          {member.isAdmin && (
                            <span className="badge bg-warning ms-2">Admin</span>
                          )}
                          {member.phone === currentUser.userPhone && (
                            <span className="badge bg-secondary ms-1">You</span>
                          )}
                        </div>
                        <small className="text-muted">{member.phone}</small>
                      </div>
                      {isAdmin && !member.isAdmin && member.phone !== currentUser.userPhone && (
                        <button 
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleRemoveMember(member.phone)}
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Leave Group Button (for non-admins) */}
              {!isAdmin && (
                <div className="mt-4">
                  <button 
                    className="btn btn-outline-danger w-100"
                    onClick={handleLeaveGroup}
                  >
                    <i className="fas fa-sign-out-alt me-2"></i>
                    Leave Group
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default GroupSettings;
