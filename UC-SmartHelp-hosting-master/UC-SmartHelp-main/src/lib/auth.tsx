import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { auth } from "@/integrations/supabase/client"; 
import { onAuthStateChanged, User, signOut as firebaseSignOut } from "firebase/auth";

type AppRole = "student" | "staff" | "admin";

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  roles: AppRole[];
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  roles: [],
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || "https://uc-smarthelp-main.onrender.com";

  const fetchUserData = async (firebaseUser: User) => {
    try {
      // FIX: Changed from /api/user-profile to /api/google-auth
      const response = await fetch(`${API_URL}/api/google-auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: firebaseUser.email,
          firstName: firebaseUser.displayName?.split(' ')[0] || 'User',
          lastName: firebaseUser.displayName?.split(' ')[1] || 'Student',
          profileImage: firebaseUser.photoURL
        })
      });

      if (response.ok) {
        const data = await response.json();
        setProfile({
          id: data.id,
          first_name: data.firstName,
          last_name: data.lastName,
          username: data.username
        });
        setRoles([data.role as AppRole]);
      }
    } catch (error) {
      console.error("Auth Handshake Failed:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchUserData(currentUser);
      } else {
        setProfile(null);
        setRoles([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setProfile(null);
    setRoles([]);
  };

  return (
    <AuthContext.Provider value={{ user, profile, roles, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
