
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// --- FIREBASE CONFIGURATION INSTRUCTIONS ---
// 1. Go to the Firebase Console: https://console.firebase.google.com/
// 2. Create a new project or select an existing one.
// 3. Register a new Web App (</> icon).
// 4. Copy the "firebaseConfig" object from the SDK setup step.
// 5. Replace the placeholder object below with your actual configuration.

// PASTE YOUR CONFIG HERE

const firebaseConfig = {
  apiKey: "AIzaSyA5ou-l2cTCGgqj9RowQd2OUvpppb-INm0",
  authDomain: "password-manager-a4336.firebaseapp.com",
  projectId: "password-manager-a4336",
  storageBucket: "password-manager-a4336.firebasestorage.app",
  messagingSenderId: "521192537740",
  appId: "1:521192537740:web:0356baac181a2d346585a9"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Authentication
// Use this to create user flows (Login, Sign Up, etc.)
export const auth = getAuth(app);

// Initialize Firestore Database
// Use this to store User data, Projects, and Threads in the cloud
export const db = getFirestore(app);

export default app;
