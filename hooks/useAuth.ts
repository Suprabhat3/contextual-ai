import { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { auth } from '@/firebase/config';
import { signInAnonymously } from 'firebase/auth';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInAnonymous = async () => {
    try {
      setLoading(true);
      await signInAnonymously(auth);
    } catch (error) {
      console.error('Anonymous sign-in error:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    signInAnonymous,
  };
}