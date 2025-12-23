import React, { useState, useEffect } from 'react';
import { API_BASE } from '../config';

function CreateGroup({ userPhone, onGroupCreated, onClose }) {
  const [groupName, setGroupName] = useState('');
  const [contacts, setContacts] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadContacts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userPhone]);

  const loadContacts = async () => {
    try {
      const response = await fetch(`${API_BASE}/contacts?userPhone=${userPhone}`);
      if (response.ok) {
        const data = await response.json();
        // Filter only registered contacts
        const registeredContacts = (data.contacts || []).filter(c => c.isRegistered);
        setContacts(registeredContacts);
      }
    } catch (err) {
      console.error('Error loading contacts:', err);
    }
  };

  const toggleMember = (phone) => {
    setSelectedMembers(prev => {
      if (prev.includes(phone)) {
        return prev.filter(p => p !== phone);
      } else {
        return [...prev, phone];
      }
    });
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setError('');

    if (!groupName.trim()) {
      setError('Please enter a group name');
      return;
    }

    if (selectedMembers.length === 0) {
      setError('Please select at least one member');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupName: groupName.trim(),
          creatorPhone: userPhone,
          members: selectedMembers
        })
      });

      const data = await response.json();

      if (data.success) {
        if (onGroupCreated) {
          onGroupCreated();
        }
        onClose();
      } else {
        setError(data.error || 'Failed to create group');
      }
    } catch (err) {
      setError('Error creating group. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="create-group-modal">
      <div className="create-group-content">
        <div className="create-group-header">
          <h5><i className="fas fa-users me-2"></i>Create Group</h5>
          <button className="btn-close" onClick={onClose}></button>
        </div>

        <div className="create-group-body">
          <form onSubmit={handleCreateGroup}>
            <div className="mb-3">
              <label className="form-label">Group Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter group name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label className="form-label">
                Select Members ({selectedMembers.length} selected)
              </label>
              
              {contacts.length === 0 ? (
                <div className="alert alert-info py-2">
                  <i className="fas fa-info-circle me-2"></i>
                  No contacts available. Add contacts who are on WhatsApp first.
                </div>
              ) : (
                <div className="members-list">
                  {contacts.map((contact, index) => (
                    <div 
                      key={index} 
                      className={`member-item ${selectedMembers.includes(contact.contactPhone) ? 'selected' : ''}`}
                      onClick={() => toggleMember(contact.contactPhone)}
                    >
                      <div className="member-avatar">
                        {(contact.contactDisplayName || contact.contactName || '?').charAt(0).toUpperCase()}
                      </div>
                      <div className="member-info">
                        <div className="member-name">
                          {contact.contactDisplayName || contact.contactName}
                        </div>
                        <small className="text-muted">{contact.contactPhone}</small>
                      </div>
                      <div className="member-checkbox">
                        {selectedMembers.includes(contact.contactPhone) ? (
                          <i className="fas fa-check-circle text-success"></i>
                        ) : (
                          <i className="far fa-circle text-muted"></i>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {error && <div className="alert alert-danger py-2">{error}</div>}

            <button
              type="submit"
              className="btn btn-success w-100"
              disabled={loading || selectedMembers.length === 0}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Creating...
                </>
              ) : (
                <>
                  <i className="fas fa-plus me-2"></i>
                  Create Group
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CreateGroup;
