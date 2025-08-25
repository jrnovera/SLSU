import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  signInAnonymously,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

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

  // Listen for auth state changes and ensure an authenticated session (anonymous if needed)
  useEffect(() => {
    let unsub = () => {};
    (async () => {
      try {
        await setPersistence(auth, browserLocalPersistence);
      } catch (_) {}

      unsub = onAuthStateChanged(auth, async (user) => {
        try {
          if (!user) {
            // Ensure we are authenticated for rules that require request.auth
            const anon = await signInAnonymously(auth);
            user = anon.user;
          }
          const role = await getUserRole(user.uid);
          setCurrentUser(user);
          setUserRole(role);
        } catch (err) {
          console.error('Auth init error:', err);
          setCurrentUser(null);
          setUserRole(null);
        } finally {
          setLoading(false);
        }
      });
    })();

    return () => unsub();
  }, []);

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
