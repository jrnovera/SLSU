import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUserRole } from '../firebase/config';
import ReCAPTCHA from 'react-google-recaptcha';
import { RECAPTCHA_SITE_KEY } from '../config/recaptcha';
import './Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const recaptchaRef = useRef(null);
  
  // We're intentionally not loading saved form data to ensure fields are empty after logout
  
  // Get the page they were trying to access before being redirected to login
  const from = location.state?.from?.pathname || "/";

  // Reset form fields on component mount
  useEffect(() => {
    // Clear fields on mount
    setEmail('');
    setPassword('');
    
    // Force reset any browser-saved values
    const resetTimer = setTimeout(() => {
      setEmail('');
      setPassword('');
      
      // Try to reset any form elements directly
      const emailInput = document.getElementById('email');
      const passwordInput = document.getElementById('password');
      if (emailInput) emailInput.value = '';
      if (passwordInput) passwordInput.value = '';
    }, 100);
    
    return () => clearTimeout(resetTimer);
  }, []);

  // Function to clear form fields completely
  const clearFormFields = () => {
    setEmail('');
    setPassword('');
    setRecaptchaToken(null);
    
    // Reset reCAPTCHA
    if (recaptchaRef.current) {
      recaptchaRef.current.reset();
    }
    
    // Try to reset any form elements directly
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    if (emailInput) emailInput.value = '';
    if (passwordInput) passwordInput.value = '';
  };

  // Handle reCAPTCHA change
  const handleRecaptchaChange = (token) => {
    setRecaptchaToken(token);
    if (!token) {
      setError('');
    }
  };
  
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate reCAPTCHA
    if (!recaptchaToken) {
      return setError("Please complete the reCAPTCHA verification");
    }
    
    setLoading(true);
    
    // We're not saving form data to ensure fields are empty after logout
    
    try {
      const userCredential = await login(email, password);
      
      // Check if the user is IPMR (admin) and redirect accordingly
      const userRole = await getUserRole(userCredential.user.uid);
      
      if (userRole === 'IPMR') {
        navigate('/admin', { replace: true });
      } else {
        // Navigate to the page they were trying to access, or home if they came directly to login
        navigate(from, { replace: true });
      }
      
      // Clear password field and reCAPTCHA after successful login
      setPassword('');
      setRecaptchaToken(null);
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        setError('Invalid email or password');
      } else if (error.code === 'auth/too-many-requests') {
        setError('Too many failed login attempts. Please try again later.');
      } else {
        setError('Failed to log in. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Bantay Lahi</h1>
          <h2>Login</h2>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        {/* Hidden dummy form to trick browser autofill */}
        <div style={{ display: 'none' }}>
          <input type="text" name="email" />
          <input type="password" name="password" />
        </div>
        
        <form onSubmit={handleLogin} className="login-form" autoComplete="off" spellCheck="false" data-form-type="other">
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
              name="bantay_lahi_email"
              autoCorrect="off"
              autoCapitalize="none"
              data-form-type="email"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              autoComplete="new-password"
              name="bantay_lahi_password"
              autoCorrect="off"
              autoCapitalize="none"
              data-form-type="password"
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
            className="login-button" 
            disabled={loading || !recaptchaToken}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <div className="login-footer">
          <p>
            <Link to="/forgot-password" className="forgot-password-link">Forgot your password?</Link>
          </p>
          <p>
            Don't have an account? <Link to="/signup" className="signup-link">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
