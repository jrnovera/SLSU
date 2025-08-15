import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Unauthorized() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the page they were trying to access before being redirected
  const from = location.state?.from?.pathname;
  
  const goBack = () => {
    navigate(-1);
  };

  return (
    <div className="unauthorized-container">
      <div className="unauthorized-content">
        <h1>Access Denied</h1>
        <div className="unauthorized-icon">🔒</div>
        <p>You don't have permission to access this page.</p>
        <p className="restricted-path">
          {from ? `Attempted path: ${from}` : 'This area requires higher privileges.'}
        </p>
        <div className="button-group">
          <button onClick={goBack} className="back-button">Go Back</button>
          {currentUser ? (
            <Link to="/" className="home-button">Back to Home</Link>
          ) : (
            <Link to="/login" className="login-button">Login</Link>
          )}
        </div>
      </div>
      <style jsx>{`
        .unauthorized-container {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          background-color: #f0eee2;
        }
        .unauthorized-content {
          text-align: center;
          padding: 40px;
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          max-width: 500px;
          width: 90%;
        }
        .unauthorized-icon {
          font-size: 64px;
          margin: 20px 0;
        }
        h1 {
          color: #1a3b5d;
          margin-bottom: 10px;
          font-size: 28px;
        }
        p {
          margin-bottom: 20px;
          color: #666;
          font-size: 18px;
        }
        .restricted-path {
          font-size: 14px;
          color: #888;
          font-style: italic;
          margin-bottom: 30px;
          word-break: break-word;
        }
        .button-group {
          display: flex;
          justify-content: center;
          gap: 15px;
          flex-wrap: wrap;
        }
        .back-button, .home-button, .login-button {
          display: inline-block;
          padding: 12px 24px;
          border-radius: 4px;
          text-decoration: none;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          border: none;
          font-size: 16px;
        }
        .back-button {
          background-color: #f5f5f5;
          color: #333;
          border: 1px solid #ddd;
        }
        .home-button, .login-button {
          background-color: #7FB3D5;
          color: white;
          font-weight: bold;
          transition: background-color 0.3s;
        }
        .back-button:hover {
          background-color: #1a3b5d;
        }
      `}</style>
    </div>
  );
}

export default Unauthorized;
