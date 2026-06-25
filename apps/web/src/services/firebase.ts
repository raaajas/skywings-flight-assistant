import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth, GoogleAuthProvider } from "firebase/auth";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

import { getFirestore, doc, getDoc } from "firebase/firestore";

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

const useEmulators = import.meta.env.VITE_USE_FIREBASE_EMULATORS === "true";
if (useEmulators) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
}

const appCheckSiteKey = import.meta.env.VITE_FIREBASE_APPCHECK_SITE_KEY;
if (appCheckSiteKey) {
  if (import.meta.env.DEV) {
    (globalThis as Record<string, unknown>).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(appCheckSiteKey),
    isTokenAutoRefreshEnabled: true,
  });
}

let cachedApiBaseUrl: string = "";

export async function resolveApiBaseUrl(): Promise<string> {
  if (cachedApiBaseUrl) {
    return cachedApiBaseUrl;
  }

  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (useEmulators || (envUrl && envUrl.includes("localhost"))) {
    cachedApiBaseUrl = envUrl ?? "/api";
    return cachedApiBaseUrl;
  }

  try {
    const docRef = doc(db, "config", "api");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data && data.url) {
        cachedApiBaseUrl = data.url;
        console.log("Resolved API URL from Firestore:", cachedApiBaseUrl);
        return cachedApiBaseUrl;
      }
    }
  } catch (err) {
    console.error("Failed to resolve API URL from Firestore:", err);
  }

  cachedApiBaseUrl = envUrl ?? "/api";
  return cachedApiBaseUrl;
}
