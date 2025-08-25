import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUserRole } from '../firebase/config';
import './ProtectedRoute.css';

function RoleBasedRedirect() {
  const { currentUser, loading } = useAuth();
  const [userRole, setUserRole] = useState(null);
  const [checkingRole, setCheckingRole] = useState(true);

  useEffect(() => {
    const checkUserRole = async () => {
      if (currentUser) {
        try {
          const role = await getUserRole(currentUser.uid);
          setUserRole(role);
        } catch (error) {
          console.error('Error checking user role:', error);
          setUserRole('user'); // Default to user on error
        }
      }
      setCheckingRole(false);
    };

    if (!loading) {
      checkUserRole();
    }
  }, [currentUser, loading]);

  if (loading || checkingRole) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Redirect based on user role
  if (userRole === 'IPMR') {
    return <Navigate to="/super-admin" replace />;
  } else if (userRole === 'Chieftain') {
    return <Navigate to="/admin" replace />;
  } else {
    return <Navigate to="/home" replace />;
  }
}

export default RoleBasedRedirect;
