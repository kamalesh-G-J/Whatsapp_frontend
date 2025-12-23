import React, { useState } from 'react';
import { API_BASE } from '../config';

function LoginPage({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // Login
        const response = await fetch(`${API_BASE}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (data.success) {
          localStorage.setItem('sessionId', data.sessionId);
          localStorage.setItem('user', JSON.stringify(data.user));
          onLogin(data.user, data.sessionId);
        } else {
          setError(data.error || 'Login failed');
        }
      } else {
        // Register
        if (!phone) {
          setError('Phone number is required');
          setLoading(false);
          return;
        }

        const response = await fetch(`${API_BASE}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password, phone })
        });

        const data = await response.json();

        if (data.success) {
          setError('');
          setIsLogin(true);
          alert('Registration successful! Please login.');
        } else {
          setError(data.error || 'Registration failed');
        }
      }
    } catch (err) {
      setError('Server connection failed. Make sure the backend is running.');
    }

    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="whatsapp-logo">
            <i className="fab fa-whatsapp"></i>
          </div>
          <h1>WhatsApp</h1>
          <p className="subtitle">Send and receive messages instantly</p>
        </div>

        <div className="login-card">
          <div className="login-tabs">
            <button 
              className={`tab ${isLogin ? 'active' : ''}`}
              onClick={() => { setIsLogin(true); setError(''); }}
            >
              Login
            </button>
            <button 
              className={`tab ${!isLogin ? 'active' : ''}`}
              onClick={() => { setIsLogin(false); setError(''); }}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
            </div>

            {!isLogin && (
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter your phone number"
                  required={!isLogin}
                />
              </div>
            )}

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? (
                <span><i className="fas fa-spinner fa-spin"></i> Please wait...</span>
              ) : (
                isLogin ? 'Login' : 'Register'
              )}
            </button>
          </form>

          <div className="login-info">
            <p className="text-muted">
              {isLogin 
                ? "Don't have an account? Click Register above." 
                : "Enter your details to create a new account."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
