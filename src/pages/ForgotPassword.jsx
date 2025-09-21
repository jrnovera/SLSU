import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase/config';
import ReCAPTCHA from 'react-google-recaptcha';
import { RECAPTCHA_SITE_KEY } from '../config/recaptcha';
import './ForgotPassword.css';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const [emailSent, setEmailSent] = useState(false);
  const [lastSentEmail, setLastSentEmail] = useState('');
  const recaptchaRef = useRef(null);

  // Handle reCAPTCHA change
  const handleRecaptchaChange = (token) => {
    setRecaptchaToken(token);
    if (!token) {
      setError('');
    }
  };

  // Function to reset the form and allow sending another email
  const handleSendAnotherEmail = () => {
    setEmailSent(false);
    setMessage('');
    setError('');
    setEmail('');
    setRecaptchaToken(null);
    if (recaptchaRef.current) {
      recaptchaRef.current.reset();
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    // Validate email
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    // Validate reCAPTCHA
    if (!recaptchaToken) {
      setError('Please complete the reCAPTCHA verification');
      return;
    }

    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setEmailSent(true);
      setLastSentEmail(email);
      setMessage('Password reset instructions have been sent to your email address.');
      setRecaptchaToken(null);
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
      }
    } catch (error) {
      console.error('Password reset error:', error);
      
      switch (error.code) {
        case 'auth/user-not-found':
          setError('No account found with this email address');
          break;
        case 'auth/invalid-email':
          setError('Invalid email address');
          break;
        case 'auth/too-many-requests':
          setError('Too many requests. Please try again later');
          break;
        default:
          setError('Failed to send password reset email. Please try again');
          break;
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-card">
        <div className="forgot-password-header">
          <h1>Bantay Lahi</h1>
          <h2>Reset Password</h2>
          <p className="forgot-password-description">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        {emailSent ? (
          <div className="email-sent-container">
            <div className="success-message">
              <div className="success-icon">✓</div>
              <div className="success-content">
                <h3>Email Sent Successfully!</h3>
                <p>{message}</p>
                <div className="email-address-info">
                  <strong>Sent to:</strong> {lastSentEmail}
                </div>
              </div>
            </div>
            
            <div className="email-instructions">
              <h4>What to do next:</h4>
              <ul>
                <li>Check your email inbox for the password reset link</li>
                <li>If you don't see the email, check your spam/junk folder</li>
                <li>The reset link will expire in 1 hour for security reasons</li>
                <li>Click the link in the email to create a new password</li>
              </ul>
            </div>
            
            <div className="resend-options">
              <p className="resend-text">
                <strong>Didn't receive the email?</strong>
              </p>
              <div className="resend-actions">
                <button 
                  type="button"
                  className="resend-button"
                  onClick={handleSendAnotherEmail}
                >
                  Send to Different Email
                </button>
                <p className="resend-hint">
                  You can also try sending to the same email address again
                </p>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleResetPassword} className="forgot-password-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email address"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                autoComplete="email"
                autoCorrect="off"
                autoCapitalize="none"
              />
            </div>
            
            <div className="form-group recaptcha-container">
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={RECAPTCHA_SITE_KEY}
                onChange={handleRecaptchaChange}
                onExpired={() => setRecaptchaToken(null)}
                onError={() => {
                  setRecaptchaToken(null);
                  setError('reCAPTCHA error occurred. Please try again.');
                }}
              />
            </div>
            
            <button 
              type="submit" 
              className="reset-button" 
              disabled={loading || !recaptchaToken}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        )}
        
        <div className="forgot-password-footer">
          <p>
            Remember your password? <Link to="/login" className="login-link">Back to Login</Link>
          </p>
          <p>
            Don't have an account? <Link to="/signup" className="signup-link">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
