import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { auth, googleProvider } from "./firebase";

export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function loginWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signupWithEmail(email: string, password: string) {
  return createUserWithEmailAndPassword(auth, email, password);
}

export async function loginWithGoogle() {
  return signInWithPopup(auth, googleProvider);
}

export async function logout() {
  return signOut(auth);
}

export async function getIdToken(): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Not authenticated");
  }
  return user.getIdToken();
}
