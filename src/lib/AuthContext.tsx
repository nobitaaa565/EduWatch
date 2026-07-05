import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabase';
import { userService } from '../services/userService';

export interface User {
  id: string;
  username: string;
  email?: string;
  fullName: string;
  bio: string;
  location: string;
  website: string;
  expertise: string[];
  profileImage: string;
  joinedDate: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithFacebook: () => Promise<void>;
  loginWithEmail: (emailOrUsername: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, fullName: string) => Promise<void>;
  login: (username: string) => void;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setLoading(true);
        const authUser = session.user;
        try {
          const dbProfile = await userService.getUserProfile(authUser.id);

          const mappedUser: User = {
            id: authUser.id,
            username: dbProfile?.username || authUser.email?.split('@')[0] || 'user',
            email: dbProfile?.email || authUser.email || '',
            fullName: dbProfile?.fullName || authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
            bio: dbProfile?.bio || '',
            location: (dbProfile as any)?.location || '',
            website: (dbProfile as any)?.website || '',
            expertise: (dbProfile as any)?.expertise || [],
            profileImage: dbProfile?.profileImage || authUser.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
            joinedDate: (dbProfile as any)?.joinedDate || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          };

          if (!dbProfile || !dbProfile.email) {
            if (sessionStorage.getItem('signing_up') !== 'true') {
              await userService.syncProfile({
                uid: authUser.id,
                username: mappedUser.username,
                fullName: mappedUser.fullName,
                profileImage: mappedUser.profileImage,
                bio: mappedUser.bio,
                email: authUser.email || '',
                ...mappedUser
              } as any);
            }
          }

          if (sessionStorage.getItem('signing_up') !== 'true' || dbProfile) {
            setUser(mappedUser);
          }
        } catch (err) {
          console.error("Error retrieving user profile:", err);
          if (sessionStorage.getItem('signing_up') !== 'true') {
            const fallbackUser: User = {
              id: authUser.id,
              username: authUser.email?.split('@')[0] || 'user',
              email: authUser.email || '',
              fullName: authUser.user_metadata?.full_name || 'User',
              bio: '',
              location: '',
              website: '',
              expertise: [],
              profileImage: authUser.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
              joinedDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
            };
            setUser(fallbackUser);
          }
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loginWithGoogle = async () => {
    sessionStorage.removeItem('feed_data');
    sessionStorage.removeItem('feed_scroll_pos');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          prompt: 'select_account',
        },
      },
    });
    if (error) throw error;
  };

  const loginWithFacebook = async () => {
    sessionStorage.removeItem('feed_data');
    sessionStorage.removeItem('feed_scroll_pos');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) throw error;
  };

  const loginWithEmail = async (emailOrUsername: string, pass: string) => {
    sessionStorage.removeItem('feed_data');
    sessionStorage.removeItem('feed_scroll_pos');
    let emailStr = emailOrUsername.trim();
    if (!emailStr.includes('@')) {
      const profile = await userService.getUserByUsername(emailStr);
      if (!profile || !profile.email) {
        throw new Error('No registered account found with that username.');
      }
      emailStr = profile.email;
    }
    const { error } = await supabase.auth.signInWithPassword({
      email: emailStr,
      password: pass,
    });
    if (error) throw error;
  };

  const signUpWithEmail = async (emailStr: string, pass: string, fullName: string) => {
    sessionStorage.setItem('signing_up', 'true');
    sessionStorage.removeItem('feed_data');
    sessionStorage.removeItem('feed_scroll_pos');
    try {
      const { error, data } = await supabase.auth.signUp({
        email: emailStr,
        password: pass,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });
      if (error) throw error;

      const authUser = data.user;
      if (!authUser) throw new Error('Sign up failed');

      const initialUsername = emailStr.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '') || 'user';
      const defaultUserImage = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80';
      const joinedDateStr = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      await userService.syncProfile({
        uid: authUser.id,
        username: initialUsername,
        fullName: fullName,
        email: emailStr,
        profileImage: defaultUserImage,
        bio: '',
        location: '',
        website: '',
        expertise: [],
        joinedDate: joinedDateStr,
      } as any);

      const mappedUser: User = {
        id: authUser.id,
        username: initialUsername,
        email: emailStr,
        fullName: fullName,
        bio: '',
        location: '',
        website: '',
        expertise: [],
        profileImage: defaultUserImage,
        joinedDate: joinedDateStr,
      };

      setUser(mappedUser);
    } finally {
      sessionStorage.removeItem('signing_up');
    }
  };

  const login = (username: string) => {
    sessionStorage.removeItem('feed_data');
    sessionStorage.removeItem('feed_scroll_pos');
    const newUser: User = {
      id: Math.random().toString(36).substring(2, 9),
      username: username,
      fullName: '',
      bio: '',
      location: '',
      website: '',
      expertise: [],
      profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      joinedDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    };
    setUser(newUser);
  };

  const logout = async () => {
    sessionStorage.removeItem('feed_data');
    sessionStorage.removeItem('feed_scroll_pos');
    await supabase.auth.signOut();
    setUser(null);
  };

  const updateProfile = async (updates: Partial<User>) => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;

    await userService.syncProfile({
      uid: authUser.id,
      ...updates
    } as any);

    setUser(prev => prev ? { ...prev, ...updates } : null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      loginWithGoogle,
      loginWithFacebook,
      loginWithEmail,
      signUpWithEmail,
      login,
      logout,
      updateProfile,
      isAuthenticated: !loading && !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
