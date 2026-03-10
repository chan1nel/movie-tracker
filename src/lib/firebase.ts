// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, initializeFirestore } from "firebase/firestore";

// TODO: Replace with your app's Firebase project configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase App globally with guards for build-time environments
let app;
let auth: any;
let db: any;
let provider: any;

try {
  const isBrowser = typeof window !== "undefined";
  
  // Helper to check if a variable is defined and not a placeholder
  const isValid = (val: string | undefined) => !!val && val !== "Empty";

  const hasCriticalVars = isValid(process.env.NEXT_PUBLIC_FIREBASE_API_KEY) && 
                         isValid(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);

  if (isBrowser || hasCriticalVars) {
    // Check for "Empty" placeholders and warn if found
    const envVars = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
    };

    const emptyVars = Object.entries(envVars)
      .filter(([_, value]) => value === "Empty")
      .map(([key]) => key);

    if (emptyVars.length > 0) {
      console.warn(`Firebase configuration is incomplete. The following variables are set to 'Empty': ${emptyVars.join(", ")}. Please check your Vercel environment variables.`);
    }
    
    // Only initialize if we have at least an API key that isn't "Empty"
    if (isValid(process.env.NEXT_PUBLIC_FIREBASE_API_KEY)) {
      app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
      auth = getAuth(app);
      db = initializeFirestore(app, {
        experimentalForceLongPolling: true,
      });
      provider = new GoogleAuthProvider();
    }
  }
} catch (error) {
  console.error("Firebase initialization failed:", error);
}

export { app, auth, db, provider };
