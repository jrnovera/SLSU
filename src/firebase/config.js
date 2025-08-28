// firebase/config.js
// Initialize Firebase (HMR-safe) and export SDK instances.
// Storage is explicitly pointed to the console bucket to avoid upload mismatches.

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// --- Firebase Web Config ---
const firebaseConfig = {
  apiKey: "AIzaSyAgviSnkIO5F_uinfJXEch9flf38osxgs8",
  authDomain: "bantay-lahi-project.firebaseapp.com",
  projectId: "bantay-lahi-project",
  // Keep this for metadata; we also pass the gs:// below to lock the bucket
  storageBucket: "bantay-lahi-project.firebasestorage.app",
  messagingSenderId: "490782422814",
  appId: "1:490782422814:web:607aa9fe5b59ba823f7b0f",
  measurementId: "G-9K2VVX5XVG",
};

// --- App (avoid re-initializing during hot reloads) ---
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// --- SDK instances ---
export const auth = getAuth(app);
export const db = getFirestore(app);

// 🔒 Lock to the exact Storage bucket shown in Firebase Console Files tab:
const STORAGE_BUCKET_GS = "gs://bantay-lahi-project.firebasestorage.app";
export const storage = getStorage(app, STORAGE_BUCKET_GS);

export default app;

// --- Helper: fetch user role with legacy mapping ---
export const getUserRole = async (uid) => {
  try {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      const rawRole = userData.role || "user";
      // Back-compat role names
      if (rawRole === "super_admin") return "IPMR";
      if (rawRole === "admin") return "Chieftain";
      return rawRole;
    }
    return "user";
  } catch (error) {
    console.error("Error getting user role:", error);
    return "user";
  }
};
