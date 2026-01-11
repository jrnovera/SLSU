import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import ReCAPTCHA from 'react-google-recaptcha';
import { RECAPTCHA_SITE_KEY } from '../config/recaptcha';
import logoPNG from '../assets/icons/logoPNG.png';
import './SignUp.css';

function Signup() {
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('Chieftain'); 
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();
  const recaptchaRef = useRef(null);
  
  // Reset form fields on component mount
  useEffect(() => {
    // Clear all fields on mount
    setEmail('');
    setDisplayName('');
    setPassword('');
    setConfirmPassword('');
    setRole('Chieftain');
    
    // Force reset any browser-saved values with a slight delay
    const resetTimer = setTimeout(() => {
      setEmail('');
      setDisplayName('');
      setPassword('');
      setConfirmPassword('');
      
      // Try to reset any form elements directly
      const emailInput = document.getElementById('email');
      const nameInput = document.getElementById('displayName');
      const passwordInput = document.getElementById('password');
      const confirmInput = document.getElementById('confirmPassword');
      
      if (emailInput) emailInput.value = '';
      if (nameInput) nameInput.value = '';
      if (passwordInput) passwordInput.value = '';
      if (confirmInput) confirmInput.value = '';
    }, 100);
    
    return () => clearTimeout(resetTimer);
  }, []);

  // Function to clear form fields completely
  const clearFormFields = () => {
    setEmail('');
    setDisplayName('');
    setPassword('');
    setConfirmPassword('');
    setRole('Chieftain');
    setRecaptchaToken(null);
    
    // Reset reCAPTCHA
    if (recaptchaRef.current) {
      recaptchaRef.current.reset();
    }
    
    // Try to reset any form elements directly
    const emailInput = document.getElementById('email');
    const nameInput = document.getElementById('displayName');
    const passwordInput = document.getElementById('password');
    const confirmInput = document.getElementById('confirmPassword');
    
    if (emailInput) emailInput.value = '';
    if (nameInput) nameInput.value = '';
    if (passwordInput) passwordInput.value = '';
    if (confirmInput) confirmInput.value = '';
  };

  // Password validation function
  const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSymbols = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    if (password.length < minLength) {
      return "Password must be at least 8 characters long";
    }
    if (!hasUpperCase) {
      return "Password must contain at least one uppercase letter";
    }
    if (!hasLowerCase) {
      return "Password must contain at least one lowercase letter";
    }
    if (!hasNumbers) {
      return "Password must contain at least one number";
    }
    if (!hasSymbols) {
      return "Password must contain at least one symbol (!@#$%^&*(),.?\":{}|<>)";
    }
    return null; // Password is valid
  };

  // Handle reCAPTCHA change
  const handleRecaptchaChange = (token) => {
    setRecaptchaToken(token);
    if (!token) {
      setError('');
    }
  };
  
  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // We're not saving form data to ensure fields are empty after logout

    // Validate form
    if (!displayName.trim()) {
      return setError("Display name is required");
    }

    // Validate password strength
    const passwordError = validatePassword(password);
    if (passwordError) {
      return setError(passwordError);
    }

    if (password !== confirmPassword) {
      return setError("Passwords do not match!");
    }


    if (!recaptchaToken) {
      return setError("Please complete the reCAPTCHA verification");
    }

    setLoading(true);

    try {
      // Create user with Firebase Authentication and set role
      const userCredential = await signup(email, password, displayName, role);
      
      // Clear password fields and reCAPTCHA after successful signup
      setPassword('');
      setConfirmPassword('');
      setRecaptchaToken(null);
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
      }
      
      // Show success message and redirect to login
      setSuccess('Account created successfully! Please check your email to verify your account before logging in.');
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      console.error('Signup error:', error);
      if (error.code === 'auth/email-already-in-use') {
        setError('Email is already in use');
      } else if (error.code === 'auth/invalid-email') {
        setError('Invalid email address');
      } else if (error.code === 'auth/weak-password') {
        setError('Password is too weak');
      } else {
        setError('Failed to create an account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="signup-container">
      <div className="signup-card">
        <div className="signup-header">
           <img src={logoPNG} alt="LIKHA Logo" className="h-20 inline-block object-contain" />
          <h2>Create Account</h2>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        {/* Hidden dummy form to trick browser autofill */}
        <div style={{ display: 'none' }}>
          <input type="text" name="email" />
          <input type="text" name="displayName" />
          <input type="password" name="password" />
          <input type="password" name="confirmPassword" />
          <select name="role"></select>
        </div>
        
        <form onSubmit={handleSignup} className="signup-form" autoComplete="off" spellCheck="false" data-form-type="other">
          <div className="form-group">
            <label htmlFor="displayName">Full Name</label>
            <input
              id="displayName"
              type="text"
              placeholder="Enter your full name"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="form-input"
              autoComplete="new-password"
              name="bantay_lahi_displayName"
              autoCorrect="off"
              data-form-type="name"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              autoComplete="new-password"
              name="bantay_lahi_signup_email"
              autoCorrect="off"
              autoCapitalize="none"
              data-form-type="email"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-container">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                autoComplete="new-password"
                name="bantay_lahi_signup_password"
                autoCorrect="off"
                autoCapitalize="none"
                data-form-type="password"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
            <div className="password-requirements">
              <small className="password-hint">Password must contain:</small>
              <ul className="requirements-list">
                <li className={password.length >= 8 ? 'valid' : 'invalid'}>
                  ✓ At least 8 characters
                </li>
                <li className={/[A-Z]/.test(password) ? 'valid' : 'invalid'}>
                  ✓ One uppercase letter (A-Z)
                </li>
                <li className={/[a-z]/.test(password) ? 'valid' : 'invalid'}>
                  ✓ One lowercase letter (a-z)
                </li>
                <li className={/\d/.test(password) ? 'valid' : 'invalid'}>
                  ✓ One number (0-9)
                </li>
                <li className={/[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'valid' : 'invalid'}>
                  ✓ One symbol (!@#$%^&*)
                </li>
              </ul>
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="password-input-container">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="form-input"
                autoComplete="new-password"
                name="bantay_lahi_confirm_password"
                autoCorrect="off"
                autoCapitalize="none"
                data-form-type="password"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="role">User Role</label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="form-input"
              autoComplete="new-password"
              name="bantay_lahi_role"
              data-form-type="other"
            >
              <option value="Chieftain">Chieftain</option>
              <option value="IPMR">IPMR</option>
            </select>
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
            className="signup-button" 
            disabled={loading || !recaptchaToken}
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>
        
        <div className="signup-footer">
          <p>
            Already have an account? <Link to="/login" className="login-link">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Signup;
