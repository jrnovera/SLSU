import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../firebase/config';
import './VerifyEmail.css';

function VerifyEmail() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { currentUser, resendVerificationEmail, refreshUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleResendEmail = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await resendVerificationEmail();
      setMessage('Verification email sent! Please check your inbox.');
    } catch (error) {
      console.error('Error resending verification email:', error);
      setError('Failed to send verification email. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleCheckVerification = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await refreshUser();
      if (auth.currentUser?.emailVerified) {
        navigate('/', { replace: true });
      } else {
        setError('Still not verified. Please click the link in your email, then try again.');
      }
    } catch (err) {
      console.error('Verification check failed:', err);
      setError('Could not verify status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="verify-email-container">
      <div className="verify-email-card">
        <div className="verify-email-header">
          <h1 className="likha-brand">LIKHA</h1>
          <h2>Email Verification Required</h2>
        </div>

        <div className="verify-email-content">
          <div className="alert-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>

          <p className="verify-message">
            Please verify your email address to continue using LIKHA.
          </p>

          <p className="verify-email-address">
            A verification email has been sent to: <strong>{currentUser?.email}</strong>
          </p>

          <p className="verify-instructions">
            Click the link in the email to verify your account. After verifying, click the button below to continue.
          </p>

          {message && <div className="success-message">{message}</div>}
          {error && <div className="error-message">{error}</div>}

          <div className="verify-actions">
            <button 
              onClick={handleCheckVerification}
              className="verify-button primary"
              disabled={loading}
            >
              {loading ? 'Checking...' : "I've Verified My Email"}
            </button>

            <button 
              onClick={handleResendEmail}
              className="verify-button secondary"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Resend Verification Email'}
            </button>

            <button 
              onClick={handleLogout}
              className="verify-button tertiary"
              disabled={loading}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VerifyEmail;
