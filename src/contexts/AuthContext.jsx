import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

const AuthContext = createContext();
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const inactivityTimerRef = useRef(null);

  // Sign up function
  async function signup(email, password, displayName, role = 'user') {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile with display name
      await updateProfile(userCredential.user, { displayName });
      
      // Create user document in Firestore with specified role (or default to regular user)
      await setDoc(doc(db, "users", userCredential.user.uid), {
        email,
        displayName,
        role: role, // Use the provided role or default to 'user'
        createdAt: new Date()
      });
      
      return userCredential;
    } catch (error) {
      throw error;
    }
  }

  // Login function
  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  // Logout function
  function logout() {
    // Clear all stored form data
    localStorage.clear(); // This will clear all localStorage items
    
    // If you need to keep some specific localStorage items, use this approach instead:
    // localStorage.removeItem('loginFormData');
    // localStorage.removeItem('signupFormData');
    
    // Clear browser's autofill data for login/signup forms
    // We'll handle this in the components by setting autocomplete="off"
    
    return signOut(auth);
  }

  // Get user role from Firestore
  async function getUserRole(uid) {
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        const rawRole = userDoc.data().role || 'user';
        if (rawRole === 'super_admin') return 'IPMR';
        if (rawRole === 'admin') return 'Chieftain';
        return rawRole;
      }
      return null;
    } catch (error) {
      console.error("Error getting user role:", error);
      return null;
    }
  }

  // Listen for auth state changes
  useEffect(() => {
    let unsub = () => {};
    (async () => {
      try {
        await setPersistence(auth, browserLocalPersistence);
      } catch (_) {
        // Ignore persistence errors
      }

      unsub = onAuthStateChanged(auth, async (user) => {
        try {
          if (user) {
            // User is authenticated, get their role
            const role = await getUserRole(user.uid);
            setCurrentUser(user);
            setUserRole(role);
          } else {
            // User is not authenticated
            setCurrentUser(null);
            setUserRole(null);
          }
        } catch (err) {
          console.error('Auth state change error:', err);
          setCurrentUser(null);
          setUserRole(null);
        } finally {
          setLoading(false);
        }
      });
    })();

    return () => unsub();
  }, []);

  useEffect(() => {
    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];

    const clearTimer = () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
    };

    const startTimer = () => {
      clearTimer();
      inactivityTimerRef.current = setTimeout(async () => {
        try {
          await logout();
        } catch (err) {
          console.error('Auto logout failed:', err);
        }
      }, INACTIVITY_TIMEOUT_MS);
    };

    const handleActivity = () => {
      if (currentUser) {
        startTimer();
      }
    };

    if (currentUser) {
      activityEvents.forEach((event) => window.addEventListener(event, handleActivity));
      startTimer();
    } else {
      clearTimer();
    }

    return () => {
      activityEvents.forEach((event) => window.removeEventListener(event, handleActivity));
      clearTimer();
    };
  }, [currentUser]);

  const value = {
    currentUser,
    userRole,
    signup,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
