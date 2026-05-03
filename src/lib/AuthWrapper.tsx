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
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signInAnon: () => Promise<void>;
  signOut: () => Promise<void>;
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toolbarPosition: 'top' | 'bottom';
  setToolbarPosition: (pos: 'top' | 'bottom') => void;
  showFloatingMenu: boolean;
  setShowFloatingMenu: (show: boolean) => void;
  showBubbleMenu: boolean;
  setShowBubbleMenu: (show: boolean) => void;
  autoSave: boolean;
  setAutoSave: (enabled: boolean) => void;
  setAvatarSeed: (seed: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setThemeState] = useState<'light' | 'dark' | 'system'>((localStorage.getItem('theme') as 'light' | 'dark' | 'system') || 'system');
  const [toolbarPosition, setToolbarPositionState] = useState<'top' | 'bottom'>((localStorage.getItem('toolbarPosition') as 'top' | 'bottom') || 'top');
  const [showFloatingMenu, setShowFloatingMenuState] = useState<boolean>(localStorage.getItem('showFloatingMenu') !== 'false');
  const [showBubbleMenu, setShowBubbleMenuState] = useState<boolean>(localStorage.getItem('showBubbleMenu') !== 'false');
  const [autoSave, setAutoSaveState] = useState<boolean>(localStorage.getItem('autoSave') !== 'false');

  const setAvatarSeed = async (seed: string) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'users', user.uid), { 
        avatarSeed: seed,
        updatedAt: serverTimestamp() 
      }, { merge: true });
      setProfile(prev => prev ? { ...prev, avatarSeed: seed } : null);
      toast.success("Avatar updated");
    } catch (e) {
      console.error("Failed to update avatar:", e);
      toast.error("Failed to update avatar");
    }
  };

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
        await setDoc(doc(db, 'users', user.uid), { 
          theme: t,
          updatedAt: serverTimestamp() 
        }, { merge: true });
      } catch (e) {
        console.error("Failed to save theme preference:", e);
      }
    }
  };

  const setToolbarPosition = async (pos: 'top' | 'bottom') => {
    setToolbarPositionState(pos);
    localStorage.setItem('toolbarPosition', pos);

    if (user && !user.isAnonymous) {
      try {
        await setDoc(doc(db, 'users', user.uid), { 
          toolbarPosition: pos,
          updatedAt: serverTimestamp() 
        }, { merge: true });
      } catch (e) {
        console.error("Failed to save toolbar position preference:", e);
      }
    }
  };

  const setShowFloatingMenu = async (show: boolean) => {
    setShowFloatingMenuState(show);
    localStorage.setItem('showFloatingMenu', String(show));
    if (user && !user.isAnonymous) {
      await setDoc(doc(db, 'users', user.uid), { 
        showFloatingMenu: show,
        updatedAt: serverTimestamp() 
      }, { merge: true }).catch(console.error);
    }
  };

  const setShowBubbleMenu = async (show: boolean) => {
    setShowBubbleMenuState(show);
    localStorage.setItem('showBubbleMenu', String(show));
    if (user && !user.isAnonymous) {
      await setDoc(doc(db, 'users', user.uid), { 
        showBubbleMenu: show,
        updatedAt: serverTimestamp() 
      }, { merge: true }).catch(console.error);
    }
  };

  const setAutoSave = async (enabled: boolean) => {
    setAutoSaveState(enabled);
    localStorage.setItem('autoSave', String(enabled));
    if (user && !user.isAnonymous) {
      await setDoc(doc(db, 'users', user.uid), { 
        autoSave: enabled,
        updatedAt: serverTimestamp() 
      }, { merge: true }).catch(console.error);
    }
  };

  useEffect(() => {
    applyTheme(theme);
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      const currentTheme = localStorage.getItem('theme') as any || 'system';
      if (currentTheme === 'system') applyTheme('system');
    };
    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, [theme]);

  useEffect(() => {
    setPersistence(auth, browserLocalPersistence).catch(console.error);
    const unsubscribeAuth = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (!u) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        const userDoc = doc(db, 'users', u.uid);
        const snapshot = await getDoc(userDoc);
        if (!snapshot.exists()) {
          const newProfile: UserProfile = {
            uid: u.uid,
            email: u.email || null,
            displayName: u.displayName || 'Guest',
            photoURL: u.photoURL || null,
            avatarSeed: !u.photoURL ? getRandomAvatarSeed(u.uid) : null,
            theme: 'system',
          };
          try {
            await setDoc(userDoc, { ...newProfile, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
          } catch (error) {
            console.error("Failed to write new user profile:", error);
          }
          setProfile(newProfile);
          return;
        }

        const profileData = snapshot.data() as UserProfile;
        setProfile(profileData);

        // Ensure every user has an avatar seed if they don't have a photoURL
        if (!profileData.avatarSeed && !profileData.photoURL) {
          const seed = getRandomAvatarSeed(u.uid);
          try {
            await setDoc(userDoc, { avatarSeed: seed, updatedAt: serverTimestamp() }, { merge: true });
            setProfile(p => p ? { ...p, avatarSeed: seed } : null);
          } catch (error) {
            console.error("Failed to update avatar seed:", error);
          }
        }

        if (!localStorage.getItem('theme') && profileData.theme) {
          setThemeState(profileData.theme);
          applyTheme(profileData.theme);
        }
        if (!localStorage.getItem('toolbarPosition') && profileData.toolbarPosition) {
          setToolbarPositionState(profileData.toolbarPosition);
        }
        if (profileData.showFloatingMenu !== undefined) setShowFloatingMenuState(profileData.showFloatingMenu);
        if (profileData.showBubbleMenu !== undefined) setShowBubbleMenuState(profileData.showBubbleMenu);
        if (profileData.autoSave !== undefined) setAutoSaveState(profileData.autoSave);
      } catch (error) {
        console.error("Failed to load user profile:", error);
        setProfile({
          uid: u.uid,
          email: u.email || null,
          displayName: u.displayName || 'Guest',
          photoURL: u.photoURL || null,
          avatarSeed: u.photoURL ? null : getRandomAvatarSeed(u.uid),
          theme: 'system',
        });
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider).catch(console.error);
  };

  const signInAnon = async () => {
    try {
      await signInAnonymously(auth);
    } catch (error: any) {
      console.error("Anonymous sign-in error:", error);
      if (error.code === 'auth/admin-restricted-operation') {
        toast.error("Collaborative editing restricted", {
          description: "Anonymous Auth is likely disabled. Please enable it in the Firebase console or log in with Google.",
          duration: 6000
        });
      } else {
        toast.error("Failed to enter workspace anonymously.");
      }
    }
  };

  const signOut = () => auth.signOut();

  return (
    <AuthContext.Provider value={{ 
      user, profile, loading, signIn, signInAnon, signOut, 
      theme, setTheme, toolbarPosition, setToolbarPosition,
      showFloatingMenu, setShowFloatingMenu, showBubbleMenu, setShowBubbleMenu,
      autoSave, setAutoSave, setAvatarSeed
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
