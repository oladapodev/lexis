import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInAnonymously, 
  User,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { UserProfile } from '../types';
import { getRandomAvatarSeed } from './avatarUtils';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signInAnon: () => Promise<void>;
  signOut: () => Promise<void>;
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setThemeState] = useState<'light' | 'dark' | 'system'>((localStorage.getItem('theme') as 'light' | 'dark' | 'system') || 'system');

  const applyTheme = (t: 'light' | 'dark' | 'system') => {
    const root = document.documentElement;
    let actualTheme: 'light' | 'dark' = 'light';

    if (t === 'system') {
      actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      actualTheme = t;
    }

    if (actualTheme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      root.style.colorScheme = 'light';
    }
  };

  const setTheme = async (t: 'light' | 'dark' | 'system') => {
    setThemeState(t);
    localStorage.setItem('theme', t);
    applyTheme(t);

    if (user && !user.isAnonymous) {
      try {
        await setDoc(doc(db, 'users', user.uid), { theme: t }, { merge: true });
      } catch (e) {
        console.error("Failed to save theme preference:", e);
      }
    }
  };

  useEffect(() => {
    // Initial theme apply
    applyTheme(theme);
    
    // Listen for system theme changes if in system mode
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      // Re-apply if we are in system mode
      const currentTheme = localStorage.getItem('theme') as any || 'system';
      if (currentTheme === 'system') applyTheme('system');
    };
    mediaQuery.addEventListener('change', handleSystemChange);
    
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, [theme]);

  useEffect(() => {
    // Set persistence once on mount
    setPersistence(auth, browserLocalPersistence).catch(err => {
      console.error("Persistence failed:", err);
    });

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const userDoc = doc(db, 'users', user.uid);
        const snapshot = await getDoc(userDoc);
        
        if (!snapshot.exists()) {
          const newProfile: UserProfile = {
            uid: user.uid,
            email: user.email || null,
            displayName: user.displayName || 'Guest',
            photoURL: user.photoURL || null,
            avatarSeed: !user.photoURL ? getRandomAvatarSeed() : null,
            theme: 'system',
          };
          await setDoc(userDoc, {
            ...newProfile,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          setProfile(newProfile);
        } else {
          const profileData = snapshot.data() as UserProfile;
          setProfile(profileData);
          
          // Only sync theme FROM cloud if we haven't set a local override in this session
          // or if the cloud theme is more specific than 'system'
          const localTheme = localStorage.getItem('theme');
          if (!localTheme && profileData.theme) {
            setThemeState(profileData.theme as any);
            applyTheme(profileData.theme as any);
          }
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  const signIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        console.warn('Sign-in popup closed by user');
      } else {
        console.error('Sign-in error:', error);
      }
    }
  };

  const signInAnon = async () => {
    try {
      await signInAnonymously(auth);
    } catch (error) {
      console.error('Anonymous sign-in error:', error);
      setLoading(false);
    }
  };

  const signOut = () => auth.signOut();

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signInAnon, signOut, theme, setTheme }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
