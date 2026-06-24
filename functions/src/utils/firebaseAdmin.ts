import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT;
if (serviceAccountVar) {
  try {
    const serviceAccount = JSON.parse(serviceAccountVar);
    initializeApp({
      credential: cert(serviceAccount)
    });
  } catch (err) {
    console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT env var:", err);
    initializeApp();
  }
} else {
  initializeApp();
}

export const db = getFirestore();
