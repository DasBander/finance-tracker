import React, { useState } from 'react';
import {
  MDBCard,
  MDBCardBody,
  MDBBtn,
  MDBInput,
  MDBProgress,
  MDBProgressBar
} from 'mdb-react-ui-kit';

function SetupWizard({ onComplete }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form data
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [profileImage, setProfileImage] = useState(null);
  const [profileImageData, setProfileImageData] = useState(null);

  const totalSteps = 4;

  const getPasswordStrength = (pwd) => {
    if (pwd.length === 0) return { level: 0, text: '', color: 'secondary' };
    if (pwd.length < 6) return { level: 25, text: 'Too short', color: 'danger' };
    if (pwd.length < 8) return { level: 50, text: 'Weak', color: 'warning' };
    if (pwd.length < 12 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) {
      return { level: 75, text: 'Good', color: 'info' };
    }
    if (pwd.length >= 12 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd)) {
      return { level: 100, text: 'Strong', color: 'success' };
    }
    return { level: 50, text: 'Moderate', color: 'warning' };
  };

  const passwordStrength = getPasswordStrength(password);

  const handleUploadImage = async () => {
    const result = await window.electronAPI.image.upload('profile');
    if (result.success) {
      setProfileImage(result.imageKey);
      const imgResult = await window.electronAPI.image.get(result.imageKey);
      if (imgResult.success) {
        setProfileImageData(imgResult.data);
      }
    }
  };

  const nextStep = () => {
    setError('');

    // Validation
    if (step === 2) {
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
    }

    if (step === 4) {
      if (!name.trim()) {
        setError('Please enter your name');
        return;
      }
      finishSetup();
      return;
    }

    setStep(step + 1);
  };

  const prevStep = () => {
    setError('');
    setStep(step - 1);
  };

  const finishSetup = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await window.electronAPI.auth.completeSetup({
        name: name.trim(),
        currency,
        password,
        profileImage
      });

      if (result.success) {
        onComplete();
      } else {
        setError(result.error || 'Setup failed. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    }

    setLoading(false);
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="text-center">
            <div className="mb-4">
              <div
                className="rounded-circle d-inline-flex align-items-center justify-content-center mx-auto"
                style={{
                  width: 80,
                  height: 80,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                }}
              >
                <i className="fas fa-wallet text-white fa-2x"></i>
              </div>
            </div>
            <h3 className="fw-bold mb-3">Welcome to Finance Tracker</h3>
            <p className="text-muted mb-4">
              Your personal finance management solution. Track your income, expenses,
              and subscriptions all in one place.
            </p>
            <div className="bg-light rounded p-3 mb-4">
              <div className="d-flex align-items-center mb-2">
                <i className="fas fa-check-circle text-success me-2"></i>
                <span>Track income and expenses</span>
              </div>
              <div className="d-flex align-items-center mb-2">
                <i className="fas fa-check-circle text-success me-2"></i>
                <span>Manage subscriptions</span>
              </div>
              <div className="d-flex align-items-center mb-2">
                <i className="fas fa-check-circle text-success me-2"></i>
                <span>View spending trends and predictions</span>
              </div>
              <div className="d-flex align-items-center">
                <i className="fas fa-check-circle text-success me-2"></i>
                <span>Export data to CSV</span>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div>
            <div className="text-center mb-4">
              <div
                className="rounded-circle d-inline-flex align-items-center justify-content-center mx-auto mb-3"
                style={{
                  width: 60,
                  height: 60,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                }}
              >
                <i className="fas fa-lock text-white fa-lg"></i>
              </div>
              <h4 className="fw-bold">Create Master Password</h4>
              <p className="text-muted small">
                This password protects your financial data. Choose a strong password.
              </p>
            </div>

            <div className="mb-3">
              <MDBInput
                type="password"
                label="Master Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {password && (
                <div className="mt-2">
                  <MDBProgress height="6">
                    <MDBProgressBar
                      bgColor={passwordStrength.color}
                      width={passwordStrength.level}
                    />
                  </MDBProgress>
                  <small className={`text-${passwordStrength.color}`}>
                    {passwordStrength.text}
                  </small>
                </div>
              )}
            </div>

            <div className="mb-3">
              <MDBInput
                type="password"
                label="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              {confirmPassword && password !== confirmPassword && (
                <small className="text-danger">Passwords do not match</small>
              )}
              {confirmPassword && password === confirmPassword && password.length >= 6 && (
                <small className="text-success">
                  <i className="fas fa-check me-1"></i>Passwords match
                </small>
              )}
            </div>

            <div className="bg-light rounded p-3">
              <small className="text-muted">
                <i className="fas fa-info-circle me-1"></i>
                Password requirements: minimum 6 characters. For best security,
                use 12+ characters with uppercase, numbers, and symbols.
              </small>
            </div>
          </div>
        );

      case 3:
        return (
          <div>
            <div className="text-center mb-4">
              <div
                className="rounded-circle d-inline-flex align-items-center justify-content-center mx-auto mb-3"
                style={{
                  width: 60,
                  height: 60,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                }}
              >
                <i className="fas fa-coins text-white fa-lg"></i>
              </div>
              <h4 className="fw-bold">Select Currency</h4>
              <p className="text-muted small">
                Choose your primary currency for tracking finances.
              </p>
            </div>

            <div className="d-flex gap-3 justify-content-center mb-4">
              <div
                className={`currency-option p-4 rounded-3 text-center flex-grow-1 ${currency === 'EUR' ? 'border-primary border-2' : 'border'}`}
                style={{ cursor: 'pointer', maxWidth: '150px' }}
                onClick={() => setCurrency('EUR')}
              >
                <div
                  className={`rounded-circle d-inline-flex align-items-center justify-content-center mb-2 ${currency === 'EUR' ? 'bg-primary' : 'bg-light'}`}
                  style={{ width: 50, height: 50 }}
                >
                  <i className={`fas fa-euro-sign fa-lg ${currency === 'EUR' ? 'text-white' : 'text-muted'}`}></i>
                </div>
                <h5 className="mb-0">EUR</h5>
                <small className="text-muted">Euro</small>
              </div>

              <div
                className={`currency-option p-4 rounded-3 text-center flex-grow-1 ${currency === 'USD' ? 'border-primary border-2' : 'border'}`}
                style={{ cursor: 'pointer', maxWidth: '150px' }}
                onClick={() => setCurrency('USD')}
              >
                <div
                  className={`rounded-circle d-inline-flex align-items-center justify-content-center mb-2 ${currency === 'USD' ? 'bg-primary' : 'bg-light'}`}
                  style={{ width: 50, height: 50 }}
                >
                  <i className={`fas fa-dollar-sign fa-lg ${currency === 'USD' ? 'text-white' : 'text-muted'}`}></i>
                </div>
                <h5 className="mb-0">USD</h5>
                <small className="text-muted">US Dollar</small>
              </div>
            </div>

            <div className="bg-light rounded p-3 text-center">
              <small className="text-muted">
                <i className="fas fa-info-circle me-1"></i>
                You can change this later in the settings.
              </small>
            </div>
          </div>
        );

      case 4:
        return (
          <div>
            <div className="text-center mb-4">
              <h4 className="fw-bold">Set Up Your Profile</h4>
              <p className="text-muted small">
                Add your name and optional profile picture.
              </p>
            </div>

            {/* Profile Picture */}
            <div className="text-center mb-4">
              <div
                className="rounded-circle d-inline-flex align-items-center justify-content-center overflow-hidden mx-auto"
                style={{
                  width: 100,
                  height: 100,
                  background: profileImageData ? 'transparent' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  cursor: 'pointer',
                  border: '3px dashed #667eea'
                }}
                onClick={handleUploadImage}
              >
                {profileImageData ? (
                  <img src={profileImageData} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <i className="fas fa-camera text-white fa-2x"></i>
                )}
              </div>
              <div className="mt-2">
                <MDBBtn size="sm" color="link" onClick={handleUploadImage}>
                  <i className="fas fa-upload me-1"></i>
                  {profileImageData ? 'Change Photo' : 'Upload Photo'}
                </MDBBtn>
              </div>
            </div>

            {/* Name Input */}
            <div className="mb-4">
              <MDBInput
                label="Your Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>

            {/* Summary */}
            <div className="bg-light rounded p-3">
              <h6 className="fw-bold mb-2">
                <i className="fas fa-clipboard-check me-2"></i>Setup Summary
              </h6>
              <div className="d-flex align-items-center mb-1">
                <i className="fas fa-check text-success me-2"></i>
                <span>Master password configured</span>
              </div>
              <div className="d-flex align-items-center mb-1">
                <i className="fas fa-check text-success me-2"></i>
                <span>Currency: {currency}</span>
              </div>
              <div className="d-flex align-items-center">
                <i className={`fas fa-${name.trim() ? 'check text-success' : 'minus text-muted'} me-2`}></i>
                <span>Name: {name.trim() || '(not set)'}</span>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="setup-wizard d-flex align-items-center justify-content-center"
         style={{
           minHeight: '100vh',
           background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
         }}>
      <MDBCard className="shadow-lg" style={{ width: '500px', maxWidth: '95%' }}>
        <MDBCardBody className="p-4">
          {/* Progress */}
          <div className="mb-4">
            <div className="d-flex justify-content-between mb-2">
              <small className="text-muted">Step {step} of {totalSteps}</small>
              <small className="text-muted">{Math.round((step / totalSteps) * 100)}%</small>
            </div>
            <MDBProgress height="8">
              <MDBProgressBar
                width={(step / totalSteps) * 100}
                style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
              />
            </MDBProgress>
          </div>

          {/* Step Content */}
          <div className="step-content mb-4">
            {renderStep()}
          </div>

          {/* Error Message */}
          {error && (
            <div className="alert alert-danger py-2 mb-3" role="alert">
              <i className="fas fa-exclamation-circle me-2"></i>
              {error}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="d-flex justify-content-between">
            {step > 1 ? (
              <MDBBtn color="light" onClick={prevStep} disabled={loading}>
                <i className="fas fa-arrow-left me-2"></i>
                Back
              </MDBBtn>
            ) : (
              <div></div>
            )}

            <MDBBtn
              onClick={nextStep}
              disabled={loading}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none'
              }}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin me-2"></i>
                  Setting up...
                </>
              ) : step === totalSteps ? (
                <>
                  <i className="fas fa-check me-2"></i>
                  Finish Setup
                </>
              ) : (
                <>
                  Next
                  <i className="fas fa-arrow-right ms-2"></i>
                </>
              )}
            </MDBBtn>
          </div>
        </MDBCardBody>
      </MDBCard>
    </div>
  );
}

export default SetupWizard;
