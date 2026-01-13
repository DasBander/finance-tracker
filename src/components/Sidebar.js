import React, { useState, useEffect } from 'react';
import {
  MDBListGroup,
  MDBListGroupItem,
  MDBBadge,
  MDBBtn,
  MDBModal,
  MDBModalDialog,
  MDBModalContent,
  MDBModalHeader,
  MDBModalTitle,
  MDBModalBody,
  MDBModalFooter,
  MDBInput
} from 'mdb-react-ui-kit';

function Sidebar({ activePage, onNavigate, stats, currency, onCurrencyChange }) {
  const [profile, setProfile] = useState({ name: 'User', profileImage: null });
  const [profileImageData, setProfileImageData] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editName, setEditName] = useState('');

  const menuItems = [
    { id: 'dashboard', icon: 'fas fa-tachometer-alt', label: 'Dashboard' },
    { id: 'history', icon: 'fas fa-history', label: 'History', color: 'primary' },
    { id: 'income', icon: 'fas fa-arrow-down', label: 'Income Stream', color: 'success' },
    { id: 'outgoing', icon: 'fas fa-arrow-up', label: 'Outgoing', color: 'danger' },
    { id: 'predictions', icon: 'fas fa-chart-line', label: 'Predictions', color: 'info' },
    { id: 'providers', icon: 'fas fa-credit-card', label: 'Payment Providers' }
  ];

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const result = await window.electronAPI.db.getSettings();
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

  const handleUploadProfileImage = async () => {
    const result = await window.electronAPI.image.upload('profile');
    if (result.success) {
      await window.electronAPI.db.updateSettings({ profileImage: result.imageKey });
      loadProfile();
    }
  };

  const openProfileModal = () => {
    setEditName(profile.name || '');
    setShowProfileModal(true);
  };

  const saveProfile = async () => {
    await window.electronAPI.db.updateSettings({ name: editName });
    setProfile({ ...profile, name: editName });
    setShowProfileModal(false);
  };

  const formatCurrency = (amount) => {
    if (currency === 'EUR') {
      return (amount || 0).toLocaleString('de-DE', { minimumFractionDigits: 2 }) + ' €';
    }
    return '$' + (amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });
  };

  return (
    <div className="sidebar bg-white shadow-sm">
      {/* Profile Section */}
      <div className="sidebar-header p-4 border-bottom">
        <div className="d-flex align-items-center">
          <div
            className="profile-avatar rounded-circle d-flex align-items-center justify-content-center overflow-hidden"
            style={{
              width: 50,
              height: 50,
              background: profileImageData ? 'transparent' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              cursor: 'pointer'
            }}
            onClick={handleUploadProfileImage}
            title="Click to change profile picture"
          >
            {profileImageData ? (
              <img src={profileImageData} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <i className="fas fa-user text-white fa-lg"></i>
            )}
          </div>
          <div className="ms-3 flex-grow-1">
            <h6
              className="mb-0 fw-bold d-flex align-items-center"
              style={{ cursor: 'pointer' }}
              onClick={openProfileModal}
            >
              {profile.name}
              <i className="fas fa-pen ms-2 text-muted" style={{ fontSize: '10px' }}></i>
            </h6>
            <small className="text-muted">Finance Tracker</small>
          </div>
        </div>
      </div>

      {/* Balance Card */}
      <div className="p-3 border-bottom">
        <div className="d-flex align-items-center p-3 rounded" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <div className="rounded-circle bg-white bg-opacity-25 d-flex align-items-center justify-content-center"
               style={{ width: 40, height: 40 }}>
            <i className={`fas fa-${currency === 'EUR' ? 'euro-sign' : 'dollar-sign'} text-white`}></i>
          </div>
          <div className="ms-3">
            <small className="text-white-50">Balance</small>
            <h5 className={`mb-0 fw-bold text-white`}>
              {formatCurrency(stats.balance)}
            </h5>
          </div>
        </div>
      </div>

      <div className="p-3">
        <small className="text-muted text-uppercase fw-bold">
          <i className="fas fa-bars me-2"></i>Menu
        </small>
      </div>

      <MDBListGroup flush className="sidebar-nav">
        {menuItems.map((item) => (
          <MDBListGroupItem
            key={item.id}
            action
            active={activePage === item.id}
            onClick={() => onNavigate(item.id)}
            className="d-flex align-items-center border-0 px-4 py-3"
            style={{ cursor: 'pointer' }}
          >
            <i
              className={`${item.icon} me-3 ${item.color ? `text-${item.color}` : ''}`}
              style={{ width: 20, textAlign: 'center' }}
            ></i>
            <span>{item.label}</span>
            {item.id === 'income' && stats.totalIncome > 0 && (
              <MDBBadge color="success" pill className="ms-auto">
                +{formatCurrency(stats.totalIncome)}
              </MDBBadge>
            )}
            {item.id === 'outgoing' && stats.totalOutgoing > 0 && (
              <MDBBadge color="danger" pill className="ms-auto">
                -{formatCurrency(stats.totalOutgoing)}
              </MDBBadge>
            )}
          </MDBListGroupItem>
        ))}
      </MDBListGroup>

      <div className="mt-auto p-4 border-top">
        <small className="text-muted">
          <i className="fas fa-info-circle me-2"></i>
          Finance Tracker v1.0
        </small>
      </div>

      {/* Profile Edit Modal */}
      <MDBModal open={showProfileModal} setOpen={setShowProfileModal} tabIndex="-1">
        <MDBModalDialog centered>
          <MDBModalContent>
            <MDBModalHeader>
              <MDBModalTitle>
                <i className="fas fa-user-edit me-2"></i>
                Edit Profile
              </MDBModalTitle>
              <MDBBtn className="btn-close" color="none" onClick={() => setShowProfileModal(false)} />
            </MDBModalHeader>
            <MDBModalBody className="p-4">
              <div className="text-center mb-4">
                <div
                  className="profile-avatar rounded-circle d-inline-flex align-items-center justify-content-center overflow-hidden mx-auto"
                  style={{
                    width: 100,
                    height: 100,
                    background: profileImageData ? 'transparent' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    cursor: 'pointer'
                  }}
                  onClick={handleUploadProfileImage}
                >
                  {profileImageData ? (
                    <img src={profileImageData} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <i className="fas fa-user text-white fa-3x"></i>
                  )}
                </div>
                <MDBBtn size="sm" color="link" onClick={handleUploadProfileImage} className="mt-2">
                  <i className="fas fa-camera me-2"></i>Change Photo
                </MDBBtn>
              </div>
              <MDBInput
                label="Your Name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </MDBModalBody>
            <MDBModalFooter>
              <MDBBtn color="secondary" onClick={() => setShowProfileModal(false)}>
                Cancel
              </MDBBtn>
              <MDBBtn color="primary" onClick={saveProfile}>
                <i className="fas fa-save me-2"></i>Save
              </MDBBtn>
            </MDBModalFooter>
          </MDBModalContent>
        </MDBModalDialog>
      </MDBModal>
    </div>
  );
}

export default Sidebar;
