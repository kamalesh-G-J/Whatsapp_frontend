import React, { useState, useEffect } from 'react';
import { API_BASE } from '../config';

function AddContact({ userPhone, onContactAdded, onClose }) {
  const [contactPhone, setContactPhone] = useState('');
  const [contactName, setContactName] = useState('');
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadContacts();
  }, [userPhone]);

  const loadContacts = async () => {
    try {
      const response = await fetch(`${API_BASE}/contacts?userPhone=${userPhone}`);
      if (response.ok) {
        const data = await response.json();
        setContacts(data.contacts || []);
      }
    } catch (err) {
      console.error('Error loading contacts:', err);
    }
  };

  const handleAddContact = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!contactPhone || !contactName) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userPhone,
          contactPhone,
          contactName
        })
      });

      const data = await response.json();

      if (data.success) {
        if (data.isRegistered) {
          setSuccess(`${contactName} is on WhatsApp! Chat created.`);
        } else {
          setSuccess(`Contact added! When ${contactName} joins WhatsApp, you can chat.`);
        }
        setContactPhone('');
        setContactName('');
        loadContacts();
        if (onContactAdded && data.chatCreated) {
          onContactAdded();
        }
      } else {
        setError(data.error || 'Failed to add contact');
      }
    } catch (err) {
      setError('Error adding contact. Please try again.');
    }
    setLoading(false);
  };

  const handleRemoveContact = async (phone) => {
    try {
      const response = await fetch(
        `${API_BASE}/contacts?userPhone=${userPhone}&contactPhone=${phone}`,
        { method: 'DELETE' }
      );
      if (response.ok) {
        loadContacts();
      }
    } catch (err) {
      console.error('Error removing contact:', err);
    }
  };

  return (
    <div className="add-contact-modal">
      <div className="add-contact-content">
        <div className="add-contact-header">
          <h5><i className="fas fa-user-plus me-2"></i>Add Contact</h5>
          <button className="btn-close" onClick={onClose}></button>
        </div>
        
        <div className="add-contact-body">
          <form onSubmit={handleAddContact}>
            <div className="mb-3">
              <label className="form-label">Contact Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter name"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Phone Number</label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter phone number"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
              />
            </div>
            
            {error && <div className="alert alert-danger py-2">{error}</div>}
            {success && <div className="alert alert-success py-2">{success}</div>}
            
            <button 
              type="submit" 
              className="btn btn-success w-100"
              disabled={loading}
            >
              {loading ? 'Adding...' : 'Add Contact'}
            </button>
          </form>

          {contacts.length > 0 && (
            <div className="contacts-list mt-4">
              <h6>Your Contacts ({contacts.length})</h6>
              <div className="list-group">
                {contacts.map((contact, index) => (
                  <div key={index} className="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                      <div className="contact-name">
                        {contact.contactDisplayName || contact.contactName}
                        {contact.isRegistered && (
                          <span className="badge bg-success ms-2">
                            <i className="fab fa-whatsapp"></i> On WhatsApp
                          </span>
                        )}
                      </div>
                      <small className="text-muted">{contact.contactPhone}</small>
                    </div>
                    <button 
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleRemoveContact(contact.contactPhone)}
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AddContact;
