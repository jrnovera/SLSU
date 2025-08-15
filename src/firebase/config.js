// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB44NyIlAI8pBqT5j2YrtIwdfguy11rmvc",
  authDomain: "rkis-32486.firebaseapp.com",
  projectId: "rkis-32486",
  storageBucket: "rkis-32486.firebasestorage.app",
  messagingSenderId: "67596423859",
  appId: "1:67596423859:web:2d166e0e5931b5404e96c6",
  measurementId: "G-MG3NK196P0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;

// Function to get user role from Firestore
export const getUserRole = async (uid) => {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const userData = userSnap.data();
      return userData.role || 'user'; // Default to 'user' if role is not specified
    }
    
    return 'user'; // Default role
  } catch (error) {
    console.error('Error getting user role:', error);
    return 'user'; // Default to user role on error
  }
};
