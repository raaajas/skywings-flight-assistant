import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { subscribeToAuth } from "@/services/auth";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuth((nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { user, loading, isAuthenticated: Boolean(user) };
}
