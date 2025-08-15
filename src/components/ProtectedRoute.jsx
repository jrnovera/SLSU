import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './ProtectedRoute.css';

// Protected route for any authenticated user
export function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth();
  const location = useLocation();
  
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }
  
  if (!currentUser) {
    // Redirect to login but remember where they were trying to go
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return children;
}

// Protected route specifically for admin users
export function AdminRoute({ children }) {
  const { currentUser, userRole, loading } = useAuth();
  const location = useLocation();
  
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }
  
  if (!currentUser) {
    // Redirect to login but remember where they were trying to go
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  if (userRole !== 'admin' && userRole !== 'super_admin') {
    return <Navigate to="/unauthorized" state={{ from: location }} replace />;
  }
  
  return children;
}

// Protected route specifically for super admin users
export function SuperAdminRoute({ children }) {
  const { currentUser, userRole, loading } = useAuth();
  const location = useLocation();
  
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }
  
  if (!currentUser) {
    // Redirect to login but remember where they were trying to go
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  if (userRole !== 'super_admin') {
    return <Navigate to="/unauthorized" state={{ from: location }} replace />;
  }
  
  return children;
}
