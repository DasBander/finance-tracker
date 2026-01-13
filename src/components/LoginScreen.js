import React, { useState, useEffect } from 'react';
import {
  MDBCard,
  MDBCardBody,
  MDBBtn,
  MDBInput
} from 'mdb-react-ui-kit';

function LoginScreen({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({ name: 'User', profileImage: null });
  const [profileImageData, setProfileImageData] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const result = await window.electronAPI.auth.getProfile();
    if (result.success) {
      setProfile(result.data);
      if (result.data.profileImage) {
        const imgResult = await window.electronAPI.image.get(result.data.profileImage);
        if (imgResult.success) {
          setProfileImageData(imgResult.data);
        }
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await window.electronAPI.auth.verifyPassword(password);
      if (result.success && result.isValid) {
        onLogin();
      } else {
        setError('Incorrect password. Please try again.');
        setPassword('');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    }

    setLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <div className="login-screen d-flex align-items-center justify-content-center"
         style={{
           minHeight: '100vh',
           background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
         }}>
      <MDBCard className="shadow-lg" style={{ width: '400px', maxWidth: '90%' }}>
        <MDBCardBody className="p-5">
          <div className="text-center mb-4">
            {/* Profile Picture */}
            <div
              className="rounded-circle d-inline-flex align-items-center justify-content-center overflow-hidden mx-auto mb-3"
              style={{
                width: 100,
                height: 100,
                background: profileImageData ? 'transparent' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: '4px solid #fff',
                boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
              }}
            >
              {profileImageData ? (
                <img
                  src={profileImageData}
                  alt="Profile"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <i className="fas fa-user text-white fa-3x"></i>
              )}
            </div>

            {/* Welcome Message */}
            <h4 className="fw-bold text-dark mb-1">Welcome back!</h4>
            <p className="text-muted mb-0">{profile.name}</p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Password Input */}
            <div className="mb-4">
              <MDBInput
                type="password"
                label="Master Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                autoFocus
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="alert alert-danger py-2 mb-4" role="alert">
                <i className="fas fa-exclamation-circle me-2"></i>
                {error}
              </div>
            )}

            {/* Unlock Button */}
            <MDBBtn
              type="submit"
              className="w-100"
              size="lg"
              disabled={loading}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none'
              }}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin me-2"></i>
                  Unlocking...
                </>
              ) : (
                <>
                  <i className="fas fa-unlock me-2"></i>
                  Unlock
                </>
              )}
            </MDBBtn>
          </form>

          {/* App Info */}
          <div className="text-center mt-4">
            <small className="text-muted">
              <i className="fas fa-shield-alt me-1"></i>
              Finance Tracker v1.0
            </small>
          </div>
        </MDBCardBody>
      </MDBCard>
    </div>
  );
}

export default LoginScreen;
