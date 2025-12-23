import React from 'react';

function UserProfile({ user, onLogout }) {
  const handleLogout = (e) => {
    e.preventDefault();
    if (window.confirm('Are you sure you want to logout?')) {
      onLogout();
    }
  };

  return (
    <div className="user-profile d-flex align-items-center">
      <div className="position-relative me-3">
        <div className="avatar">
          {user?.userName?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        <div className="online-status"></div>
      </div>
      <div className="flex-grow-1">
        <h6 className="mb-0">{user?.userName || 'User'}</h6>
        <small className="text-light opacity-75">{user?.userPhone || ''}</small>
      </div>
      <div className="d-flex align-items-center gap-2">
        <button 
          className="btn btn-outline-light btn-sm logout-btn"
          onClick={handleLogout}
          title="Logout"
        >
          <i className="fas fa-sign-out-alt"></i>
        </button>
        <div className="dropdown">
          <button className="btn btn-link text-white p-0" data-bs-toggle="dropdown">
            <i className="fas fa-ellipsis-v"></i>
          </button>
          <ul className="dropdown-menu">
            <li><a className="dropdown-item" href="#profile"><i className="fas fa-user me-2"></i>Profile</a></li>
            <li><a className="dropdown-item" href="#settings"><i className="fas fa-cog me-2"></i>Settings</a></li>
            <li><hr className="dropdown-divider" /></li>
            <li><a className="dropdown-item text-danger" href="#logout" onClick={handleLogout}><i className="fas fa-sign-out-alt me-2"></i>Logout</a></li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default UserProfile;