// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAgviSnkIO5F_uinfJXEch9flf38osxgs8",
  authDomain: "bantay-lahi-project.firebaseapp.com",
  projectId: "bantay-lahi-project",
  storageBucket: "bantay-lahi-project.appspot.com",
  messagingSenderId: "490782422814",
  appId: "1:490782422814:web:607aa9fe5b59ba823f7b0f",
  measurementId: "G-9K2VVX5XVG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;

// Function to get user role from Firestore
export const getUserRole = async (uid) => {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const userData = userSnap.data();
      const rawRole = userData.role || 'user';
      // Map legacy roles to new roles for backward compatibility
      if (rawRole === 'super_admin') return 'IPMR';
      if (rawRole === 'admin') return 'Chieftain';
      return rawRole;
    }
    
    return 'user'; // Default role
  } catch (error) {
    console.error('Error getting user role:', error);
    return 'user'; // Default to user role on error
  }
};
